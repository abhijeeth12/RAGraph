import time
import asyncio
import unittest
import numpy as np
from unittest.mock import AsyncMock, patch, MagicMock

from app.core.retrieval.in_memory_store import (
    BoundedLRUStore,
    OwnerCache,
    CachedParagraph,
    MAX_CACHE_OWNERS,
    MAX_PARAS_PER_OWNER,
)
from app.utils.memory import trim_memory
from app.core.retrieval.hybrid_search import _tokenize, _bm25_search
from app.middleware.rate_limiter import _check_limit


def _make_dummy_owner_cache(num_paras: int = 10, dim: int = 384) -> OwnerCache:
    paras = [
        CachedParagraph(
            node_id=f"node-{i}",
            doc_id="doc-1",
            text=f"Paragraph {i} content discussing artificial intelligence systems.",
            section_id=f"sec-{i % 3}",
            parent_id=f"sec-{i % 3}",
            heading_path=["Heading", f"Section {i % 3}"],
            page_number=1,
            image_ids=[],
            level="paragraph",
        )
        for i in range(num_paras)
    ]
    mat = np.random.randn(num_paras, dim).astype(np.float32)
    norms = np.linalg.norm(mat, axis=1, keepdims=True)
    mat /= np.where(norms == 0, 1.0, norms)
    return OwnerCache(paragraphs=paras, para_vecs=mat)


class TestMemoryBounds(unittest.TestCase):
    def test_trim_memory_runs_safely(self):
        """Verify trim_memory completes without error across platforms."""
        trim_memory()

    def test_bounded_lru_eviction(self):
        """Verify BoundedLRUStore evicts oldest entries when capacity exceeds max_owners."""
        # These tests exercise the LRU structure itself, so opt in to caching
        # explicitly (app default is CACHE_ENABLED=false).
        from app.config import settings
        prev, settings.cache_enabled = settings.cache_enabled, True
        try:
            store = BoundedLRUStore(max_owners=3)

            # Insert 3 owners
            for i in range(1, 4):
                owner_id = f"owner-{i}"
                cache = _make_dummy_owner_cache()
                store._cache[owner_id] = cache

            self.assertEqual(len(store._cache), 3)
            self.assertIn("owner-1", store._cache)

            # Access owner-1 so it becomes most recently used
            res = store.get_cached("owner-1")
            self.assertIsNotNone(res)

            # Insert a 4th owner and trigger eviction
            store._cache["owner-4"] = _make_dummy_owner_cache()
            store._evict_lru()

            # Now owner-2 should have been evicted (since owner-1 was accessed more recently)
            self.assertEqual(len(store._cache), 3)
            self.assertNotIn("owner-2", store._cache)
            self.assertIn("owner-1", store._cache)
            self.assertIn("owner-3", store._cache)
            self.assertIn("owner-4", store._cache)
        finally:
            settings.cache_enabled = prev

    def test_bounded_lru_ttl_expiration(self):
        """Verify expired cache entries are removed on access."""
        from app.config import settings
        prev, settings.cache_enabled = settings.cache_enabled, True
        try:
            store = BoundedLRUStore(max_owners=5)
            cache = _make_dummy_owner_cache()
            cache.loaded_at = time.monotonic() - 2000.0  # past 1800s TTL
            cache.ttl = 1800.0

            store._cache["owner-expired"] = cache
            entry = store.get_cached("owner-expired")
            self.assertIsNone(entry)
            self.assertNotIn("owner-expired", store._cache)
        finally:
            settings.cache_enabled = prev

    def test_fast_tokenize(self):
        """Verify regex tokenization replaces NLTK properly."""
        text = "Hello, world! FastEmbed 2.0 & PyTorch retrieval."
        tokens = _tokenize(text)
        self.assertIn("hello", tokens)
        self.assertIn("world", tokens)
        self.assertIn("fastembed", tokens)
        self.assertIn("retrieval", tokens)

    def test_rate_limiter_pruning(self):
        """Verify rate limiter prunes empty keys and expired entries."""
        store = {}
        ip = "192.168.1.100"

        # Allowed
        allowed = _check_limit(store, ip, max_requests=5, window_seconds=60)
        self.assertTrue(allowed)
        self.assertIn(ip, store)

        # Simulate expired timestamp
        store[ip] = [time.time() - 100]
        # Check limit again - should clean up stale and record new
        allowed = _check_limit(store, ip, max_requests=5, window_seconds=60)
        self.assertTrue(allowed)
        self.assertEqual(len(store[ip]), 1)


class TestAsyncBM25(unittest.IsolatedAsyncioTestCase):
    async def test_bm25_uses_in_memory_cache(self):
        """Verify BM25 search uses in_memory_store without calling Qdrant."""
        from app.core.retrieval import in_memory_store
        from app.config import settings
        prev, settings.cache_enabled = settings.cache_enabled, True
        owner_id = "test-bm25-owner"
        cache = _make_dummy_owner_cache(num_paras=5)
        cache.paragraphs[0].text = "Unique search keyword query target phrase."

        in_memory_store._STORE._cache[owner_id] = cache

        try:
            import rank_bm25
            chunks = await _bm25_search("target phrase", owner_id=owner_id, top_k=3)
            self.assertGreater(len(chunks), 0)
            self.assertEqual(chunks[0].node_id, cache.paragraphs[0].node_id)
            self.assertIn("target", chunks[0].text)
        except ImportError:
            # If rank_bm25 is not installed in local python environment, mock it
            mock_bm25_module = MagicMock()
            mock_instance = MagicMock()
            mock_instance.get_scores.return_value = [0.95, 0.1, 0.0, 0.0, 0.0]
            mock_bm25_module.BM25Okapi.return_value = mock_instance
            with patch.dict("sys.modules", {"rank_bm25": mock_bm25_module}):
                chunks = await _bm25_search("target phrase", owner_id=owner_id, top_k=3)
                self.assertGreater(len(chunks), 0)
                self.assertEqual(chunks[0].node_id, cache.paragraphs[0].node_id)
        finally:
            settings.cache_enabled = prev
            in_memory_store._STORE._cache.pop(owner_id, None)


class TestCachesDisabledByDefault(unittest.IsolatedAsyncioTestCase):
    async def test_all_caches_bypassed_when_disabled(self):
        """App default (CACHE_ENABLED=false): every cache layer misses, nothing stored."""
        from app.config import settings
        from app.core.retrieval import in_memory_store
        from app.services.redis_service import redis_service
        prev_cache = settings.cache_enabled
        prev_mem = getattr(settings, "in_memory_retrieval_enabled", True)
        settings.cache_enabled = False
        settings.in_memory_retrieval_enabled = False
        try:
            self.assertFalse(settings.cache_enabled)
            self.assertFalse(settings.in_memory_retrieval_enabled)
            self.assertIsNone(in_memory_store.get_cached_now("any-owner"))
            self.assertIsNone(await in_memory_store.get_or_load("any-owner"))
            self.assertIsNone(
                await redis_service.get_cached_result("o", "q", "m", "f")
            )
            # Writes are no-ops and must not raise (even with no Redis client).
            await redis_service.cache_result("o", "q", "m", "f", {"a": 1})
            await redis_service.set("k", {"a": 1})
            self.assertIsNone(await redis_service.get("k"))
        finally:
            settings.cache_enabled = prev_cache
            settings.in_memory_retrieval_enabled = prev_mem


if __name__ == "__main__":
    unittest.main()
