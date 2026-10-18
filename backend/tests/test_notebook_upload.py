"""
End-to-end notebook ↔ document upload contract tests.

These exercise the *real* FastAPI app (routers, dependency wiring, request
parsing, response serialisation) against a stateful in-memory database that
faithfully enforces the ``documents.notebook_id -> notebooks.id`` foreign key.

That enforcement is the crux of the reported bug: an unknown notebook id used
to reach ``INSERT INTO documents`` and blow up as an ``asyncpg``
ForeignKeyViolationError (HTTP 500). These tests prove the API now validates the
reference up front and returns a structured 404 instead.

The DB is injected at the service singleton boundary (the same object the
routers import), so the request path being tested is the production one.
"""
import uuid
from datetime import datetime, UTC

import pytest
from httpx import AsyncClient, ASGITransport

from app.services.db_service import NotebookConflictError, NotebookNotFoundError


# ─── Faithful in-memory database (models the FK constraint) ───────────────────

class FakeDB:
    def __init__(self):
        self.notebooks: dict[str, dict] = {}
        self.documents: dict[str, dict] = {}
        self.conversations: dict[str, dict] = {}

    # -- notebooks ---------------------------------------------------------
    async def create_notebook(self, notebook_id, user_id, session_id, title,
                              description=None, model="openrouter/free", focus="all"):
        now = datetime.now(UTC)
        if notebook_id in self.notebooks:
            nb = self.notebooks[notebook_id]
            same_user = user_id is not None and nb["user_id"] == user_id
            same_session = (
                user_id is None and session_id is not None
                and nb["session_id"] == session_id and nb["user_id"] is None
            )
            if not (same_user or same_session):
                raise NotebookConflictError(notebook_id)
            return dict(nb)
        nb = {
            "id": notebook_id, "user_id": user_id, "session_id": session_id,
            "title": title, "description": description, "model": model, "focus": focus,
            "created_at": now, "updated_at": now,
        }
        self.notebooks[notebook_id] = nb
        return dict(nb)

    async def get_notebook(self, notebook_id):
        nb = self.notebooks.get(notebook_id)
        return dict(nb) if nb else None

    async def list_notebooks(self, user_id, session_id):
        rows = []
        for nb in self.notebooks.values():
            if user_id and nb["user_id"] == user_id:
                rows.append(nb)
            elif session_id and nb["session_id"] == session_id and nb["user_id"] is None:
                rows.append(nb)
        return [dict(r) for r in rows]

    async def verify_notebook_ownership(self, notebook_id, user_id, session_id):
        nb = self.notebooks.get(notebook_id)
        if not nb:
            return False
        if user_id and nb.get("user_id") == user_id:
            return True
        if session_id and nb.get("session_id") == session_id and nb.get("user_id") is None:
            return True
        return False

    # -- documents ---------------------------------------------------------
    async def create_document(self, doc_id, user_id, session_id, filename,
                              original_filename, mime_type, storage_path,
                              file_size=0, notebook_id=None):
        if notebook_id and notebook_id not in self.notebooks:
            # Models the real FK violation the DB raises.
            raise NotebookNotFoundError(notebook_id)
        now = datetime.now(UTC)
        doc = {
            "id": doc_id, "user_id": user_id, "session_id": session_id,
            "notebook_id": notebook_id, "filename": filename,
            "original_filename": original_filename, "mime_type": mime_type,
            "storage_path": storage_path, "file_size": file_size,
            "status": "queued", "created_at": now,
            "node_count": 0, "image_count": 0, "page_count": 0, "table_count": 0,
        }
        self.documents[doc_id] = doc
        return dict(doc)

    async def get_document(self, doc_id):
        d = self.documents.get(doc_id)
        return dict(d) if d else None

    async def get_document_count(self, user_id, session_id, notebook_id=None):
        return 1 + len([d for d in self.documents.values() if d["notebook_id"] == notebook_id])

    async def list_documents_by_owner(self, user_id, session_id, notebook_id=None):
        return [
            dict(d) for d in self.documents.values()
            if (not notebook_id or d["notebook_id"] == notebook_id)
            and (
                (user_id and d["user_id"] == user_id)
                or (session_id and d["session_id"] == session_id and d["user_id"] is None)
            )
        ]

    async def update_document_status(self, *args, **kwargs):
        return None

    # -- conversations -----------------------------------------------------
    async def create_conversation(self, user_id, title, model=None, focus="all",
                                  conv_id=None, notebook_id=None, session_id=None):
        if notebook_id and notebook_id not in self.notebooks:
            raise NotebookNotFoundError(notebook_id)
        conv_id = conv_id or str(uuid.uuid4())
        conv = {
            "id": conv_id, "user_id": user_id, "session_id": session_id,
            "notebook_id": notebook_id, "title": title, "model": model, "focus": focus,
        }
        self.conversations[conv_id] = conv
        return dict(conv)

    async def list_conversations_by_owner(self, user_id, session_id, notebook_id=None):
        return [
            dict(c) for c in self.conversations.values()
            if (not notebook_id or c["notebook_id"] == notebook_id)
        ]


@pytest.fixture
def fake_db(monkeypatch, tmp_path):
    """Wire a FakeDB into the db_service singleton used by every router."""
    from app.services import db_service as db_mod
    from app.config import settings

    fake = FakeDB()
    for name in (
        "create_notebook", "get_notebook", "list_notebooks",
        "verify_notebook_ownership", "create_document", "get_document",
        "get_document_count", "list_documents_by_owner", "update_document_status",
        "create_conversation", "list_conversations_by_owner",
    ):
        monkeypatch.setattr(db_mod.db_service, name, getattr(fake, name))

    monkeypatch.setattr(settings, "local_storage_path", str(tmp_path / "uploads"))
    # Do not kick off the real ingestion pipeline in a unit test.
    monkeypatch.setattr("app.api.documents._run_ingestion", lambda *a, **k: None)
    return fake


async def _client():
    from app.main import app
    return AsyncClient(transport=ASGITransport(app=app), base_url="http://test")


async def _create_notebook(client, session_id, nb_id, title="Notebook"):
    r = await client.post(
        f"/api/notebooks/?session_id={session_id}",
        json={"id": nb_id, "title": title, "model": "openrouter/free", "focus": "all"},
    )
    return r


# ─── 1. Notebook creation persists and returns the canonical id ──────────────

async def test_create_notebook_persists_and_returns_id(fake_db):
    async with await _client() as c:
        r = await _create_notebook(c, "sess-1", "nb-tree-rag", "Tree RAG")
    assert r.status_code == 200
    assert r.json()["id"] == "nb-tree-rag"
    assert "nb-tree-rag" in fake_db.notebooks
    assert fake_db.notebooks["nb-tree-rag"]["session_id"] == "sess-1"


# ─── 2. Upload to a persisted notebook succeeds (frontend request format) ────

async def test_upload_to_valid_notebook_succeeds(fake_db):
    async with await _client() as c:
        await _create_notebook(c, "sess-1", "nb-tree-rag")
        r = await c.post(
            "/api/documents/upload?session_id=sess-1&notebook_id=nb-tree-rag",
            files={"file": ("paper.txt", b"hello world content", "text/plain")},
            data={"notebook_id": "nb-tree-rag"},
        )
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["doc_id"]
    doc = fake_db.documents[body["doc_id"]]
    assert doc["notebook_id"] == "nb-tree-rag"
    assert doc["session_id"] == "sess-1"


# ─── 3. The exact reported failure now returns 404, never 500 ────────────────

async def test_upload_unknown_notebook_returns_404_not_500(fake_db):
    async with await _client() as c:
        # nb-tree-rag was NEVER created for this session.
        r = await c.post(
            "/api/documents/upload?session_id=185e08aa&notebook_id=nb-tree-rag",
            files={"file": ("paper.txt", b"data", "text/plain")},
            data={"notebook_id": "nb-tree-rag"},
        )
    assert r.status_code == 404
    assert "nb-tree-rag" in r.json()["detail"]
    # Nothing partial was persisted, no orphan document row.
    assert fake_db.documents == {}


async def test_upload_notebook_owned_by_other_session_returns_404(fake_db):
    async with await _client() as c:
        await _create_notebook(c, "sess-a", "nb-private")
        # A different session must not be able to upload into sess-a's notebook.
        r = await c.post(
            "/api/documents/upload?session_id=sess-b&notebook_id=nb-private",
            files={"file": ("p.txt", b"x", "text/plain")},
            data={"notebook_id": "nb-private"},
        )
    assert r.status_code == 404
    assert fake_db.documents == {}


# ─── 4. Multiple notebooks stay isolated ────────────────────────────────────

async def test_documents_are_scoped_to_their_notebook(fake_db):
    async with await _client() as c:
        await _create_notebook(c, "sess-1", "nb-A")
        await _create_notebook(c, "sess-1", "nb-B")
        await c.post("/api/documents/upload?session_id=sess-1&notebook_id=nb-A",
                     files={"file": ("a.txt", b"aaa", "text/plain")}, data={"notebook_id": "nb-A"})
        await c.post("/api/documents/upload?session_id=sess-1&notebook_id=nb-B",
                     files={"file": ("b.txt", b"bbb", "text/plain")}, data={"notebook_id": "nb-B"})

        ra = await c.get("/api/documents/?session_id=sess-1&notebook_id=nb-A")
        rb = await c.get("/api/documents/?session_id=sess-1&notebook_id=nb-B")
    a_docs, b_docs = ra.json()["documents"], rb.json()["documents"]
    assert [d["notebook_id"] for d in a_docs] == ["nb-A"]
    assert [d["notebook_id"] for d in b_docs] == ["nb-B"]
    assert a_docs[0]["filename"] == "a.txt"
    assert b_docs[0]["filename"] == "b.txt"


# ─── 5. Conversations share the same guardrail ──────────────────────────────

async def test_conversation_unknown_notebook_returns_404(fake_db):
    async with await _client() as c:
        r = await c.post(
            "/api/conversations/?session_id=sess-1",
            json={"id": "c1", "title": "t", "model": "openrouter/free",
                  "focus": "all", "notebook_id": "nb-tree-rag"},
        )
    assert r.status_code == 404
    assert fake_db.conversations == {}


async def test_conversation_valid_notebook_succeeds(fake_db):
    async with await _client() as c:
        await _create_notebook(c, "sess-1", "nb-tree-rag")
        r = await c.post(
            "/api/conversations/?session_id=sess-1",
            json={"id": "c1", "title": "t", "model": "openrouter/free",
                  "focus": "all", "notebook_id": "nb-tree-rag"},
        )
    assert r.status_code == 200
    assert fake_db.conversations["c1"]["notebook_id"] == "nb-tree-rag"


# ─── 6. Idempotency + concurrency safety of notebook creation ────────────────

async def test_repeated_notebook_creation_is_idempotent(fake_db):
    async with await _client() as c:
        r1 = await _create_notebook(c, "sess-1", "nb-tree-rag")
        r2 = await _create_notebook(c, "sess-1", "nb-tree-rag")
    assert r1.status_code == 200 and r2.status_code == 200
    assert r1.json()["id"] == r2.json()["id"] == "nb-tree-rag"
    assert len(fake_db.notebooks) == 1  # no duplicate row


async def test_same_id_different_owner_conflicts_409(fake_db):
    async with await _client() as c:
        await _create_notebook(c, "sess-a", "nb-shared")
        r = await _create_notebook(c, "sess-b", "nb-shared")
    assert r.status_code == 409
    assert len(fake_db.notebooks) == 1


# ─── 7. Repeated uploads do not corrupt notebook linkage ────────────────────

async def test_repeated_uploads_are_independent_and_valid(fake_db):
    async with await _client() as c:
        await _create_notebook(c, "sess-1", "nb-tree-rag")
        ids = []
        for i in range(3):
            r = await c.post(
                "/api/documents/upload?session_id=sess-1&notebook_id=nb-tree-rag",
                files={"file": (f"f{i}.txt", b"data", "text/plain")},
                data={"notebook_id": "nb-tree-rag"},
            )
            assert r.status_code == 200
            ids.append(r.json()["doc_id"])
    assert len(set(ids)) == 3
    assert all(d["notebook_id"] == "nb-tree-rag" for d in fake_db.documents.values())
