"""
Context Expander — Sibling-aware context enrichment.

After retrieval, expands each top chunk by including siblings
(nodes with the same parent_id) that exceed a score threshold.

This is where tree retrieval SURPASSES flat chunking:
we retrieve the most relevant paragraph, then automatically include
adjacent paragraphs from the same section for coherence — something
flat top-K cannot do.
"""
from __future__ import annotations
from typing import Optional
from loguru import logger

from app.core.retrieval.tree_retriever import RetrievedChunk, _f, _to_chunk
from app.services.qdrant_service import qdrant_service
from app.config import settings


async def expand_with_siblings(
    chunks: list[RetrievedChunk],
    query_vector: list[float],
    max_total: int = None,
) -> list[RetrievedChunk]:
    """
    For each retrieved chunk, find sibling chunks (same parent_id)
    that also score well against the query. This reconstructs
    local section context that chunking fragmentsed.

    Returns an expanded, deduplicated, re-ranked list.
    """
    if not settings.sibling_expansion_enabled:
        return chunks

    max_total = max_total or settings.top_k_final + 4
    score_floor = settings.sibling_score_floor

    # Collect parent_ids we want to expand
    parent_ids_to_expand = set()
    existing_ids = {c.node_id for c in chunks}

    for chunk in chunks:
        if chunk.parent_id and chunk.level == "paragraph":
            parent_ids_to_expand.add(chunk.parent_id)

    if not parent_ids_to_expand:
        return chunks

    # Fetch siblings for each unique parent
    new_siblings: list[RetrievedChunk] = []
    for parent_id in list(parent_ids_to_expand)[:5]:  # limit expansion scope
        sibling_filter = _f(parent_id=parent_id)
        hits = await qdrant_service.search_text(
            vector=query_vector,
            top_k=6,
            payload_filter=sibling_filter,
            score_threshold=score_floor,
        )
        for hit in hits:
            chunk = _to_chunk(hit)
            if chunk.node_id not in existing_ids:
                existing_ids.add(chunk.node_id)
                new_siblings.append(chunk)

    if not new_siblings:
        return chunks

    logger.debug(f"Sibling expansion: +{len(new_siblings)} chunks from "
                 f"{len(parent_ids_to_expand)} parents")

    # Merge: original chunks keep priority, siblings are appended
    all_chunks = list(chunks) + new_siblings

    # Dedup by text
    by_text: dict[str, RetrievedChunk] = {}
    for c in all_chunks:
        key = c.text[:100].strip().lower()
        if key not in by_text or c.score > by_text[key].score:
            by_text[key] = c

    result = sorted(by_text.values(), key=lambda c: c.score, reverse=True)
    return result[:max_total]
