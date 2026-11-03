import pytest
from httpx import AsyncClient, ASGITransport
from unittest.mock import AsyncMock
from app.main import app
from app.services.db_service import db_service
from app.api.conversations import _verify_conv_access, get_auth_owner, get_current_user_optional


@pytest.fixture
def anyio_backend():
    return "asyncio"


# ═══════════════════════════════════════════════════════════════════════
# 1. UNIT TESTS FOR _verify_conv_access
# ═══════════════════════════════════════════════════════════════════════

def test_verify_conv_access_user_match():
    conv = {"id": "c1", "user_id": "usr-1", "session_id": None}
    owner = {"user_id": "usr-1", "session_id": None}
    assert _verify_conv_access(conv, owner) is True


def test_verify_conv_access_user_mismatch():
    conv = {"id": "c1", "user_id": "usr-1", "session_id": None}
    owner = {"user_id": "usr-2", "session_id": None}
    assert _verify_conv_access(conv, owner) is False


def test_verify_conv_access_session_match():
    conv = {"id": "c1", "user_id": None, "session_id": "sess-abc"}
    owner = {"user_id": None, "session_id": "sess-abc"}
    assert _verify_conv_access(conv, owner) is True


def test_verify_conv_access_session_mismatch():
    conv = {"id": "c1", "user_id": None, "session_id": "sess-abc"}
    owner = {"user_id": None, "session_id": "sess-xyz"}
    assert _verify_conv_access(conv, owner) is False


def test_verify_conv_access_guest_cannot_access_user_conversation():
    # If conversation is owned by a registered user, guest session matching session_id must be denied
    conv = {"id": "c1", "user_id": "usr-1", "session_id": "sess-abc"}
    owner = {"user_id": None, "session_id": "sess-abc"}
    assert _verify_conv_access(conv, owner) is False


def test_verify_conv_access_user_cannot_access_guest_conversation():
    conv = {"id": "c1", "user_id": None, "session_id": "sess-abc"}
    owner = {"user_id": "usr-1", "session_id": None}
    assert _verify_conv_access(conv, owner) is False


def test_verify_conv_access_missing_or_none_inputs():
    conv = {"id": "c1", "user_id": "usr-1", "session_id": None}
    owner = {"user_id": "usr-1", "session_id": None}
    assert _verify_conv_access(None, owner) is False
    assert _verify_conv_access(conv, None) is False
    assert _verify_conv_access({}, owner) is False
    assert _verify_conv_access(conv, {}) is False


def test_verify_conv_access_conversation_without_owner_info():
    conv = {"id": "c1", "title": "Orphan"}
    owner = {"user_id": "usr-1", "session_id": "sess-abc"}
    assert _verify_conv_access(conv, owner) is False


def test_verify_conv_access_kwarg_compatibility():
    conv = {"id": "c1", "user_id": "usr-1", "session_id": None}
    # auth_owner as keyword
    assert _verify_conv_access(conv, auth_owner={"user_id": "usr-1", "session_id": None}) is True
    # owner as legacy keyword
    assert _verify_conv_access(conv, owner={"user_id": "usr-1", "session_id": None}) is True


# ═══════════════════════════════════════════════════════════════════════
# 2. UNIT TESTS FOR db_service.verify_conversation_ownership
# ═══════════════════════════════════════════════════════════════════════

@pytest.mark.asyncio
async def test_db_service_verify_conversation_ownership_user(monkeypatch):
    monkeypatch.setattr(
        db_service,
        "get_conversation",
        AsyncMock(return_value={"id": "c1", "user_id": "usr-1", "session_id": None}),
    )
    assert await db_service.verify_conversation_ownership("c1", "usr-1", None) is True
    assert await db_service.verify_conversation_ownership("c1", "usr-2", None) is False


@pytest.mark.asyncio
async def test_db_service_verify_conversation_ownership_session(monkeypatch):
    monkeypatch.setattr(
        db_service,
        "get_conversation",
        AsyncMock(return_value={"id": "c1", "user_id": None, "session_id": "sess-1"}),
    )
    assert await db_service.verify_conversation_ownership("c1", None, "sess-1") is True
    assert await db_service.verify_conversation_ownership("c1", None, "sess-2") is False


@pytest.mark.asyncio
async def test_db_service_verify_conversation_ownership_guest_blocked_on_user_convo(monkeypatch):
    monkeypatch.setattr(
        db_service,
        "get_conversation",
        AsyncMock(return_value={"id": "c1", "user_id": "usr-1", "session_id": "sess-1"}),
    )
    assert await db_service.verify_conversation_ownership("c1", None, "sess-1") is False


@pytest.mark.asyncio
async def test_db_service_verify_conversation_ownership_not_found(monkeypatch):
    monkeypatch.setattr(db_service, "get_conversation", AsyncMock(return_value=None))
    assert await db_service.verify_conversation_ownership("c1", "usr-1", None) is False


# ═══════════════════════════════════════════════════════════════════════
# 3. ENDPOINT INTEGRATION TESTS (MESSAGES & CONVERSATIONS API)
# ═══════════════════════════════════════════════════════════════════════

@pytest.mark.asyncio
async def test_unauthenticated_requests_return_401():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # POST message unauthenticated
        res = await client.post("/api/conversations/c1/messages", json={"role": "user", "content": "hi"})
        assert res.status_code == 401
        assert "Authentication required" in res.json().get("detail", "")

        # GET messages unauthenticated
        res = await client.get("/api/conversations/c1/messages")
        assert res.status_code == 401

        # DELETE conversation unauthenticated
        res = await client.delete("/api/conversations/c1")
        assert res.status_code == 401

        # GET list unauthenticated
        res = await client.get("/api/conversations/")
        assert res.status_code == 401

        # POST create unauthenticated
        res = await client.post("/api/conversations/", json={"title": "new"})
        assert res.status_code == 401


@pytest.mark.asyncio
async def test_authenticated_user_send_message_success(monkeypatch):
    monkeypatch.setattr(
        db_service,
        "get_conversation",
        AsyncMock(return_value={"id": "c-user-1", "user_id": "test-user-id", "session_id": None}),
    )
    monkeypatch.setattr(
        db_service,
        "create_message",
        AsyncMock(return_value={
            "id": "m1",
            "conversation_id": "c-user-1",
            "role": "user",
            "content": "Hello RAGraph",
            "created_at": "2026-11-04T00:00:00Z"
        }),
    )

    app.dependency_overrides[get_current_user_optional] = lambda: {"user_id": "test-user-id"}
    try:
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            res = await client.post(
                "/api/conversations/c-user-1/messages",
                json={"role": "user", "content": "Hello RAGraph"},
            )
            assert res.status_code == 200
            data = res.json()
            assert data["id"] == "m1"
            assert data["content"] == "Hello RAGraph"
    finally:
        app.dependency_overrides.pop(get_current_user_optional, None)


@pytest.mark.asyncio
async def test_authenticated_user_get_messages_success(monkeypatch):
    monkeypatch.setattr(
        db_service,
        "get_conversation",
        AsyncMock(return_value={"id": "c-user-1", "user_id": "test-user-id", "session_id": None}),
    )
    monkeypatch.setattr(
        db_service,
        "list_messages",
        AsyncMock(return_value=[
            {"id": "m1", "conversation_id": "c-user-1", "role": "user", "content": "Query 1"}
        ]),
    )

    app.dependency_overrides[get_current_user_optional] = lambda: {"user_id": "test-user-id"}
    try:
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            res = await client.get("/api/conversations/c-user-1/messages")
            assert res.status_code == 200
            data = res.json()
            assert len(data) == 1
            assert data[0]["content"] == "Query 1"
    finally:
        app.dependency_overrides.pop(get_current_user_optional, None)


@pytest.mark.asyncio
async def test_user_cannot_access_other_user_conversation(monkeypatch):
    monkeypatch.setattr(
        db_service,
        "get_conversation",
        AsyncMock(return_value={"id": "c-victim", "user_id": "victim-user-id", "session_id": None}),
    )

    app.dependency_overrides[get_current_user_optional] = lambda: {"user_id": "attacker-user-id"}
    try:
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            # POST message to victim's conversation
            res = await client.post(
                "/api/conversations/c-victim/messages",
                json={"role": "user", "content": "malicious"},
            )
            assert res.status_code == 404
            assert res.json().get("detail") == "Conversation not found"

            # GET victim's messages
            res = await client.get("/api/conversations/c-victim/messages")
            assert res.status_code == 404

            # DELETE victim's conversation
            res = await client.delete("/api/conversations/c-victim")
            assert res.status_code == 404
    finally:
        app.dependency_overrides.pop(get_current_user_optional, None)


@pytest.mark.asyncio
async def test_guest_session_send_and_get_messages_success(monkeypatch):
    monkeypatch.setattr(
        db_service,
        "get_conversation",
        AsyncMock(return_value={"id": "c-guest-1", "user_id": None, "session_id": "sess-guest-123"}),
    )
    monkeypatch.setattr(
        db_service,
        "create_message",
        AsyncMock(return_value={
            "id": "m-g1",
            "conversation_id": "c-guest-1",
            "role": "user",
            "content": "Guest msg",
            "created_at": "2026-11-04T00:00:00Z"
        }),
    )
    monkeypatch.setattr(
        db_service,
        "list_messages",
        AsyncMock(return_value=[
            {"id": "m-g1", "conversation_id": "c-guest-1", "role": "user", "content": "Guest msg"}
        ]),
    )

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Via query param ?session_id=...
        res = await client.post(
            "/api/conversations/c-guest-1/messages?session_id=sess-guest-123",
            json={"role": "user", "content": "Guest msg"},
        )
        assert res.status_code == 200
        assert res.json()["content"] == "Guest msg"

        res = await client.get("/api/conversations/c-guest-1/messages?session_id=sess-guest-123")
        assert res.status_code == 200
        assert len(res.json()) == 1


@pytest.mark.asyncio
async def test_guest_cannot_access_other_guest_conversation(monkeypatch):
    monkeypatch.setattr(
        db_service,
        "get_conversation",
        AsyncMock(return_value={"id": "c-guest-1", "user_id": None, "session_id": "sess-legit"}),
    )

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.post(
            "/api/conversations/c-guest-1/messages?session_id=sess-intruder",
            json={"role": "user", "content": "intruder"},
        )
        assert res.status_code == 404
        assert res.json().get("detail") == "Conversation not found"


@pytest.mark.asyncio
async def test_guest_cannot_access_registered_user_conversation(monkeypatch):
    monkeypatch.setattr(
        db_service,
        "get_conversation",
        AsyncMock(return_value={"id": "c-user-1", "user_id": "real-user", "session_id": "sess-legit"}),
    )

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.post(
            "/api/conversations/c-user-1/messages?session_id=sess-legit",
            json={"role": "user", "content": "intruder"},
        )
        assert res.status_code == 404
        assert res.json().get("detail") == "Conversation not found"


@pytest.mark.asyncio
async def test_nonexistent_conversation_returns_404(monkeypatch):
    monkeypatch.setattr(db_service, "get_conversation", AsyncMock(return_value=None))

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.post(
            "/api/conversations/nonexistent-id/messages?session_id=sess-valid",
            json={"role": "user", "content": "hello"},
        )
        assert res.status_code == 404
        assert res.json().get("detail") == "Conversation not found"


@pytest.mark.asyncio
async def test_delete_conversation_own_succeeds(monkeypatch):
    monkeypatch.setattr(
        db_service,
        "get_conversation",
        AsyncMock(return_value={"id": "c-del", "user_id": None, "session_id": "sess-del"}),
    )
    monkeypatch.setattr(db_service, "delete_conversation", AsyncMock())

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.delete("/api/conversations/c-del?session_id=sess-del")
        assert res.status_code == 200
        assert res.json() == {"deleted": True}
        db_service.delete_conversation.assert_awaited_once_with("c-del")


@pytest.mark.asyncio
async def test_header_session_id_auth(monkeypatch):
    monkeypatch.setattr(
        db_service,
        "get_conversation",
        AsyncMock(return_value={"id": "c-hdr", "user_id": None, "session_id": "sess-header-1"}),
    )
    monkeypatch.setattr(
        db_service,
        "create_message",
        AsyncMock(return_value={
            "id": "m-hdr",
            "conversation_id": "c-hdr",
            "role": "user",
            "content": "from header",
            "created_at": "2026-11-04T00:00:00Z"
        }),
    )

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.post(
            "/api/conversations/c-hdr/messages",
            headers={"X-Session-ID": "sess-header-1"},
            json={"role": "user", "content": "from header"},
        )
        assert res.status_code == 200
        assert res.json()["content"] == "from header"
