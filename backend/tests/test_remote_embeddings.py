"""
Tests for remote OpenRouter/OpenAI embedding routing and memory isolation.
Verifies that:
1. FastEmbed is skipped completely when remote embeddings are enabled.
2. OpenRouter API keys ('sk-or-...') route to remote embeddings instead of local FastEmbed.
3. Dimensions parameter (384) is forwarded to match existing Qdrant collections.
4. Fallback to local FastEmbed occurs cleanly when no API key is provided.
"""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from app.config import settings
import app.utils.embeddings as emb_module
from app.utils.embeddings import embed_batch as real_embed_batch, _embed_openai as real_embed_openai


def test_use_local_resolution():
    """Verify _use_local logic for local, missing key, and OpenRouter keys."""
    with patch.object(settings, "embedding_model", "local"):
        with patch.object(settings, "openai_api_key", "sk-or-valid-key"):
            assert emb_module._use_local() is True

    with patch.object(settings, "embedding_model", "openai"):
        with patch.object(settings, "openai_api_key", ""):
            assert emb_module._use_local() is True

    with patch.object(settings, "embedding_model", "openai"):
        with patch.object(settings, "openai_api_key", "sk-or-valid-openrouter-key"):
            assert emb_module._use_local() is False

    with patch.object(settings, "embedding_model", "openai"):
        with patch.object(settings, "openai_api_key", "sk-proj-valid-openai-key"):
            assert emb_module._use_local() is False


def test_get_remote_embedding_model_namespacing():
    """Verify remote model prefix handling for OpenRouter vs direct OpenAI."""
    with patch.object(settings, "remote_embedding_model", "openai/text-embedding-3-small"):
        with patch.object(settings, "openai_base_url", "https://openrouter.ai/api/v1"):
            assert emb_module.get_remote_embedding_model() == "openai/text-embedding-3-small"

    with patch.object(settings, "remote_embedding_model", "text-embedding-3-small"):
        with patch.object(settings, "openai_base_url", "https://openrouter.ai/api/v1"):
            assert emb_module.get_remote_embedding_model() == "openai/text-embedding-3-small"

    with patch.object(settings, "remote_embedding_model", "openai/text-embedding-3-small"):
        with patch.object(settings, "openai_base_url", "https://api.openai.com/v1"):
            assert emb_module.get_remote_embedding_model() == "text-embedding-3-small"


def test_warmup_skips_fastembed_when_remote(monkeypatch):
    """Verify that warmup_embedding_model does NOT initialize FastEmbed in remote mode."""
    mock_get_local = MagicMock()
    monkeypatch.setattr(emb_module, "_get_local_model", mock_get_local)
    monkeypatch.setattr(emb_module, "_use_local", lambda: False)

    emb_module.warmup_embedding_model()
    mock_get_local.assert_not_called()


@pytest.mark.asyncio
async def test_embed_openai_sends_dimensions_and_model(monkeypatch):
    """Verify _embed_openai sends correct model, dimensions (384), and input."""
    monkeypatch.setattr(settings, "embedding_dim", 384)
    monkeypatch.setattr(settings, "remote_embedding_model", "openai/text-embedding-3-small")
    monkeypatch.setattr(settings, "openai_base_url", "https://openrouter.ai/api/v1")

    mock_client = MagicMock()
    mock_item = MagicMock()
    mock_item.embedding = [0.05] * 384
    mock_resp = MagicMock()
    mock_resp.data = [mock_item]
    mock_client.embeddings.create = AsyncMock(return_value=mock_resp)

    monkeypatch.setattr(emb_module, "_get_openai_client", lambda: mock_client)

    result = await emb_module._embed_openai("test embedding text")

    assert len(result) == 384
    mock_client.embeddings.create.assert_awaited_once_with(
        model="openai/text-embedding-3-small",
        input="test embedding text",
        dimensions=384,
    )


@pytest.mark.asyncio
async def test_embed_batch_remote_sends_batches_with_dimensions(monkeypatch):
    """Verify embed_batch in remote mode calls client in chunks with dimensions=384."""
    monkeypatch.setattr(settings, "embedding_dim", 384)
    monkeypatch.setattr(settings, "remote_embedding_model", "openai/text-embedding-3-small")
    monkeypatch.setattr(settings, "openai_base_url", "https://openrouter.ai/api/v1")
    monkeypatch.setattr(emb_module, "_use_local", lambda: False)

    mock_client = MagicMock()
    def _make_resp(input_batch, **kwargs):
        resp = MagicMock()
        items = []
        for _ in input_batch:
            item = MagicMock()
            item.embedding = [0.1] * 384
            items.append(item)
        resp.data = items
        return resp

    mock_client.embeddings.create = AsyncMock(side_effect=lambda input, **kw: _make_resp(input, **kw))
    monkeypatch.setattr(emb_module, "_get_openai_client", lambda: mock_client)

    texts = [f"Text chunk {i}" for i in range(5)]
    results = await real_embed_batch(texts, batch_size=2)

    assert len(results) == 5
    for r in results:
        assert len(r) == 384

    # With 5 items and batch_size min(2, 64) = 2, it should make 3 calls: 2, 2, 1
    assert mock_client.embeddings.create.await_count == 3
    # Check that dimensions=384 was passed in all calls
    for call in mock_client.embeddings.create.await_args_list:
        assert call.kwargs["dimensions"] == 384
        assert call.kwargs["model"] == "openai/text-embedding-3-small"
