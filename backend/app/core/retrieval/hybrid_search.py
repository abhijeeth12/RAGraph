"""
Hybrid Search — Dense + BM25 + RRF fusion with text deduplication.

Optimized for memory efficiency (Render Free Tier 512MB limit):
  - Fast regex tokenization (replaces heavy NLTK word_tokenize allocations)
  - Reuses in_memory_store cached paragraphs when available (avoids 1,000-point Qdrant scrolls)
  - Caches compiled BM25 index on the OwnerCache object
  - Bounded scroll window when falling back to Qdrant
"""
from __future__ import annotations
import re
from loguru import logger
from typing import Optional

from app.core.retrieval.tree_retriever import RetrievedChunk
from app.services.qdrant_service import qdrant_service
from app.config import settings
from app.core.retrieval import in_memory_store
from app.utils.memory import trim_memory

RRF_K = 60
_WORD_REGEX = re.compile(r"\w+", re.UNICODE)


def _tokenize(text: str) -> list[str]:
    """Lightweight, low-memory tokenization replacing heavy NLTK tokenizers."""
    return _WORD_REGEX.findall(text.lower()) if text else []


async def hybrid_search(
    owner_id: str,
    query: str,
    query_vector: list[float],
    top_k: int = None,
    doc_ids: Optional[list[str]] = None,
) -> list[RetrievedChunk]:
    top_k = top_k or settings.top_k_final

    from qdrant_client.models import Filter
    owner_filter = qdrant_service.filter_by_owner(owner_id)
    dense_filter = _doc_filter(doc_ids)
    payload_filter = owner_filter if dense_filter is None else Filter(
        must=[owner_filter.must[0], dense_filter.must[0]]
    )

    dense_hits = await qdrant_service.search_text(
        vector=query_vector, top_k=settings.rerank_top_n,
        payload_filter=payload_filter,
    )
    dense_chunks = _hits_to_chunks(dense_hits)
    logger.debug(f"Dense search: {len(dense_chunks)} hits")

    bm25_chunks = await _bm25_search(query, owner_id=owner_id, top_k=settings.rerank_top_n, doc_ids=doc_ids)
    logger.debug(f"BM25 search: {len(bm25_chunks)} hits")

    fused = _rrf_fuse(dense_chunks, bm25_chunks, k=RRF_K)

    # Deduplicate by text content
    seen_text: dict[str, RetrievedChunk] = {}
    for chunk in fused.values():
        text_key = chunk.text[:100].strip().lower()
        if text_key not in seen_text or chunk.score > seen_text[text_key].score:
            seen_text[text_key] = chunk

    ranked = sorted(seen_text.values(), key=lambda x: x.score, reverse=True)[:top_k]
    logger.info(f"Hybrid search: {len(ranked)} chunks after RRF + dedup")
    return ranked


async def _bm25_search(
    query: str,
    owner_id: str,
    top_k: int,
    doc_ids: Optional[list[str]] = None,
) -> list[RetrievedChunk]:
    """
    BM25 search filtered by owner_id.
    Reuses paragraphs from in_memory_store to eliminate redundant Qdrant round-trips.
    """
    try:
        from rank_bm25 import BM25Okapi

        tokens_query = _tokenize(query)
        if not tokens_query:
            return []

        # 1. Fast path: check if in_memory_store already cached paragraphs for this owner
        cache = in_memory_store.get_cached_now(owner_id)
        if cache and cache.paragraphs:
            paras = cache.paragraphs
            if doc_ids:
                doc_set = set(doc_ids)
                paras = [p for p in paras if p.doc_id in doc_set]

            if not paras:
                return []

            # Reuse cached BM25 index on cache entry if available and unfiltered
            if not doc_ids and cache.bm25_index is not None:
                bm25 = cache.bm25_index
                corpus_paras = cache.paragraphs
                corpus = [_tokenize(p.text) for p in paras]
                bm25 = BM25Okapi(corpus)
                del corpus  # Free tokenized corpus list immediately
                corpus_paras = paras
                if not doc_ids:
                    cache.bm25_index = bm25

            scores = bm25.get_scores(tokens_query)
            top_indices = sorted(range(len(scores)), key=lambda i: scores[i], reverse=True)[:top_k]

            chunks = []
            for idx in top_indices:
                if scores[idx] <= 0:
                    continue
                p = corpus_paras[idx]
                chunks.append(RetrievedChunk(
                    node_id=p.node_id,
                    doc_id=p.doc_id,
                    text=p.text,
                    heading_path=p.heading_path,
                    score=float(scores[idx]),
                    level="paragraph",
                    page_number=p.page_number,
                    image_ids=p.image_ids,
                    parent_id=p.parent_id,
                ))
            return chunks

        # 2. Slow path: In-memory cache miss, fallback to bounded Qdrant scroll
        from qdrant_client.models import Filter
        para_filter = _para_filter(doc_ids)
        owner_filter = qdrant_service.filter_by_owner(owner_id)
        combined_conditions = owner_filter.must + para_filter.must
        scroll_filter = Filter(must=combined_conditions)

        # Bounded limit of 250 (instead of 1000) to keep memory footprint flat
        scroll_result = await qdrant_service._client.scroll(
            collection_name=settings.qdrant_text_collection,
            scroll_filter=scroll_filter,
            limit=250,
            with_payload=True,
            with_vectors=False,
        )
        points = scroll_result[0]
        if not points:
            return []

        corpus = [_tokenize(p.payload.get("text", "")) for p in points]
        bm25 = BM25Okapi(corpus)
        del corpus  # Free tokenized corpus list immediately
        scores = bm25.get_scores(tokens_query)
        top_indices = sorted(range(len(scores)), key=lambda i: scores[i], reverse=True)[:top_k]

        chunks = []
        for idx in top_indices:
            if scores[idx] <= 0:
                continue
            p = points[idx]
            payload = p.payload or {}
            chunks.append(RetrievedChunk(
                node_id=str(p.id),
                doc_id=payload.get("doc_id", ""),
                text=payload.get("text", ""),
                heading_path=payload.get("heading_path", []),
                score=float(scores[idx]),
                level="paragraph",
                page_number=payload.get("page_number"),
                image_ids=payload.get("image_ids", []),
                parent_id=payload.get("parent_id"),
            ))

        trim_memory()
        return chunks

    except Exception as e:
        logger.warning(f"BM25 search failed: {e}")
        return []


def _rrf_fuse(dense: list[RetrievedChunk], sparse: list[RetrievedChunk], k: int = 60) -> dict[str, RetrievedChunk]:
    fused: dict[str, RetrievedChunk] = {}

    def add_ranked(chunks: list[RetrievedChunk], weight: float = 1.0):
        for rank, chunk in enumerate(chunks):
            rrf_score = weight / (k + rank + 1)
            if chunk.node_id in fused:
                fused[chunk.node_id].score += rrf_score
            else:
                fused[chunk.node_id] = RetrievedChunk(
                    node_id=chunk.node_id, doc_id=chunk.doc_id,
                    text=chunk.text, heading_path=chunk.heading_path,
                    score=rrf_score, level=chunk.level,
                    page_number=chunk.page_number,
                    image_ids=chunk.image_ids, parent_id=chunk.parent_id,
                )

    add_ranked(dense, weight=1.0)
    add_ranked(sparse, weight=0.8)
    return fused


def _hits_to_chunks(hits: list[dict]) -> list[RetrievedChunk]:
    chunks = []
    for hit in hits:
        p = hit["payload"]
        chunks.append(RetrievedChunk(
            node_id=str(hit["id"]), doc_id=p.get("doc_id", ""),
            text=p.get("text", ""), heading_path=p.get("heading_path", []),
            score=hit["score"], level=p.get("level", "paragraph"),
            page_number=p.get("page_number"), image_ids=p.get("image_ids", []),
            parent_id=p.get("parent_id"),
        ))
    return chunks


def _doc_filter(doc_ids: Optional[list[str]]):
    if not doc_ids:
        return None
    from qdrant_client.models import Filter, FieldCondition, MatchAny
    return Filter(must=[FieldCondition(key="doc_id", match=MatchAny(any=doc_ids))])


def _para_filter(doc_ids: Optional[list[str]]):
    from qdrant_client.models import Filter, FieldCondition, MatchValue, MatchAny
    conditions = [FieldCondition(key="level", match=MatchValue(value="paragraph"))]
    if doc_ids:
        conditions.append(FieldCondition(key="doc_id", match=MatchAny(any=doc_ids)))
    return Filter(must=conditions)
