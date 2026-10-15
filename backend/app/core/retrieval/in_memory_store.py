"""
In-Memory Vector Store — RAGraph v5 Architecture (Bounded LRU).

Benchmark insight:
  The paragraph vectors for a single user's documents are small (~0.5-2MB).
  By caching them in numpy at query time, we eliminate Qdrant round-trips
  from the retrieval critical path (~0.05ms query latency).

Memory Optimization (Render Free Tier 512MB Hard Limit):
  - Strictly bounded LRU cache (MAX_CACHE_OWNERS = 6)
  - Capped maximum paragraphs per owner (MAX_PARAS_PER_OWNER = 1200)
  - Active TTL expiration (default 30 mins)
  - Streamed Qdrant scrolling to prevent large intermediate object allocation spikes
  - Auto-eviction and cleanup of locks & stale sessions
  - trim_memory() triggered after loading
"""
from __future__ import annotations

import asyncio
import time
from collections import OrderedDict
from dataclasses import dataclass, field
from typing import Optional

import numpy as np
from loguru import logger

from app.config import settings
from app.utils.memory import trim_memory

# Memory bounds tailored for 512MB RAM budget (overridable via settings / env)
MAX_CACHE_OWNERS = getattr(settings, "in_memory_max_owners", 2)
MAX_PARAS_PER_OWNER = getattr(settings, "in_memory_max_paras", 500)
DEFAULT_CACHE_TTL = 600.0  # 10 minutes (releases memory when idle)


@dataclass
class CachedParagraph:
    """Lightweight metadata + vector reference for in-memory retrieval."""
    node_id:      str
    doc_id:       str
    text:         str
    section_id:   str        # first H1 parent uuid
    parent_id:    str        # direct parent (H1 or H2)
    heading_path: list[str]
    page_number:  Optional[int]
    image_ids:    list[str]
    level:        str


@dataclass
class OwnerCache:
    paragraphs: list[CachedParagraph]
    para_vecs:  np.ndarray          # shape (N, dim), float32, L2-normalised
    loaded_at:  float = field(default_factory=time.monotonic)
    ttl:        float = DEFAULT_CACHE_TTL
    bm25_index: Optional[object] = None  # Lazily built BM25Okapi instance (tokenized corpus is discarded)


class BoundedLRUStore:
    """Thread-safe bounded LRU cache for in-memory vector stores."""

    def __init__(self, max_owners: int = MAX_CACHE_OWNERS):
        self._cache: OrderedDict[str, OwnerCache] = OrderedDict()
        self._locks: dict[str, asyncio.Lock] = {}
        self._max_owners = max_owners
        self._global_lock = asyncio.Lock()

    def _get_lock(self, owner_id: str) -> asyncio.Lock:
        if owner_id not in self._locks:
            self._locks[owner_id] = asyncio.Lock()
        return self._locks[owner_id]

    def _cleanup_stale_locks(self) -> None:
        """Prune locks for owners no longer in cache."""
        active_keys = set(self._cache.keys())
        stale = [k for k in self._locks if k not in active_keys]
        for k in stale:
            del self._locks[k]

    def _evict_lru(self) -> None:
        """Evict the least recently used owner if over capacity."""
        while len(self._cache) > self._max_owners:
            evicted_owner, evicted_entry = self._cache.popitem(last=False)
            logger.info(f"LRU eviction: removed owner={evicted_owner[:8]} from in-memory cache")
            del evicted_entry
        self._cleanup_stale_locks()
        trim_memory()

    def invalidate(self, owner_id: str) -> None:
        """Invalidate the cache for a specific owner."""
        if owner_id in self._cache:
            del self._cache[owner_id]
            logger.debug(f"In-memory cache invalidated for owner={owner_id[:8]}")
        if owner_id in self._locks:
            del self._locks[owner_id]
        trim_memory()

    def get_cached(self, owner_id: str) -> Optional[OwnerCache]:
        """Fast synchronous cache check with TTL validation."""
        # Caching disabled globally (CACHE_ENABLED=false) — always miss.
        # Callers fall back to direct Qdrant scrolls (slower, always fresh).
        if not settings.cache_enabled:
            return None
        entry = self._cache.get(owner_id)
        if entry is not None:
            if time.monotonic() - entry.loaded_at < entry.ttl:
                # Mark as recently used
                self._cache.move_to_end(owner_id)
                return entry
            # Expired
            del self._cache[owner_id]
            self._cleanup_stale_locks()
        return None

    async def get_or_load(self, owner_id: str) -> Optional[OwnerCache]:
        """
        Return the in-memory cache for owner_id, loading from Qdrant if needed.
        Guarded against cache stampedes with per-owner locks and bounded capacity.
        Returns None immediately when caching is disabled — nothing is stored.
        """
        # Caching disabled globally — never load or store; force Qdrant-direct path.
        if not settings.cache_enabled:
            return None
        # Fast path
        entry = self.get_cached(owner_id)
        if entry is not None:
            return entry

        lock = self._get_lock(owner_id)
        async with lock:
            # Double-checked locking
            entry = self.get_cached(owner_id)
            if entry is not None:
                return entry

            # Load from Qdrant
            entry = await _load_from_qdrant(owner_id)
            if entry is not None:
                async with self._global_lock:
                    self._cache[owner_id] = entry
                    self._cache.move_to_end(owner_id)
                    self._evict_lru()
            return entry

    def get_stats(self) -> dict:
        """Return diagnostic metrics for cache monitoring."""
        total_paras = sum(len(e.paragraphs) for e in self._cache.values())
        total_vec_bytes = sum(e.para_vecs.nbytes for e in self._cache.values())
        return {
            "cached_owners": len(self._cache),
            "max_owners": self._max_owners,
            "total_paragraphs": total_paras,
            "total_vec_bytes": total_vec_bytes,
        }


# Global bounded instance
_STORE = BoundedLRUStore(max_owners=MAX_CACHE_OWNERS)
_CACHE = _STORE._cache


def invalidate(owner_id: str) -> None:
    """Call this when a document is ingested for owner_id."""
    _STORE.invalidate(owner_id)


async def get_or_load(owner_id: str) -> Optional[OwnerCache]:
    """Return the in-memory cache for owner_id, loading from Qdrant if needed."""
    return await _STORE.get_or_load(owner_id)


def get_cached_now(owner_id: str) -> Optional[OwnerCache]:
    """Synchronous read without Qdrant network call."""
    return _STORE.get_cached(owner_id)


def get_store_stats() -> dict:
    """Diagnostic statistics for health endpoints."""
    return _STORE.get_stats()


async def _load_from_qdrant(owner_id: str) -> Optional[OwnerCache]:
    """
    Scroll paragraph vectors for this owner from Qdrant in bounded chunks.
    Builds the normalized numpy matrix directly to avoid large intermediate object arrays.
    """
    from app.services.qdrant_service import qdrant_service
    from qdrant_client.models import Filter, FieldCondition, MatchValue

    logger.info(f"Loading in-memory cache for owner={owner_id[:8]}...")
    t0 = time.monotonic()

    try:
        scroll_filter = Filter(must=[
            FieldCondition(key="owner_id", match=MatchValue(value=owner_id)),
            FieldCondition(key="level",    match=MatchValue(value="paragraph")),
        ])

        paragraphs: list[CachedParagraph] = []
        vec_arrays: list[np.ndarray] = []
        offset = None
        total_scrolled = 0

        # Stream in batches of 250 to keep transient memory minimal
        BATCH_LIMIT = 250
        while total_scrolled < MAX_PARAS_PER_OWNER:
            batch_result, next_offset = await qdrant_service._client.scroll(
                collection_name=settings.qdrant_text_collection,
                scroll_filter=scroll_filter,
                limit=min(BATCH_LIMIT, MAX_PARAS_PER_OWNER - total_scrolled),
                offset=offset,
                with_payload=True,
                with_vectors=True,
            )
            if not batch_result:
                break

            batch_vecs = []
            for pt in batch_result:
                p = pt.payload or {}
                vec = pt.vector
                if vec is None:
                    continue

                paragraphs.append(CachedParagraph(
                    node_id=str(pt.id),
                    doc_id=p.get("doc_id", ""),
                    text=(p.get("text", "") or "")[:1500],
                    section_id=p.get("section_id") or p.get("parent_id", ""),
                    parent_id=p.get("parent_id", ""),
                    heading_path=p.get("heading_path", []),
                    page_number=p.get("page_number"),
                    image_ids=p.get("image_ids", []),
                    level=p.get("level", "paragraph"),
                ))
                batch_vecs.append(vec)

            if batch_vecs:
                # Convert this batch to a float32 numpy array immediately
                vec_arrays.append(np.array(batch_vecs, dtype=np.float32))

            total_scrolled += len(batch_result)
            if next_offset is None:
                break
            offset = next_offset

        if not paragraphs or not vec_arrays:
            logger.debug(f"No paragraphs found for owner={owner_id[:8]}")
            return None

        # Concatenate batch arrays directly
        mat = np.vstack(vec_arrays) if len(vec_arrays) > 1 else vec_arrays[0]
        del vec_arrays

        # L2 normalize rows (cosine similarity = dot product on unit vecs)
        norms = np.linalg.norm(mat, axis=1, keepdims=True)
        norms = np.where(norms == 0, 1.0, norms)
        mat /= norms

        elapsed = (time.monotonic() - t0) * 1000
        logger.info(
            f"In-memory cache loaded: {len(paragraphs)} paragraphs "
            f"({mat.nbytes // 1024}KB) in {elapsed:.1f}ms | owner={owner_id[:8]}"
        )

        trim_memory()
        return OwnerCache(paragraphs=paragraphs, para_vecs=mat)

    except Exception as e:
        logger.warning(f"Failed to load in-memory cache for {owner_id[:8]}: {e}")
        trim_memory()
        return None
