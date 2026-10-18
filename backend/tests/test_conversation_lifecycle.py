"""
End-to-end conversation lifecycle tests against a REAL PostgreSQL instance.

Skipped automatically when ``TEST_DATABASE_URL`` is unset. The real
``DBService`` is wired onto the running FastAPI app, so these tests exercise the
actual routers + asyncpg + PostgreSQL constraints (unique PK, notebook FK,
cascade delete) rather than mocks.

    docker run -d --name ragraph-pg-test -e POSTGRES_PASSWORD=postgres \
        -e POSTGRES_DB=ragraph -p 55432:5432 postgres:16-alpine
    $env:TEST_DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:55432/ragraph"
    python -m pytest tests/test_conversation_lifecycle.py -q
"""
import asyncio
import os
import uuid

import pytest
from httpx import ASGITransport, AsyncClient

from app.services.db_service import DBService

TEST_DB = os.getenv("TEST_DATABASE_URL")

pytestmark = pytest.mark.skipif(
    not TEST_DB, reason="TEST_DATABASE_URL not set — skipping real Postgres tests"
)

_CONV_CHILD_TABLES = (
    "messages",
    "document_conversation_map",
    "documents",
    "conversations",
    "notebooks",
)


@pytest.fixture
async def api(monkeypatch):
    """Yield ``(client, real_db)`` with a clean database behind the real app."""
    from app.services import db_service as db_mod

    monkeypatch.setenv("NEON_DATABASE_URL", "")
    monkeypatch.setenv("POSTGRES_URL", "")
    monkeypatch.setenv("DATABASE_URL", TEST_DB)

    real = DBService()
    assert await real.connect(), "could not connect to TEST_DATABASE_URL"
    async with real._pool.acquire() as conn:
        for table in _CONV_CHILD_TABLES:
            await conn.execute(f"DELETE FROM {table}")

    # Point the app singleton at the real pool so every router uses real SQL.
    monkeypatch.setattr(db_mod.db_service, "_pool", real._pool)

    from app.main import app

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        yield client, real

    await real.close()


async def _notebook(client, session, nb_id):
    r = await client.post(
        f"/api/notebooks/?session_id={session}",
        json={"id": nb_id, "title": nb_id, "model": "openrouter/free", "focus": "all"},
    )
    assert r.status_code == 200, r.text
    return r.json()


async def _create_conv(client, session, conv_id, notebook_id=None, title="T"):
    return await client.post(
        f"/api/conversations/?session_id={session}",
        json={"id": conv_id, "title": title, "model": "openrouter/free",
              "focus": "all", "notebook_id": notebook_id},
    )


# ─── 1. Create a genuinely new conversation ─────────────────────────────────

async def test_create_new_conversation_is_persisted(api):
    client, _ = api
    cid = str(uuid.uuid4())
    r = await _create_conv(client, "sess-1", cid)
    assert r.status_code == 200, r.text
    assert r.json()["id"] == cid

    listed = await client.get("/api/conversations/?session_id=sess-1")
    assert listed.status_code == 200
    assert [c["id"] for c in listed.json()] == [cid]


# ─── 2. Multiple messages against the same persisted id ──────────────────────

async def test_multiple_messages_reuse_single_conversation(api):
    client, real = api
    cid = str(uuid.uuid4())
    await _create_conv(client, "sess-1", cid)

    for i in range(3):
        r = await client.post(
            f"/api/conversations/{cid}/messages?session_id=sess-1",
            json={"role": "user", "content": f"msg {i}"},
        )
        assert r.status_code == 200, r.text
        await asyncio.sleep(0.005)  # keep created_at strictly ordered

    msgs = await client.get(f"/api/conversations/{cid}/messages?session_id=sess-1")
    body = msgs.json()
    assert [m["content"] for m in body] == ["msg 0", "msg 1", "msg 2"]

    async with real._pool.acquire() as conn:
        assert await conn.fetchval("SELECT COUNT(*) FROM conversations WHERE id=$1", cid) == 1


# ─── 3. Retrying creation with the same id (the reported 500) ────────────────

async def test_retry_same_creation_is_idempotent_not_500(api):
    client, real = api
    cid = str(uuid.uuid4())
    await _notebook(client, "sess-1", "nb-A")

    first = await _create_conv(client, "sess-1", cid, "nb-A", title="Original")
    second = await _create_conv(client, "sess-1", cid, "nb-A", title="Retry")

    assert first.status_code == 200
    assert second.status_code == 200, second.text  # was 500 before the fix
    # The original row is reused unchanged; no duplicate is created.
    assert second.json()["id"] == cid
    assert second.json()["title"] == "Original"
    async with real._pool.acquire() as conn:
        assert await conn.fetchval("SELECT COUNT(*) FROM conversations WHERE id=$1", cid) == 1


# ─── 4. Concurrent creation of the same id ──────────────────────────────────

async def test_concurrent_create_same_id_creates_one_row(api):
    client, real = api
    cid = str(uuid.uuid4())
    results = await asyncio.gather(*[_create_conv(client, "sess-1", cid) for _ in range(4)])
    assert all(r.status_code == 200 for r in results), [r.text for r in results]
    async with real._pool.acquire() as conn:
        assert await conn.fetchval("SELECT COUNT(*) FROM conversations WHERE id=$1", cid) == 1


# ─── 8. Conflicting notebook / ownership identity ───────────────────────────

async def test_same_id_different_notebook_conflicts_409(api):
    client, _ = api
    await _notebook(client, "sess-1", "nb-A")
    await _notebook(client, "sess-1", "nb-B")
    cid = str(uuid.uuid4())
    assert (await _create_conv(client, "sess-1", cid, "nb-A")).status_code == 200
    conflict = await _create_conv(client, "sess-1", cid, "nb-B")
    assert conflict.status_code == 409, conflict.text


async def test_same_id_different_owner_conflicts_409(api):
    client, _ = api
    cid = str(uuid.uuid4())
    assert (await _create_conv(client, "sess-1", cid)).status_code == 200
    conflict = await _create_conv(client, "sess-2", cid)
    assert conflict.status_code == 409, conflict.text


# ─── 5. Restoring/continuing an existing conversation stays consistent ───────

async def test_continue_existing_conversation_does_not_recreate(api):
    client, real = api
    cid = str(uuid.uuid4())
    await _create_conv(client, "sess-1", cid, title="Keep me")
    # Simulate "send another message later" (as if after a refresh).
    await client.post(f"/api/conversations/{cid}/messages?session_id=sess-1",
                      json={"role": "user", "content": "follow-up"})
    # The list still shows exactly one conversation with the original title.
    listed = (await client.get("/api/conversations/?session_id=sess-1")).json()
    assert len(listed) == 1 and listed[0]["title"] == "Keep me"


# ─── 6/7. Notebook isolation and separate conversations ─────────────────────

async def test_notebooks_keep_separate_conversations(api):
    client, _ = api
    await _notebook(client, "sess-1", "nb-A")
    await _notebook(client, "sess-1", "nb-B")
    ca, cb = str(uuid.uuid4()), str(uuid.uuid4())
    await _create_conv(client, "sess-1", ca, "nb-A")
    await _create_conv(client, "sess-1", cb, "nb-B")

    la = (await client.get("/api/conversations/?session_id=sess-1&notebook_id=nb-A")).json()
    lb = (await client.get("/api/conversations/?session_id=sess-1&notebook_id=nb-B")).json()
    assert [c["id"] for c in la] == [ca]
    assert [c["id"] for c in lb] == [cb]


# ─── 9/10. Invalid references, deletion, ownership isolation ────────────────

async def test_unknown_notebook_returns_404(api):
    client, real = api
    r = await _create_conv(client, "sess-1", str(uuid.uuid4()), "nb-does-not-exist")
    assert r.status_code == 404, r.text
    async with real._pool.acquire() as conn:
        assert await conn.fetchval("SELECT COUNT(*) FROM conversations") == 0


async def test_message_to_unknown_conversation_returns_404(api):
    client, _ = api
    r = await client.post(
        f"/api/conversations/{uuid.uuid4()}/messages?session_id=sess-1",
        json={"role": "user", "content": "hi"},
    )
    assert r.status_code == 404


async def test_other_session_cannot_access_conversation(api):
    client, _ = api
    cid = str(uuid.uuid4())
    await _create_conv(client, "sess-1", cid)
    # A different guest session must not read or write this conversation.
    assert (await client.get(f"/api/conversations/{cid}/messages?session_id=sess-2")).status_code == 404
    assert (await client.post(
        f"/api/conversations/{cid}/messages?session_id=sess-2",
        json={"role": "user", "content": "intruder"},
    )).status_code == 404


async def test_delete_conversation_and_cascade(api):
    client, real = api
    cid = str(uuid.uuid4())
    await _create_conv(client, "sess-1", cid)
    await client.post(f"/api/conversations/{cid}/messages?session_id=sess-1",
                      json={"role": "user", "content": "bye"})

    assert (await client.delete(f"/api/conversations/{cid}?session_id=sess-1")).status_code == 200
    async with real._pool.acquire() as conn:
        assert await conn.fetchval("SELECT COUNT(*) FROM conversations WHERE id=$1", cid) == 0
        assert await conn.fetchval("SELECT COUNT(*) FROM messages WHERE conversation_id=$1", cid) == 0


# ─── Reproduce the exact reported scenario end-to-end ───────────────────────

async def test_reported_scenario_double_create_then_messages(api):
    """Old behaviour: first create 200, second create 500 — yet messages worked."""
    client, real = api
    cid = "9ae82723-a8bd-48e0-ba8d-e6976d260cd0".replace("9ae8", uuid.uuid4().hex[:4])
    await _notebook(client, "sess-x", "nb-demo")

    first = await _create_conv(client, "sess-x", cid, "nb-demo")
    second = await _create_conv(client, "sess-x", cid, "nb-demo")
    assert first.status_code == 200
    assert second.status_code == 200  # previously: 500 duplicate key

    msg = await client.post(f"/api/conversations/{cid}/messages?session_id=sess-x",
                            json={"role": "user", "content": "still works"})
    assert msg.status_code == 200
    async with real._pool.acquire() as conn:
        assert await conn.fetchval("SELECT COUNT(*) FROM conversations WHERE id=$1", cid) == 1
