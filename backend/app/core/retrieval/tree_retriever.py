"""
Adaptive Beam Search Retriever — RAGraph's core retrieval innovation.

Architecture (v2):
  1. Parallel: beam search (H1→children) + global paragraph search
  2. Beam-path results get a structure bonus
  3. Merge, dedup, rank

This eliminates the H1 bottleneck that caused v1 to lose to flat chunking,
while preserving structural coherence as a scoring advantage.
"""
from __future__ import annotations
import asyncio
from dataclasses import dataclass, field
from typing import Optional
from loguru import logger
from app.services.qdrant_service import qdrant_service
from app.config import settings


@dataclass
class RetrievedChunk:
    node_id: str
    doc_id: str
    text: str
    heading_path: list[str]
    score: float
    level: str
    page_number: Optional[int] = None
    image_ids: list[str] = field(default_factory=list)
    parent_id: Optional[str] = None


async def beam_search_retrieve(
    session_id: str,
    query_vector: list[float],
    top_k: int = None,
    doc_ids: Optional[list[str]] = None,
) -> list[RetrievedChunk]:
    """
    Adaptive beam search with global fallback.

    Runs two strategies in parallel:
      1. Beam: H1 → paragraph children (structural path)
      2. Global: all paragraphs regardless of parent (recall safety net)

    Beam-path results get a structure bonus so tree structure is rewarded
    without acting as a hard filter.
    """
    top_k = top_k or settings.top_k_final
    beam_width = settings.beam_width
    structure_bonus = settings.structure_bonus
    owner_filter = qdrant_service.filter_by_owner(session_id)

    # ── Run beam search and global search in parallel ──────────────────
    beam_task = _beam_path_search(
        query_vector, owner_filter, beam_width, top_k, doc_ids
    )
    global_task = _global_paragraph_search(
        query_vector, owner_filter, top_k * 2, doc_ids
    )

    beam_results, global_results = await asyncio.gather(
        _safe(beam_task), _safe(global_task)
    )

    # ── Apply structure bonus to beam-path results ─────────────────────
    beam_ids = {c.node_id for c in beam_results}
    for chunk in beam_results:
        chunk.score += structure_bonus

    # ── Merge: beam results take priority ──────────────────────────────
    merged: dict[str, RetrievedChunk] = {}
    for c in beam_results:
        merged[c.node_id] = c
    for c in global_results:
        if c.node_id not in merged:
            merged[c.node_id] = c

    # ── Dedup + rank ───────────────────────────────────────────────────
    ranked = _dedup(list(merged.values()), top_k)

    beam_count = sum(1 for c in ranked if c.node_id in beam_ids)
    global_only = len(ranked) - beam_count
    logger.info(
        f"Beam-search: {len(ranked)} chunks "
        f"(beam={beam_count}, global-only={global_only}, "
        f"beam_raw={len(beam_results)}, global_raw={len(global_results)})"
    )
    return ranked


async def _beam_path_search(
    query_vector: list[float],
    owner_filter,
    beam_width: int,
    top_k: int,
    doc_ids: Optional[list[str]],
) -> list[RetrievedChunk]:
    """H1 → children beam traversal with adaptive beam width."""
    from qdrant_client.models import Filter

    t1 = settings.tree_similarity_threshold_l1

    # Search H1 nodes
    h1_filter = _f(level="h1", doc_ids=doc_ids)
    h1_payload_filter = _merge_filters(owner_filter, h1_filter)

    h1_hits = await qdrant_service.search_text(
        vector=query_vector, top_k=20,
        payload_filter=h1_payload_filter,
        score_threshold=t1,
    )

    # Fallback: lower threshold
    if not h1_hits:
        h1_hits = await qdrant_service.search_text(
            vector=query_vector, top_k=beam_width,
            payload_filter=h1_payload_filter,
            score_threshold=t1 * 0.5,
        )

    if not h1_hits:
        logger.debug("Beam: no H1 hits even at reduced threshold")
        return []

    # Adaptive beam: include any H1 within ratio of top score
    h1_hits = sorted(h1_hits, key=lambda x: x["score"], reverse=True)
    top_score = h1_hits[0]["score"]
    cutoff = top_score * settings.beam_adaptive_ratio

    selected_h1s = []
    for h1 in h1_hits:
        if len(selected_h1s) >= beam_width:
            break
        if h1["score"] >= cutoff or len(selected_h1s) < 2:
            # Always include at least 2 H1s
            selected_h1s.append(h1)

    logger.debug(
        f"Beam: {len(selected_h1s)} H1 nodes selected "
        f"(top={top_score:.3f}, cutoff={cutoff:.3f})"
    )

    # ── Expand children in parallel ────────────────────────────────────
    child_tasks = []
    for h1 in selected_h1s:
        h1_id = str(h1["id"])

        # Try H2 children first
        child_tasks.append(
            _expand_h1(query_vector, h1_id, h1, doc_ids, top_k)
        )

    all_children = await asyncio.gather(*child_tasks)
    results = []
    for children in all_children:
        results.extend(children)

    return results


async def _expand_h1(
    query_vector: list[float],
    h1_id: str,
    h1_hit: dict,
    doc_ids: Optional[list[str]],
    top_k: int,
) -> list[RetrievedChunk]:
    """Expand an H1 node by searching its H2 then paragraph children."""
    results = []

    # Try H2 children
    h2_hits = await qdrant_service.search_text(
        vector=query_vector, top_k=10,
        payload_filter=_f(level="h2", parent_id=h1_id, doc_ids=doc_ids),
        score_threshold=settings.tree_similarity_threshold_l2,
    )

    if h2_hits:
        # Expand best H2s into paragraphs (parallel)
        h2_sorted = sorted(h2_hits, key=lambda x: x["score"], reverse=True)
        h2_tasks = [
            _para_children(query_vector, str(h2["id"]), doc_ids, top_k)
            for h2 in h2_sorted[:settings.beam_width]
        ]
        h2_paras = await asyncio.gather(*h2_tasks)
        for paras in h2_paras:
            results.extend(paras)
    else:
        # Flat doc: search paragraph children of H1 directly
        paras = await _para_children(query_vector, h1_id, doc_ids, top_k)
        if paras:
            results.extend(paras)
        else:
            # H1 text itself as fallback
            p = h1_hit["payload"]
            results.append(RetrievedChunk(
                node_id=h1_id, doc_id=p.get("doc_id", ""),
                text=p.get("text", ""), heading_path=p.get("heading_path", []),
                score=h1_hit["score"], level="h1",
                page_number=p.get("page_number"),
                image_ids=p.get("image_ids", []),
            ))

    return results


async def _global_paragraph_search(
    query_vector: list[float],
    owner_filter,
    top_k: int,
    doc_ids: Optional[list[str]],
) -> list[RetrievedChunk]:
    """Direct paragraph vector search — no tree traversal, pure recall."""
    para_filter = _f(level="paragraph", doc_ids=doc_ids)
    payload_filter = _merge_filters(owner_filter, para_filter)

    hits = await qdrant_service.search_text(
        vector=query_vector, top_k=top_k,
        payload_filter=payload_filter,
        score_threshold=settings.tree_similarity_threshold_l3,
    )
    return [_to_chunk(h) for h in hits]


async def _para_children(
    query_vector: list[float],
    parent_id: str,
    doc_ids: Optional[list[str]],
    top_k: int,
) -> list[RetrievedChunk]:
    """Get paragraph children of a specific parent."""
    hits = await qdrant_service.search_text(
        vector=query_vector, top_k=top_k,
        payload_filter=_f(parent_id=parent_id, doc_ids=doc_ids),
        score_threshold=settings.tree_similarity_threshold_l3,
    )
    if not hits:
        hits = await qdrant_service.search_text(
            vector=query_vector, top_k=top_k,
            payload_filter=_f(parent_id=parent_id, doc_ids=doc_ids),
            score_threshold=0.0,
        )
    return [_to_chunk(h) for h in hits]


def _to_chunk(hit: dict) -> RetrievedChunk:
    p = hit["payload"]
    return RetrievedChunk(
        node_id=str(hit["id"]), doc_id=p.get("doc_id", ""),
        text=p.get("text", ""), heading_path=p.get("heading_path", []),
        score=hit["score"], level=p.get("level", "paragraph"),
        page_number=p.get("page_number"), image_ids=p.get("image_ids", []),
        parent_id=p.get("parent_id"),
    )


def _dedup(results: list[RetrievedChunk], top_k: int) -> list[RetrievedChunk]:
    """Dedup by ID, then by text prefix, keep highest score."""
    by_id: dict[str, RetrievedChunk] = {}
    for c in results:
        if c.node_id not in by_id or c.score > by_id[c.node_id].score:
            by_id[c.node_id] = c
    by_text: dict[str, RetrievedChunk] = {}
    for c in by_id.values():
        key = c.text[:100].strip().lower()
        if key not in by_text or c.score > by_text[key].score:
            by_text[key] = c
    return sorted(by_text.values(), key=lambda x: x.score, reverse=True)[:top_k]


def _merge_filters(owner_filter, extra_filter):
    """Merge owner filter with additional filter conditions."""
    from qdrant_client.models import Filter
    if extra_filter is None:
        return owner_filter
    if owner_filter is None:
        return extra_filter
    return Filter(must=owner_filter.must + extra_filter.must)


def _f(level: str = None, parent_id: str = None, doc_ids: list[str] = None):
    from qdrant_client.models import Filter, FieldCondition, MatchValue, MatchAny
    conds = []
    if level:
        conds.append(FieldCondition(key="level", match=MatchValue(value=level)))
    if parent_id:
        conds.append(FieldCondition(key="parent_id", match=MatchValue(value=parent_id)))
    if doc_ids:
        conds.append(FieldCondition(key="doc_id", match=MatchAny(any=doc_ids)))
    return Filter(must=conds) if conds else None


async def _safe(coro) -> list:
    try:
        return await coro or []
    except Exception as e:
        logger.warning(f"Strategy failed: {e}")
        return []
