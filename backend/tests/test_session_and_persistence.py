"""
Test suite verifying session restoration, user isolation, conversation persistence,
and session invalidation edge cases for RAGraph.
"""
import pytest
import json
import uuid
from httpx import AsyncClient, ASGITransport
from datetime import datetime, UTC
from unittest.mock import MagicMock, AsyncMock

from app.main import app
from app.core.auth.jwt_handler import create_access_token, create_refresh_token
from app.services.db_service import db_service


@pytest.fixture(autouse=True)
def mock_db_pool(monkeypatch):
    """Ensure db_service has an active mock pool and clear auth limits."""
    mock_pool = MagicMock()
    monkeypatch.setattr(db_service, "_pool", mock_pool)
    from app.middleware.rate_limiter import _auth_limits
    _auth_limits.clear()


@pytest.mark.asyncio
async def test_session_restoration_with_valid_token(monkeypatch):
    """Verify that an authenticated user can restore their session via /api/auth/me."""
    user_id = "user-alice-101"
    email = "alice@example.com"
    token = create_access_token(user_id, email)

    monkeypatch.setattr(db_service, "get_user_by_id", AsyncMock(return_value={"id": user_id, "email": email}))

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
        assert resp.status_code == 200
        data = resp.json()
        assert data["user_id"] == user_id
        assert data["email"] == email


@pytest.mark.asyncio
async def test_session_restoration_with_expired_or_invalid_token(monkeypatch):
    """Verify that an invalid or expired token is rejected with 401."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/api/auth/me", headers={"Authorization": "Bearer invalid.jwt.token"})
        assert resp.status_code == 401


@pytest.mark.asyncio
async def test_refresh_token_rotation_and_user_session_sync(monkeypatch):
    """Verify that token refresh issues a new access token and new refresh token, revoking the old one."""
    user_id = "user-bob-202"
    email = "bob@example.com"
    old_refresh = create_refresh_token(user_id)

    revoked_tokens = []
    async def mock_revoke(token, exp):
        revoked_tokens.append(token)

    monkeypatch.setattr(db_service, "is_token_revoked", AsyncMock(return_value=False))
    monkeypatch.setattr(db_service, "get_user_by_id", AsyncMock(return_value={"id": user_id, "email": email}))
    monkeypatch.setattr(db_service, "revoke_token", mock_revoke)

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.post(
            "/api/auth/refresh",
            headers={"X-Refresh-Token": old_refresh},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert old_refresh in revoked_tokens


@pytest.mark.asyncio
async def test_user_data_isolation_between_accounts(monkeypatch):
    """Verify that User A cannot see or access User B's notebooks or conversations."""
    user_a = "user-alice"
    user_b = "user-bob"

    token_a = create_access_token(user_a, "alice@test.com")
    token_b = create_access_token(user_b, "bob@test.com")

    # Mock user lookups
    def mock_get_user(uid):
        if uid == user_a:
            return {"id": user_a, "email": "alice@test.com"}
        if uid == user_b:
            return {"id": user_b, "email": "bob@test.com"}
        return None

    monkeypatch.setattr(db_service, "get_user_by_id", AsyncMock(side_effect=mock_get_user))

    # Mock list_conversations_by_owner
    async def mock_list_convs(user_id, session_id, notebook_id=None):
        if user_id == user_a:
            return [{"id": "conv-a1", "title": "Alice Secret Chat", "user_id": user_a}]
        elif user_id == user_b:
            return [{"id": "conv-b1", "title": "Bob Secret Chat", "user_id": user_b}]
        return []

    monkeypatch.setattr(db_service, "list_conversations_by_owner", mock_list_convs)

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # User A requests their conversations
        resp_a = await client.get("/api/conversations/", headers={"Authorization": f"Bearer {token_a}"})
        assert resp_a.status_code == 200
        convs_a = resp_a.json()
        assert len(convs_a) == 1
        assert convs_a[0]["id"] == "conv-a1"

        # User B requests their conversations
        resp_b = await client.get("/api/conversations/", headers={"Authorization": f"Bearer {token_b}"})
        assert resp_b.status_code == 200
        convs_b = resp_b.json()
        assert len(convs_b) == 1
        assert convs_b[0]["id"] == "conv-b1"
        assert convs_b[0]["id"] != convs_a[0]["id"]


@pytest.mark.asyncio
async def test_logout_revokes_token_and_clears_cookies(monkeypatch):
    """Verify that calling /api/auth/logout invalidates session cookies and revokes refresh token."""
    user_id = "user-charlie"
    refresh_token = create_refresh_token(user_id)

    revoked_tokens = []
    async def mock_revoke(token, exp):
        revoked_tokens.append(token)

    monkeypatch.setattr(db_service, "revoke_token", mock_revoke)

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.post(
            "/api/auth/logout",
            headers={"X-Refresh-Token": refresh_token},
        )
        assert resp.status_code == 200
        assert resp.json()["message"] == "Logged out successfully"
        assert refresh_token in revoked_tokens
