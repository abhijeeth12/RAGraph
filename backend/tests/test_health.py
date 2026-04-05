import pytest
import asyncio
from httpx import AsyncClient, ASGITransport
from app.main import app


async def test_ping():
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as c:
        r = await c.get("/health/ping")
    assert r.status_code == 200
    assert r.json()["pong"] is True


async def test_health_structure():
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as c:
        r = await c.get("/health")
    assert r.status_code == 200
    data = r.json()
    assert "status" in data
    assert "services" in data
    assert data["services"]["llm"]["hyde_enabled"] is True


async def test_search_stream_stub():
    """Stream endpoint returns SSE content-type. Uses mocked embeddings/Qdrant/Redis."""
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test",
        timeout=30.0,
    ) as c:
        r = await c.post("/api/search/stream?session_id=test", json={
            "query": "What is RAG?",
            "model": "gpt-4o",
            "focus": "all",
            "use_hyde": False,       # skip HyDE to avoid LLM call
            "use_dual_path": False,  # skip BM25 scroll to avoid Qdrant call
        })
    assert r.status_code == 200
    assert "text/event-stream" in r.headers["content-type"]
    # Should have at least one SSE data line
    assert "data:" in r.text


async def test_upload_invalid_type():
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as c:
        r = await c.post(
            "/api/documents/upload?session_id=test",
            files={"file": ("test.xyz", b"content", "application/octet-stream")},
        )
    assert r.status_code == 415
