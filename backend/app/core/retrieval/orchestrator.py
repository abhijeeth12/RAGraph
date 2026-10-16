from __future__ import annotations
import asyncio
from dataclasses import dataclass, field
from typing import Optional
from loguru import logger

from app.core.retrieval.tree_retriever import RetrievedChunk, _dedup
from app.core.retrieval.in_memory_retriever import in_memory_retrieve
from app.core.retrieval.hybrid_search import _bm25_search, _hits_to_chunks, _para_filter
from app.core.retrieval.image_retriever import (
    RetrievedImage, retrieve_images_for_text_query, retrieve_for_image_query,
)
from app.core.retrieval.context_expander import expand_with_siblings
from app.core.reranking.graph_reranker import graph_rerank
from app.utils.embeddings import embed_query
from app.services.qdrant_service import qdrant_service
from app.config import settings
from qdrant_client.models import Filter


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
    session_id: str,
    query: str,
    use_hyde: bool = True,
    use_dual_path: bool = True,
    image_base64: Optional[str] = None,
    doc_ids: Optional[list[str]] = None,
    top_k: int = None,
    history: Optional[list] = None,
) -> RetrievalResult:
    owner_id = session_id  # unified owner concept
    top_k = top_k or settings.top_k_final
    result = RetrievalResult(query_used=query)

    if image_base64:
        text_chunks, similar_images = await retrieve_for_image_query(
            image_base64, owner_id=owner_id, top_k_images=5, top_k_text=top_k, doc_ids=doc_ids
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

    # ── Follow-up awareness (conversation memory for retrieval) ──────────
    # bare follow-ups ("what about the second one?", "why?") embed to almost
    # nothing on their own. Prepend the last user turn so dense/in-memory/BM25
    # search in the context of the conversation — no extra LLM call (quota!).
    retrieval_query = _expand_followup(query, history)
    if retrieval_query != query:
        logger.info(f"Follow-up expanded for retrieval: '{query[:60]}' + context")
        retrieval_vector = await embed_query(retrieval_query)
    else:
        retrieval_vector = query_vector

    # ── Run all 3 strategies in parallel ─────────────────────────────────
    # Strategy 1: In-memory numpy retrieval (v5 architecture) — primary
    # Strategy 2: Dense Qdrant search (fallback for cache-miss or extra recall)
    # Strategy 3: BM25 sparse search (keyword coverage)
    inmem_res, dense_res, bm25_res = await asyncio.gather(
        _safe(in_memory_retrieve(
            owner_id=owner_id,
            query_vector=retrieval_vector,
            top_k=settings.rerank_top_n,
            doc_ids=doc_ids,
        )),
        _safe(_dense_search(owner_id, retrieval_vector, doc_ids, settings.rerank_top_n)),
        _safe(_bm25_search(retrieval_query, owner_id=owner_id, top_k=settings.rerank_top_n, doc_ids=doc_ids)),
    )

    strategies = []
    if inmem_res:  strategies.append(f"inmem({len(inmem_res)})")
    if dense_res:  strategies.append(f"dense({len(dense_res)})")
    if bm25_res:   strategies.append(f"bm25({len(bm25_res)})")
    logger.info(f"Strategies: {', '.join(strategies) or 'none'}")

    # ── RRF merge with weights: in-memory > dense > bm25 ─────────────────
    # In-memory gets highest weight because:
    #   - It uses section-aware grouping (structural coherence signal)
    #   - Heading-prefixed text bakes structure into the vector itself
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

    add(inmem_res, 1.4)   # highest weight: v5 section-aware
    add(dense_res, 1.0)   # Qdrant dense fallback / extra recall
    add(bm25_res,  0.8)   # keyword coverage

    # Dedup by text
    by_text: dict[str, RetrievedChunk] = {}
    for c in rrf.values():
        key = c.text[:100].strip().lower()
        if key not in by_text or c.score > by_text[key].score:
            by_text[key] = c

    merged = sorted(by_text.values(), key=lambda x: x.score, reverse=True)
    result.total_candidates = len(merged)
    result.strategies_used = strategies
    result.dual_path_fallback_used = len(inmem_res) == 0

    logger.info(f"Merged: {len(merged)} candidates")

    result.chunks = await graph_rerank(
        query=retrieval_query,
        chunks=merged[:settings.rerank_top_n],
        query_vector=retrieval_vector,
        top_k=top_k,
    )

    # ── Sibling context expansion ─────────────────────────────────────────
    result.chunks = await expand_with_siblings(
        result.chunks, query_vector, max_total=top_k + 4,
    )

    result.images = await retrieve_images_for_text_query(
        query=effective_query,
        owner_id=owner_id,
        retrieved_chunks=result.chunks,
        top_k=5, doc_ids=doc_ids,
    )

    logger.info(
        f"Done: {len(result.chunks)} chunks, {len(result.images)} images | "
        f"hyde={result.hyde_used} strategies={strategies}"
    )
    return result


async def _dense_search(
    owner_id: str,
    query_vector: list[float],
    doc_ids: Optional[list[str]],
    top_k: int,
) -> list[RetrievedChunk]:
    owner_filter = qdrant_service.filter_by_owner(owner_id)
    filter_ = owner_filter if doc_ids is None else Filter(
        must=[owner_filter.must[0], _para_filter(doc_ids).must[0]]
    )
    hits = await qdrant_service.search_text(
        vector=query_vector, top_k=top_k,
        payload_filter=filter_,
        score_threshold=0.10,
    )
    return _hits_to_chunks(hits)


async def _safe(coro) -> list:
    try:
        return await coro or []
    except Exception as e:
        logger.warning(f"Strategy failed: {e}")
        return []


_ANAPHORA = (
    " it ", " this ", " that ", " these ", " those ", " they ", " them ",
    " he ", " she ", " him ", " her ", " his ", " its ",
)


def _looks_like_followup(query: str) -> bool:
    """Heuristic: bare follow-ups that embed poorly without prior context.

    Triggers on explicit anaphora ("what about the second one?", "why is it
    used?") or very short queries (<=4 words) that almost always continue the
    previous turn. Standalone questions pass through untouched.
    """
    q = f" {query.strip().lower()} "
    if any(marker in q for marker in _ANAPHORA):
        return True
    return len(query.split()) <= 4


def _expand_followup(query: str, history: Optional[list]) -> str:
    """Prepend the last user turn for follow-ups so retrieval sees context.

    Only the retrieval embedding/query uses the expanded form; the displayed
    prompt keeps the original question plus the full history block. Costs zero
    extra LLM calls (critical under free-tier quotas).
    """
    if not history:
        return query
    try:
        prior_users = [
            m.content if isinstance(m.content, str) else ""
            for m in history
            if getattr(m, "role", "") == "user" and getattr(m, "content", "")
        ]
        if not prior_users or not _looks_like_followup(query):
            return query
        expanded = f"{prior_users[-1]} {query}".strip()[:1000]
        return expanded if expanded != query else query
    except Exception as e:
        logger.debug(f"Follow-up expansion skipped: {e}")
        return query
