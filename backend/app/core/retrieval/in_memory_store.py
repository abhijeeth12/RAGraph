"""
In-Memory Vector Store — RAGraph v5 Architecture.

Benchmark insight:
  The paragraph vectors for a single user's documents are tiny (<10MB for most
  use-cases). By caching them in numpy at query time, we eliminate ALL Qdrant
  round-trips from the retrieval critical path.

  Qdrant is still used for:
    - Persistent storage (survives restarts)
    - Ingestion (upsert during document processing)
    - Full-text metadata (text payload stored in Qdrant)

  At query time:
    - Vectors come from this in-memory store (numpy matmul ~0.05ms)
    - Section-aware grouping (beam + diverse) from metadata (~0.01ms)
    - Qdrant is NOT called during retrieval

Cache invalidation:
  - Per owner_id key
  - Invalidated when a new document is ingested for that owner
  - TTL: 30 minutes (configurable) — balances freshness vs warm-up cost
"""
from __future__ import annotations

import asyncio
import time
from dataclasses import dataclass, field
from typing import Optional

import numpy as np
from loguru import logger

from app.config import settings


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
    ttl:        float = 1800.0      # 30 minutes


# Global cache: owner_id -> OwnerCache
_CACHE: dict[str, OwnerCache] = {}
_LOCKS: dict[str, asyncio.Lock] = {}


def invalidate(owner_id: str) -> None:
    """Call this when a document is ingested for owner_id."""
    if owner_id in _CACHE:
        del _CACHE[owner_id]
        logger.debug(f"In-memory cache invalidated for owner={owner_id[:8]}")


async def get_or_load(owner_id: str) -> Optional[OwnerCache]:
    """
    Return the in-memory cache for owner_id, loading from Qdrant if needed.
    Thread-safe via per-owner asyncio Lock.
    """
    # Fast path: cache hit
    entry = _CACHE.get(owner_id)
    if entry is not None:
        if time.monotonic() - entry.loaded_at < entry.ttl:
            return entry
        # Expired
        del _CACHE[owner_id]

    # Acquire per-owner lock to prevent stampede
    if owner_id not in _LOCKS:
        _LOCKS[owner_id] = asyncio.Lock()
    async with _LOCKS[owner_id]:
        # Double-checked locking
        entry = _CACHE.get(owner_id)
        if entry is not None and time.monotonic() - entry.loaded_at < entry.ttl:
            return entry

        entry = await _load_from_qdrant(owner_id)
        if entry:
            _CACHE[owner_id] = entry
        return entry


async def _load_from_qdrant(owner_id: str) -> Optional[OwnerCache]:
    """
    Scroll ALL paragraph vectors for this owner from Qdrant and cache them.

    This is a one-time cost per owner per TTL period. For a typical user with
    50-200 paragraphs, the scroll takes ~20-50ms and loads ~0.3-1.2MB of data.
    Subsequent queries take ~0.05ms (pure numpy).
    """
    from app.services.qdrant_service import qdrant_service
    from qdrant_client.models import Filter, FieldCondition, MatchValue

    logger.info(f"Loading in-memory cache for owner={owner_id[:8]}...")
    t0 = time.monotonic()

    try:
        # Scroll all paragraph-level vectors with their embeddings
        scroll_filter = Filter(must=[
            FieldCondition(key="owner_id", match=MatchValue(value=owner_id)),
            FieldCondition(key="level",    match=MatchValue(value="paragraph")),
        ])

        all_points = []
        offset = None
        while True:
            result, next_offset = await qdrant_service._client.scroll(
                collection_name=settings.qdrant_text_collection,
                scroll_filter=scroll_filter,
                limit=500,
                offset=offset,
                with_payload=True,
                with_vectors=True,
            )
            all_points.extend(result)
            if next_offset is None:
                break
            offset = next_offset

        if not all_points:
            logger.debug(f"No paragraphs found for owner={owner_id[:8]}")
            return None

        paragraphs: list[CachedParagraph] = []
        vectors: list[list[float]] = []

        for pt in all_points:
            p = pt.payload
            # The vector is stored directly on the point
            vec = pt.vector
            if vec is None:
                continue

            paragraphs.append(CachedParagraph(
                node_id=str(pt.id),
                doc_id=p.get("doc_id", ""),
                text=p.get("text", ""),
                section_id=p.get("section_id") or p.get("parent_id", ""),
                parent_id=p.get("parent_id", ""),
                heading_path=p.get("heading_path", []),
                page_number=p.get("page_number"),
                image_ids=p.get("image_ids", []),
                level=p.get("level", "paragraph"),
            ))
            vectors.append(vec)

        if not vectors:
            return None

        # Build numpy matrix, normalise rows (cosine = dot product on unit vecs)
        mat = np.array(vectors, dtype=np.float32)
        norms = np.linalg.norm(mat, axis=1, keepdims=True)
        norms = np.where(norms == 0, 1.0, norms)
        mat /= norms

        elapsed = (time.monotonic() - t0) * 1000
        logger.info(
            f"In-memory cache loaded: {len(paragraphs)} paragraphs "
            f"({mat.nbytes // 1024}KB) in {elapsed:.1f}ms | owner={owner_id[:8]}"
        )
        return OwnerCache(paragraphs=paragraphs, para_vecs=mat)

    except Exception as e:
        logger.warning(f"Failed to load in-memory cache for {owner_id[:8]}: {e}")
        return None
