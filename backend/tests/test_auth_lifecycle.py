"""
Test suite for authentication lifecycle, token refreshing, cross-origin cookies,
rotation grace periods, and endpoint redirects.
"""
import pytest
from httpx import AsyncClient, ASGITransport
from datetime import datetime, timedelta, UTC
from unittest.mock import patch, MagicMock, AsyncMock

from app.main import app
from app.config import settings
from app.core.auth.jwt_handler import create_access_token, create_refresh_token
from app.services.db_service import db_service


@pytest.fixture(autouse=True)
def mock_db_pool(monkeypatch):
    """Ensure db_service has an active mock pool for tests and clear test rate limits."""
    mock_pool = MagicMock()
    monkeypatch.setattr(db_service, "_pool", mock_pool)
    from app.middleware.rate_limiter import _auth_limits
    _auth_limits.clear()


@pytest.mark.asyncio
async def test_refresh_token_via_cookie(monkeypatch):
    """Verify refresh via HTTP-only cookie succeeds and returns new access & refresh tokens."""
    user_id = "user-12345"
    email = "test@example.com"
    token = create_refresh_token(user_id)

    # Mock DB lookups
    monkeypatch.setattr(db_service, "is_token_revoked", AsyncMock(return_value=False))
    monkeypatch.setattr(db_service, "get_user_by_id", AsyncMock(return_value={"id": user_id, "email": email}))
    monkeypatch.setattr(db_service, "revoke_token", AsyncMock())

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test", cookies={"ragraph_refresh": token}) as client:
        resp = await client.post("/api/auth/refresh")
        assert resp.status_code == 200
        data = resp.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"
        # Verify cookie is set on response
        assert "ragraph_refresh" in resp.cookies


@pytest.mark.asyncio
async def test_refresh_token_via_header(monkeypatch):
    """Verify refresh via X-Refresh-Token header succeeds (cross-site fallback when cookies are blocked)."""
    user_id = "user-12345"
    email = "test@example.com"
    token = create_refresh_token(user_id)

    monkeypatch.setattr(db_service, "is_token_revoked", AsyncMock(return_value=False))
    monkeypatch.setattr(db_service, "get_user_by_id", AsyncMock(return_value={"id": user_id, "email": email}))
    monkeypatch.setattr(db_service, "revoke_token", AsyncMock())

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.post(
            "/api/auth/refresh",
            headers={"X-Refresh-Token": token},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "access_token" in data
        assert "refresh_token" in data


@pytest.mark.asyncio
async def test_refresh_token_via_body(monkeypatch):
    """Verify refresh via JSON request body succeeds."""
    user_id = "user-12345"
    email = "test@example.com"
    token = create_refresh_token(user_id)

    monkeypatch.setattr(db_service, "is_token_revoked", AsyncMock(return_value=False))
    monkeypatch.setattr(db_service, "get_user_by_id", AsyncMock(return_value={"id": user_id, "email": email}))
    monkeypatch.setattr(db_service, "revoke_token", AsyncMock())

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.post(
            "/api/auth/refresh",
            json={"refresh_token": token},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "access_token" in data
        assert "refresh_token" in data


@pytest.mark.asyncio
async def test_refresh_token_missing_returns_401():
    """Verify missing refresh token returns 401 with clear detail."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.post("/api/auth/refresh")
        assert resp.status_code == 401
        assert resp.json()["detail"] == "No refresh token"


@pytest.mark.asyncio
async def test_refresh_token_rotation_grace_period(monkeypatch):
    """Verify that is_token_revoked checks grace_seconds=30 to tolerate in-flight race conditions."""
    user_id = "user-12345"
    email = "test@example.com"
    token = create_refresh_token(user_id)

    # When grace_seconds=30 is passed, it returns False (within grace window)
    async def mock_is_revoked(t, grace_seconds=0):
        assert grace_seconds == 30
        return False

    monkeypatch.setattr(db_service, "is_token_revoked", mock_is_revoked)
    monkeypatch.setattr(db_service, "get_user_by_id", AsyncMock(return_value={"id": user_id, "email": email}))
    monkeypatch.setattr(db_service, "revoke_token", AsyncMock())

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.post(
            "/api/auth/refresh",
            headers={"X-Refresh-Token": token},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "access_token" in data


@pytest.mark.asyncio
async def test_refresh_cookie_samesite_none_in_production(monkeypatch):
    """Verify that in production (or secure_cookies=True), SameSite is 'none' and Secure is True."""
    monkeypatch.setattr(settings, "secure_cookies", True)
    monkeypatch.setattr(settings, "app_env", "production")

    user_id = "user-12345"
    email = "test@example.com"
    token = create_refresh_token(user_id)

    monkeypatch.setattr(db_service, "is_token_revoked", AsyncMock(return_value=False))
    monkeypatch.setattr(db_service, "get_user_by_id", AsyncMock(return_value={"id": user_id, "email": email}))
    monkeypatch.setattr(db_service, "revoke_token", AsyncMock())

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="https://test") as client:
        resp = await client.post(
            "/api/auth/refresh",
            headers={"X-Refresh-Token": token},
        )
        assert resp.status_code == 200
        set_cookie = resp.headers.get("set-cookie", "")
        assert "ragraph_refresh=" in set_cookie
        assert "samesite=none" in set_cookie.lower()
        assert "secure" in set_cookie.lower()


@pytest.mark.asyncio
async def test_documents_no_307_redirect(monkeypatch):
    """Verify that GET /api/documents returns 200 directly without 307 redirect."""
    monkeypatch.setattr(db_service, "list_documents_by_owner", AsyncMock(return_value=[]))

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Non-trailing slash
        resp1 = await client.get("/api/documents?session_id=sess-test")
        assert resp1.status_code == 200
        assert "documents" in resp1.json()

        # 2. Trailing slash
        resp2 = await client.get("/api/documents/?session_id=sess-test")
        assert resp2.status_code == 200
        assert "documents" in resp2.json()


@pytest.mark.asyncio
async def test_documents_accepts_x_session_id_header(monkeypatch):
    """Verify get_owner accepts X-Session-ID header in lieu of query parameter."""
    monkeypatch.setattr(db_service, "list_documents_by_owner", AsyncMock(return_value=[]))

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get(
            "/api/documents",
            headers={"X-Session-ID": "header-session-123"},
        )
        assert resp.status_code == 200
        assert "documents" in resp.json()
