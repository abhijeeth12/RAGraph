from __future__ import annotations
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
    top_k = top_k or settings.top_k_final
    t1 = settings.tree_similarity_threshold_l1
    beam_width = settings.beam_width
    results: list[RetrievedChunk] = []

    owner_filter = qdrant_service.filter_by_owner(session_id)
    # Search H1 nodes
    h1_filter = _f(level="h1", doc_ids=doc_ids)
    h1_payload_filter = owner_filter if h1_filter is None else Filter(
        must=[owner_filter.must[0], h1_filter.must[0]]
    )
    h1_hits = await qdrant_service.search_text(
        vector=query_vector, top_k=20,
        payload_filter=h1_payload_filter,
        score_threshold=t1,
    )

    # Fallback: lower threshold if nothing found
    if not h1_hits:
        h1_hits = await qdrant_service.search_text(
            vector=query_vector, top_k=beam_width,
            payload_filter=_f(level="h1", doc_ids=doc_ids),
            score_threshold=t1 * 0.5,
        )

    if not h1_hits:
        logger.debug("Beam: no H1 hits even at reduced threshold")
        return results

    h1_hits = sorted(h1_hits, key=lambda x: x["score"], reverse=True)[:beam_width]
    logger.debug(f"Beam: {len(h1_hits)} H1 nodes expanded")

    for h1 in h1_hits:
        h1_id = str(h1["id"])

        # Try H2 children first (deep docs)
        h2_hits = await qdrant_service.search_text(
            vector=query_vector, top_k=10,
            payload_filter=_f(level="h2", parent_id=h1_id, doc_ids=doc_ids),
            score_threshold=settings.tree_similarity_threshold_l2,
        )

        if h2_hits:
            for h2 in sorted(h2_hits, key=lambda x: x["score"], reverse=True)[:beam_width]:
                results.extend(await _para_children(query_vector, str(h2["id"]), doc_ids, top_k))
        else:
            # Flat doc (all H1): search paragraph children of H1 directly
            paras = await _para_children(query_vector, h1_id, doc_ids, top_k)
            if paras:
                results.extend(paras)
                logger.debug(f"  H1 direct para children: {len(paras)}")
            else:
                # H1 text itself as fallback chunk
                p = h1["payload"]
                results.append(RetrievedChunk(
                    node_id=h1_id, doc_id=p.get("doc_id", ""),
                    text=p.get("text", ""), heading_path=p.get("heading_path", []),
                    score=h1["score"], level="h1",
                    page_number=p.get("page_number"),
                    image_ids=p.get("image_ids", []),
                ))
                logger.debug(f"  H1 text used as fallback chunk")

    ranked = _dedup(results, top_k)
    logger.info(f"Beam-search: {len(ranked)} chunks (from {len(results)} raw)")
    return ranked


async def _para_children(
    query_vector: list[float],
    parent_id: str,
    doc_ids: Optional[list[str]],
    top_k: int,
) -> list[RetrievedChunk]:
    # Try with threshold first
    hits = await qdrant_service.search_text(
        vector=query_vector, top_k=top_k,
        payload_filter=_f(parent_id=parent_id, doc_ids=doc_ids),
        score_threshold=settings.tree_similarity_threshold_l3,
    )
    # If nothing, get any children regardless of score
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
