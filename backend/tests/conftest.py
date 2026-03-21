"""
Global test fixtures — mocks embeddings so tests never
trigger real API calls or model downloads.
"""
import pytest
from unittest.mock import AsyncMock, patch, MagicMock
import numpy as np


FAKE_DIM = 384
FAKE_VEC = [0.1] * FAKE_DIM


def _fake_local_model():
    """Minimal mock that mimics SentenceTransformer."""
    mock = MagicMock()
    mock.encode.return_value = np.array([FAKE_VEC])
    mock.get_sentence_embedding_dimension.return_value = FAKE_DIM
    return mock


@pytest.fixture(autouse=True)
def mock_embeddings(monkeypatch):
    """
    Auto-used fixture: patches all embedding functions so no
    model is loaded and no API is called during any test.
    """
    # Patch the lazy-loaded local model
    import app.utils.embeddings as emb_module
    monkeypatch.setattr(emb_module, "_local_model", _fake_local_model())

    # Patch the async public functions
    async def fake_embed_text(text: str):
        return FAKE_VEC

    async def fake_embed_query(text: str):
        return FAKE_VEC

    async def fake_embed_batch(texts, batch_size=64):
        return [FAKE_VEC for _ in texts]

    monkeypatch.setattr(emb_module, "embed_text",  fake_embed_text)
    monkeypatch.setattr(emb_module, "embed_query", fake_embed_query)
    monkeypatch.setattr(emb_module, "embed_batch", fake_embed_batch)

    yield


@pytest.fixture(autouse=True)
def mock_qdrant(monkeypatch):
    """
    Auto-used fixture: patches Qdrant so tests never need
    a running Qdrant instance.
    """
    import app.services.qdrant_service as qs_module

    mock_client = MagicMock()
    mock_client.search = AsyncMock(return_value=[])
    mock_client.scroll = AsyncMock(return_value=([], None))
    mock_client.upsert = AsyncMock(return_value=None)
    mock_client.get_collections = AsyncMock(return_value=MagicMock(collections=[
        MagicMock(name="ragraph_text"),
        MagicMock(name="ragraph_images"),
    ]))
    mock_client.retrieve = AsyncMock(return_value=[])

    monkeypatch.setattr(qs_module.qdrant_service, "_client", mock_client)
    yield


@pytest.fixture(autouse=True)
def mock_redis(monkeypatch):
    """
    Auto-used fixture: patches Redis so tests never need
    a running Redis instance.
    """
    import app.services.redis_service as rs_module

    mock_client = MagicMock()
    mock_client.ping    = AsyncMock(return_value=True)
    mock_client.get     = AsyncMock(return_value=None)
    mock_client.setex   = AsyncMock(return_value=True)
    mock_client.delete  = AsyncMock(return_value=True)
    mock_client.aclose  = AsyncMock(return_value=None)

    monkeypatch.setattr(rs_module.redis_service, "_client", mock_client)
    yield
