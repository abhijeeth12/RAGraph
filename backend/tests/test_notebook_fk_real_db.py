"""
Real-Postgres integration tests for the notebook foreign key contract.

These run against an actual PostgreSQL instance (the same asyncpg code path as
production) and are skipped automatically when ``TEST_DATABASE_URL`` is unset.

    docker run -d --name ragraph-pg-test -e POSTGRES_PASSWORD=postgres \
        -e POSTGRES_DB=ragraph -p 55432:5432 postgres:16-alpine
    $env:TEST_DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:55432/ragraph"
    python -m pytest tests/test_notebook_fk_real_db.py -q
"""
import os
import uuid

import pytest

from app.services.db_service import (
    DBService,
    NotebookConflictError,
    NotebookNotFoundError,
)

TEST_DB = os.getenv("TEST_DATABASE_URL")

pytestmark = pytest.mark.skipif(
    not TEST_DB, reason="TEST_DATABASE_URL not set — skipping real Postgres tests"
)


@pytest.fixture
async def real_db(monkeypatch):
    monkeypatch.setenv("NEON_DATABASE_URL", "")
    monkeypatch.setenv("POSTGRES_URL", "")
    monkeypatch.setenv("DATABASE_URL", TEST_DB)

    svc = DBService()
    assert await svc.connect(), "could not connect to TEST_DATABASE_URL"
    async with svc._pool.acquire() as conn:
        await conn.execute("DELETE FROM messages;")
        await conn.execute("DELETE FROM document_conversation_map;")
        await conn.execute("DELETE FROM documents;")
        await conn.execute("DELETE FROM conversations;")
        await conn.execute("DELETE FROM notebooks;")
    yield svc
    await svc.close()


async def test_notebook_persists_with_canonical_id(real_db):
    nb_id = f"nb-tree-rag-{uuid.uuid4().hex[:6]}"
    nb = await real_db.create_notebook(nb_id, None, "sess-1", "Tree RAG")
    assert nb["id"] == nb_id
    assert nb["session_id"] == "sess-1"
    assert await real_db.verify_notebook_ownership(nb_id, None, "sess-1") is True


async def test_document_insert_references_existing_notebook(real_db):
    nb_id = f"nb-{uuid.uuid4().hex[:6]}"
    await real_db.create_notebook(nb_id, None, "sess-1", "N")
    doc = await real_db.create_document(
        doc_id=str(uuid.uuid4()), user_id=None, session_id="sess-1",
        filename="f.txt", original_filename="f.txt", mime_type="text/plain",
        storage_path="/tmp/f.txt", file_size=3, notebook_id=nb_id,
    )
    assert doc["notebook_id"] == nb_id


async def test_document_insert_missing_notebook_raises_typed_error(real_db):
    """The exact production failure: FK on a non-existent notebook id."""
    with pytest.raises(NotebookNotFoundError):
        await real_db.create_document(
            doc_id=str(uuid.uuid4()), user_id=None, session_id="sess-1",
            filename="f.txt", original_filename="f.txt", mime_type="text/plain",
            storage_path="/tmp/f.txt", file_size=3,
            notebook_id="nb-tree-rag-does-not-exist",
        )


async def test_create_notebook_is_idempotent(real_db):
    nb_id = f"nb-{uuid.uuid4().hex[:6]}"
    a = await real_db.create_notebook(nb_id, None, "sess-1", "N")
    b = await real_db.create_notebook(nb_id, None, "sess-1", "N")
    assert a["id"] == b["id"] == nb_id
    async with real_db._pool.acquire() as conn:
        count = await conn.fetchval("SELECT COUNT(*) FROM notebooks WHERE id = $1", nb_id)
    assert count == 1


async def test_create_notebook_conflict_other_owner(real_db):
    nb_id = f"nb-{uuid.uuid4().hex[:6]}"
    await real_db.create_notebook(nb_id, None, "sess-a", "N")
    with pytest.raises(NotebookConflictError):
        await real_db.create_notebook(nb_id, None, "sess-b", "N")


async def test_deleting_notebook_cascades_documents(real_db):
    nb_id = f"nb-{uuid.uuid4().hex[:6]}"
    await real_db.create_notebook(nb_id, None, "sess-1", "N")
    doc_id = str(uuid.uuid4())
    await real_db.create_document(
        doc_id=doc_id, user_id=None, session_id="sess-1",
        filename="f.txt", original_filename="f.txt", mime_type="text/plain",
        storage_path="/tmp/f.txt", file_size=3, notebook_id=nb_id,
    )
    await real_db.delete_notebook(nb_id)
    assert await real_db.get_document(doc_id) is None
