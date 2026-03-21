from __future__ import annotations
import asyncio
from dataclasses import dataclass, field
from typing import Optional
from loguru import logger

from app.core.retrieval.tree_retriever import RetrievedChunk, beam_search_retrieve, _dedup
from app.core.retrieval.hybrid_search import _bm25_search, _hits_to_chunks, _para_filter
from app.core.retrieval.image_retriever import (
    RetrievedImage, retrieve_images_for_text_query, retrieve_for_image_query,
)
from app.core.reranking.graph_reranker import graph_rerank
from app.utils.embeddings import embed_query
from app.services.qdrant_service import qdrant_service
from app.config import settings


@dataclass
class RetrievalResult:
    chunks: list[RetrievedChunk] = field(default_factory=list)
    images: list[RetrievedImage] = field(default_factory=list)
    query_used: str = ""
    hyde_used: bool = False
    dual_path_fallback_used: bool = False
    total_candidates: int = 0
    strategies_used: list[str] = field(default_factory=list)


async def retrieve(
    query: str,
    use_hyde: bool = True,
    use_dual_path: bool = True,
    image_base64: Optional[str] = None,
    doc_ids: Optional[list[str]] = None,
    top_k: int = None,
) -> RetrievalResult:
    top_k = top_k or settings.top_k_final
    result = RetrievalResult(query_used=query)

    if image_base64:
        text_chunks, similar_images = await retrieve_for_image_query(
            image_base64, top_k_images=5, top_k_text=top_k, doc_ids=doc_ids
        )
        result.chunks = text_chunks
        result.images = similar_images
        if text_chunks:
            result.chunks = await graph_rerank(query, text_chunks, [], top_k)
        return result

    # HyDE expansion
    effective_query = query
    if use_hyde and settings.hyde_enabled:
        try:
            from app.core.ingestion.hyde import generate_hypothetical_doc
            expanded = await generate_hypothetical_doc(query)
            if expanded:
                effective_query = expanded
                result.hyde_used = True
                result.query_used = expanded
        except Exception as e:
            logger.warning(f"HyDE failed: {e}")

    query_vector = await embed_query(effective_query)

    # Run all 3 strategies in parallel
    beam_res, dense_res, bm25_res = await asyncio.gather(
        _safe(beam_search_retrieve(query_vector, top_k=settings.rerank_top_n, doc_ids=doc_ids)),
        _safe(_dense_search(query_vector, doc_ids, settings.rerank_top_n)),
        _safe(_bm25_search(query, top_k=settings.rerank_top_n, doc_ids=doc_ids)),
    )

    strategies = []
    if beam_res:  strategies.append(f"beam({len(beam_res)})")
    if dense_res: strategies.append(f"dense({len(dense_res)})")
    if bm25_res:  strategies.append(f"bm25({len(bm25_res)})")
    logger.info(f"Strategies: {', '.join(strategies) or 'none'}")

    # RRF merge with weights: beam > dense > bm25
    rrf: dict[str, RetrievedChunk] = {}

    def add(chunks: list[RetrievedChunk], weight: float):
        import copy
        for rank, c in enumerate(chunks):
            score = weight / (60 + rank + 1)
            if c.node_id in rrf:
                rrf[c.node_id].score += score
            else:
                nc = copy.copy(c)
                nc.score = score
                rrf[c.node_id] = nc

    add(beam_res,  1.2)
    add(dense_res, 1.0)
    add(bm25_res,  0.8)

    # Dedup by text
    by_text: dict[str, RetrievedChunk] = {}
    for c in rrf.values():
        key = c.text[:100].strip().lower()
        if key not in by_text or c.score > by_text[key].score:
            by_text[key] = c

    merged = sorted(by_text.values(), key=lambda x: x.score, reverse=True)
    result.total_candidates = len(merged)
    result.strategies_used = strategies
    result.dual_path_fallback_used = len(beam_res) == 0

    logger.info(f"Merged: {len(merged)} candidates")

    result.chunks = await graph_rerank(
        query=query,
        chunks=merged[:settings.rerank_top_n],
        query_vector=query_vector,
        top_k=top_k,
    )

    result.images = await retrieve_images_for_text_query(
        query=effective_query,
        retrieved_chunks=result.chunks,
        top_k=5, doc_ids=doc_ids,
    )

    logger.info(
        f"Done: {len(result.chunks)} chunks, {len(result.images)} images | "
        f"hyde={result.hyde_used} strategies={strategies}"
    )
    return result


async def _dense_search(
    query_vector: list[float],
    doc_ids: Optional[list[str]],
    top_k: int,
) -> list[RetrievedChunk]:
    hits = await qdrant_service.search_text(
        vector=query_vector, top_k=top_k,
        payload_filter=_para_filter(doc_ids),
        score_threshold=0.10,
    )
    return _hits_to_chunks(hits)


async def _safe(coro) -> list:
    try:
        return await coro or []
    except Exception as e:
        logger.warning(f"Strategy failed: {e}")
        return []
