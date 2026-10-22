import pytest
import asyncio
import numpy as np
from httpx import AsyncClient, ASGITransport
from unittest.mock import AsyncMock, patch

from app.main import app
from app.config import settings
from app.services.db_service import db_service
from app.models.documents import DocumentMetadata, DocumentStatus
from app.utils.embeddings import embed_batch, _get_local_model, warmup_embedding_model
from app.core.retrieval import in_memory_store
from app.core.retrieval.in_memory_store import CachedParagraph, OwnerCache
from app.core.retrieval.in_memory_retriever import in_memory_retrieve


@pytest.fixture
def anyio_backend():
    return "asyncio"


@pytest.mark.asyncio
async def test_unauthenticated_notebooks_access_returns_401():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # No Authorization header, no session_id query param, no cookies
        res = await client.get("/api/notebooks/")
        assert res.status_code == 401
        assert "Authentication required" in res.json().get("detail", "")


@pytest.mark.asyncio
async def test_unauthenticated_conversations_access_returns_401():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.get("/api/conversations/")
        assert res.status_code == 401
        assert "Authentication required" in res.json().get("detail", "")


@pytest.mark.asyncio
async def test_authenticated_session_notebooks_access_succeeds(monkeypatch):
    monkeypatch.setattr(db_service, "list_notebooks", AsyncMock(return_value=[]))
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.get("/api/notebooks/?session_id=valid-sess-123")
        assert res.status_code == 200
        assert res.json() == []


@pytest.mark.asyncio
async def test_foreign_notebook_documents_isolation(monkeypatch):
    # Mock verify_notebook_ownership returning False for user_b attempting to access notebook of user_a
    monkeypatch.setattr(db_service, "verify_notebook_ownership", AsyncMock(return_value=False))
    docs = await db_service.list_documents_by_owner(
        user_id="user_b",
        session_id=None,
        notebook_id="nb_user_a"
    )
    assert docs == []


@pytest.mark.asyncio
async def test_foreign_notebook_conversations_isolation(monkeypatch):
    monkeypatch.setattr(db_service, "verify_notebook_ownership", AsyncMock(return_value=False))
    convs = await db_service.list_conversations_by_owner(
        user_id="user_b",
        session_id=None,
        notebook_id="nb_user_a"
    )
    assert convs == []


@pytest.mark.asyncio
async def test_step1_timeout_handling(monkeypatch, tmp_path):
    from app.core.ingestion.pipeline import run_ingestion

    # Create dummy file
    dummy_file = tmp_path / "test.txt"
    dummy_file.write_text("Hello world")

    # Set timeout to 0.05 seconds
    monkeypatch.setattr(settings, "liteparse_parse_timeout", 0.05)

    # Mock parse_document to simulate hanging/blocking parse
    def hanging_parse(*args, **kwargs):
        import time
        time.sleep(0.3)
        return None

    monkeypatch.setattr("app.core.ingestion.pipeline.parse_document", hanging_parse)
    monkeypatch.setattr(db_service, "update_document_status", AsyncMock())

    metadata = DocumentMetadata(
        id="test-doc-timeout",
        owner_id="owner-test",
        filename="test.txt",
        original_filename="test.txt",
        mime_type="text/plain",
        storage_path=str(dummy_file),
    )

    result_meta = await run_ingestion("owner-test", metadata)
    assert result_meta.status == DocumentStatus.ERROR
    assert "Document parsing timed out" in (result_meta.error_message or "")


@pytest.mark.asyncio
async def test_embedding_model_reuse_and_deduplication():
    # Verify singleton model
    model1 = _get_local_model()
    model2 = _get_local_model()
    assert model1 is model2

    # Embed with duplicates
    texts = [
        "Distributed systems consensus protocols.",
        "Hierarchical knowledge tree indexing.",
        "Distributed systems consensus protocols.",  # Duplicate
        "Hierarchical knowledge tree indexing.",    # Duplicate
    ]
    embs = await embed_batch(texts, batch_size=16)
    assert len(embs) == 4
    assert np.allclose(embs[0], embs[2], atol=1e-5)
    assert np.allclose(embs[1], embs[3], atol=1e-5)


@pytest.mark.asyncio
async def test_in_memory_hierarchical_retrieval_flow(monkeypatch):
    owner = "perf-owner-1"
    vec1 = [1.0] + [0.0] * (settings.embedding_dim - 1)
    vec2 = [0.0, 1.0] + [0.0] * (settings.embedding_dim - 2)
    norm_v1 = np.array(vec1, dtype=np.float32)
    norm_v2 = np.array(vec2, dtype=np.float32)
    para_mat = np.vstack([norm_v1, norm_v2])

    test_cache = OwnerCache(
        paragraphs=[
            CachedParagraph(
                node_id="node-1",
                doc_id="doc-1",
                text="Paragraph 1 about consensus",
                section_id="sec-1",
                parent_id="sec-1",
                heading_path=["Overview", "Consensus"],
                page_number=1,
                image_ids=[],
                level="paragraph",
            ),
            CachedParagraph(
                node_id="node-2",
                doc_id="doc-1",
                text="Paragraph 2 about trees",
                section_id="sec-2",
                parent_id="sec-2",
                heading_path=["Overview", "Trees"],
                page_number=2,
                image_ids=[],
                level="paragraph",
            ),
        ],
        para_vecs=para_mat,
    )

    in_memory_store._STORE._cache[owner] = test_cache

    # Query matching vec2
    chunks = await in_memory_retrieve(owner, query_vector=vec2, top_k=2)
    assert len(chunks) == 2
    # Node 2 should score highest due to similarity with vec2
    assert chunks[0].node_id == "node-2"
    assert chunks[0].text == "Paragraph 2 about trees"

    # Invalidate
    in_memory_store.invalidate(owner)
    assert in_memory_store.get_cached_now(owner) is None
