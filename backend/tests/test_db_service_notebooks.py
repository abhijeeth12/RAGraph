"""
Unit tests for the DB-layer notebook contract added to fix the FK 500.

These drive the *real* ``DBService`` methods against a minimal fake asyncpg
pool, so the ON-CONFLICT idempotency and ForeignKeyViolationError -> typed
exception translation are exercised directly (no HTTP layer involved).
"""
import asyncpg
import pytest

from app.services.db_service import (
    DBService,
    NotebookConflictError,
    NotebookNotFoundError,
)


class _Acquire:
    def __init__(self, conn):
        self._conn = conn

    async def __aenter__(self):
        return self._conn

    async def __aexit__(self, *exc):
        return False


class _Pool:
    def __init__(self, conn):
        self._conn = conn

    def acquire(self):
        return _Acquire(self._conn)


def _service_with(conn):
    svc = DBService()
    svc._pool = _Pool(conn)
    return svc


# ─── create_notebook ─────────────────────────────────────────────────────────

async def test_create_notebook_inserts_when_new():
    calls = []

    async def fetchrow(query, *args):
        calls.append(query)
        if "INSERT INTO notebooks" in query:
            return {"id": args[0]}
        if "SELECT n.*" in query:  # get_notebook
            return {"id": args[0], "user_id": args[1] if len(args) > 1 else None}
        return None

    svc = _service_with(type("C", (), {"fetchrow": staticmethod(fetchrow), "execute": staticmethod(lambda *a, **k: None)})())
    nb = await svc.create_notebook("nb-1", "user-1", None, "Title")
    assert nb["id"] == "nb-1"
    assert any("ON CONFLICT (id) DO NOTHING" in q for q in calls)


async def test_create_notebook_idempotent_for_same_owner():
    state = {"exists": False}

    async def fetchrow(query, *args):
        if "INSERT INTO notebooks" in query:
            if state["exists"]:
                return None            # conflict -> DO NOTHING
            state["exists"] = True
            return {"id": args[0]}
        if "SELECT user_id, session_id FROM notebooks" in query:
            return {"user_id": None, "session_id": "sess-1"}
        if "SELECT n.*" in query:
            return {"id": args[0], "user_id": None, "session_id": "sess-1"}
        return None

    conn = type("C", (), {"fetchrow": staticmethod(fetchrow), "execute": staticmethod(lambda *a, **k: None)})()
    svc = _service_with(conn)

    first = await svc.create_notebook("nb-x", None, "sess-1", "T")
    second = await svc.create_notebook("nb-x", None, "sess-1", "T")
    assert first["id"] == second["id"] == "nb-x"


async def test_create_notebook_conflicts_for_other_owner():
    async def fetchrow(query, *args):
        if "INSERT INTO notebooks" in query:
            return None                # already exists
        if "SELECT user_id, session_id FROM notebooks" in query:
            return {"user_id": None, "session_id": "sess-other"}
        return None

    conn = type("C", (), {"fetchrow": staticmethod(fetchrow), "execute": staticmethod(lambda *a, **k: None)})()
    svc = _service_with(conn)

    with pytest.raises(NotebookConflictError):
        await svc.create_notebook("nb-x", None, "sess-mine", "T")


# ─── create_document: FK translation ────────────────────────────────────────

async def test_create_document_translates_fk_violation():
    async def execute(query, *args):
        raise asyncpg.ForeignKeyViolationError(
            'insert or update on table "documents" violates foreign key '
            'constraint "documents_notebook_id_fkey"'
        )

    conn = type("C", (), {"execute": staticmethod(execute), "fetchrow": staticmethod(lambda *a, **k: None)})()
    svc = _service_with(conn)

    with pytest.raises(NotebookNotFoundError) as ei:
        await svc.create_document(
            doc_id="d1", user_id=None, session_id="s1", filename="f.txt",
            original_filename="f.txt", mime_type="text/plain",
            storage_path="/tmp/f.txt", file_size=1, notebook_id="nb-missing",
        )
    assert ei.value.notebook_id == "nb-missing"


async def test_create_document_succeeds_without_notebook():
    async def execute(query, *args):
        return "INSERT 0 1"

    async def fetchrow(query, *args):
        return {"id": "d1", "notebook_id": None}

    conn = type("C", (), {"execute": staticmethod(execute), "fetchrow": staticmethod(fetchrow)})()
    svc = _service_with(conn)
    doc = await svc.create_document(
        doc_id="d1", user_id=None, session_id="s1", filename="f.txt",
        original_filename="f.txt", mime_type="text/plain",
        storage_path="/tmp/f.txt", file_size=1, notebook_id=None,
    )
    assert doc["id"] == "d1"


# ─── create_conversation: FK translation ────────────────────────────────────

async def test_create_conversation_translates_fk_violation():
    async def execute(query, *args):
        raise asyncpg.ForeignKeyViolationError("foreign key constraint violated")

    conn = type("C", (), {"execute": staticmethod(execute)})()
    svc = _service_with(conn)

    with pytest.raises(NotebookNotFoundError):
        await svc.create_conversation(
            user_id=None, session_id="s1", title="t", notebook_id="nb-missing",
        )
