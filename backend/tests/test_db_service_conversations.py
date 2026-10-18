"""
Unit tests for the conversation identity/idempotency contract.

These drive the *real* ``DBService.create_conversation`` against a minimal fake
asyncpg pool, so the unique-violation handling, ownership/notebook identity
matching and FK translation are exercised directly (no HTTP layer).
"""
import asyncpg
import pytest

from app.services.db_service import (
    DBService,
    NotebookNotFoundError,
    ConversationConflictError,
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


def _conn(execute=None, fetchrow=None):
    async def _execute(query, *args):
        if execute:
            return await execute(query, *args)
        return "INSERT 0 1"

    async def _fetchrow(query, *args):
        if fetchrow:
            return await fetchrow(query, *args)
        return None

    return type("C", (), {"execute": staticmethod(_execute), "fetchrow": staticmethod(_fetchrow)})()


def _service(conn):
    svc = DBService()
    svc._pool = _Pool(conn)
    return svc


# ─── Happy path ──────────────────────────────────────────────────────────────

async def test_new_conversation_inserts_and_returns_id():
    calls = []

    async def execute(query, *args):
        calls.append(query)
        return "INSERT 0 1"

    svc = _service(_conn(execute=execute))
    convo = await svc.create_conversation(
        user_id=None, session_id="sess-1", title="T", conv_id="c1", notebook_id="nb-1",
    )
    assert convo["id"] == "c1"
    assert convo["notebook_id"] == "nb-1"
    assert any("INSERT INTO conversations" in q for q in calls)


# ─── FK translation ──────────────────────────────────────────────────────────

async def test_missing_notebook_raises_typed_error():
    async def execute(query, *args):
        raise asyncpg.ForeignKeyViolationError(
            'insert or update on table "conversations" violates foreign key '
            'constraint "conversations_notebook_id_fkey"'
        )

    svc = _service(_conn(execute=execute))
    with pytest.raises(NotebookNotFoundError) as ei:
        await svc.create_conversation(
            user_id=None, session_id="s", title="T", conv_id="c1", notebook_id="nb-missing",
        )
    assert ei.value.notebook_id == "nb-missing"


# ─── Idempotent retry (the original 500) ─────────────────────────────────────

async def test_duplicate_same_owner_and_notebook_is_idempotent():
    async def execute(query, *args):
        raise asyncpg.UniqueViolationError(
            'duplicate key value violates unique constraint "conversations_pkey"'
        )

    async def fetchrow(query, *args):
        return {
            "id": "c1", "user_id": None, "session_id": "sess-1",
            "notebook_id": "nb-1", "title": "First title",
        }

    svc = _service(_conn(execute=execute, fetchrow=fetchrow))
    convo = await svc.create_conversation(
        user_id=None, session_id="sess-1", title="Retried title",
        conv_id="c1", notebook_id="nb-1",
    )
    # Existing row returned unchanged — no overwrite, no duplicate.
    assert convo["id"] == "c1"
    assert convo["title"] == "First title"


async def test_duplicate_same_user_is_idempotent():
    async def execute(query, *args):
        raise asyncpg.UniqueViolationError("duplicate key")

    async def fetchrow(query, *args):
        return {"id": "c1", "user_id": "user-1", "session_id": None, "notebook_id": None}

    svc = _service(_conn(execute=execute, fetchrow=fetchrow))
    convo = await svc.create_conversation(
        user_id="user-1", session_id=None, title="T", conv_id="c1", notebook_id=None,
    )
    assert convo["user_id"] == "user-1"


# ─── Conflict (must NOT silently reuse) ──────────────────────────────────────

async def test_duplicate_different_owner_conflicts():
    async def execute(query, *args):
        raise asyncpg.UniqueViolationError("duplicate key")

    async def fetchrow(query, *args):
        return {"id": "c1", "user_id": None, "session_id": "sess-OTHER", "notebook_id": "nb-1"}

    svc = _service(_conn(execute=execute, fetchrow=fetchrow))
    with pytest.raises(ConversationConflictError):
        await svc.create_conversation(
            user_id=None, session_id="sess-1", title="T", conv_id="c1", notebook_id="nb-1",
        )


async def test_duplicate_different_notebook_conflicts():
    async def execute(query, *args):
        raise asyncpg.UniqueViolationError("duplicate key")

    async def fetchrow(query, *args):
        return {"id": "c1", "user_id": None, "session_id": "sess-1", "notebook_id": "nb-2"}

    svc = _service(_conn(execute=execute, fetchrow=fetchrow))
    with pytest.raises(ConversationConflictError):
        await svc.create_conversation(
            user_id=None, session_id="sess-1", title="T", conv_id="c1", notebook_id="nb-1",
        )


async def test_duplicate_guest_vs_user_owner_conflicts():
    async def execute(query, *args):
        raise asyncpg.UniqueViolationError("duplicate key")

    async def fetchrow(query, *args):
        # Existing row belongs to a logged-in user.
        return {"id": "c1", "user_id": "user-1", "session_id": None, "notebook_id": None}

    svc = _service(_conn(execute=execute, fetchrow=fetchrow))
    # A guest session must never claim a user-owned conversation id.
    with pytest.raises(ConversationConflictError):
        await svc.create_conversation(
            user_id=None, session_id="guest-sess", title="T", conv_id="c1", notebook_id=None,
        )
