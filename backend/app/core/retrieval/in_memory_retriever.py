"""
In-Memory Tree Retriever — RAGraph v5.

Replaces the multi-round Qdrant beam search (H1→H2→paragraph) with a single
numpy matmul over cached paragraph vectors, followed by section-aware grouping.

Architecture (from benchmark v5):
  1. Load owner's paragraph vectors from in_memory_store (cold: ~30ms, warm: 0ms)
  2. ONE numpy matmul on ALL paragraphs (~0.02ms for typical document sets)
  3. Section-aware grouping: 7 beam (top 3 sections) + 3 diverse (~0.01ms)

Result: ~0.05ms query latency vs ~13ms+ Qdrant round-trip.

The old Qdrant beam-search is kept as a fallback when the in-memory cache
is unavailable (e.g., Qdrant scroll fails).
"""
from __future__ import annotations

import copy
from dataclasses import dataclass, field
from typing import Optional

import numpy as np
from loguru import logger

from app.config import settings
from app.core.retrieval.tree_retriever import RetrievedChunk
from app.core.retrieval import in_memory_store


# ─── Section-aware budget (matches benchmark v5) ─────────────────────────────
BEAM_BUDGET    = 7   # results from top N sections (coherent core)
DIVERSE_BUDGET = 3   # results from other sections (coverage)
TOP_SECTIONS   = 3   # number of sections to treat as "beam"


async def in_memory_retrieve(
    owner_id: str,
    query_vector: list[float],
    top_k: int = None,
    doc_ids: Optional[list[str]] = None,
) -> list[RetrievedChunk]:
    """
    Fast in-memory retrieval using cached paragraph vectors.

    Falls back to [] if cache is unavailable; the orchestrator will then
    use other strategies (dense Qdrant, BM25) to fill results.
    """
    top_k = top_k or settings.top_k_final

    cache = await in_memory_store.get_or_load(owner_id)
    if cache is None or len(cache.paragraphs) == 0:
        logger.debug(f"In-memory cache miss for owner={owner_id[:8]}")
        return []

    paragraphs = cache.paragraphs
    para_vecs  = cache.para_vecs

    # ── Optional: filter to specific doc_ids ─────────────────────────────
    if doc_ids:
        doc_set = set(doc_ids)
        indices = [i for i, p in enumerate(paragraphs) if p.doc_id in doc_set]
        if not indices:
            return []
        idx_arr    = np.array(indices)
        para_vecs  = para_vecs[idx_arr]
        paragraphs = [paragraphs[i] for i in indices]

    # ── Single numpy matmul ───────────────────────────────────────────────
    q_vec = np.array(query_vector, dtype=np.float32)
    norm  = np.linalg.norm(q_vec)
    if norm > 0:
        q_vec /= norm

    scores = para_vecs @ q_vec   # (P,) cosine similarities

    # Get top candidates with extra headroom for section-aware selection
    n_candidates = min(len(paragraphs), top_k * 3)
    top_idx      = np.argsort(scores)[::-1][:n_candidates]

    # ── Build candidate list with dedup ──────────────────────────────────
    candidates: list[dict] = []
    seen: set[str] = set()
    for i in top_idx:
        key = paragraphs[i].text[:80].lower()
        if key in seen:
            continue
        seen.add(key)
        candidates.append({
            "score":        float(scores[i]),
            "para":         paragraphs[i],
        })

    if not candidates:
        return []

    # ── Section-aware grouping (benchmark v5 algorithm) ──────────────────
    # Identify top sections by best candidate score
    section_best: dict[str, float] = {}
    for c in candidates:
        sid = c["para"].section_id
        if sid not in section_best:
            section_best[sid] = c["score"]

    ranked_sids = sorted(section_best.keys(),
                         key=lambda s: section_best[s], reverse=True)
    beam_sids   = set(ranked_sids[:TOP_SECTIONS])

    # 7 from top sections (coherent core) + 3 from others (coverage)
    beam     = [c for c in candidates if c["para"].section_id in beam_sids][:BEAM_BUDGET]
    beam_keys = {c["para"].text[:80] for c in beam}
    diverse  = [
        c for c in candidates
        if c["para"].section_id not in beam_sids
        and c["para"].text[:80] not in beam_keys
    ][:DIVERSE_BUDGET]

    final = beam + diverse

    # Fill remaining slots from all candidates
    if len(final) < top_k:
        used = {c["para"].text[:80] for c in final}
        for c in candidates:
            if len(final) >= top_k:
                break
            if c["para"].text[:80] not in used:
                final.append(c)
                used.add(c["para"].text[:80])

    final = final[:top_k]

    logger.debug(
        f"In-memory retrieve: {len(final)} chunks "
        f"(beam={len(beam)}, diverse={len(diverse)}) | owner={owner_id[:8]}"
    )

    # ── Convert to RetrievedChunk ─────────────────────────────────────────
    return [
        RetrievedChunk(
            node_id=c["para"].node_id,
            doc_id=c["para"].doc_id,
            text=c["para"].text,
            heading_path=c["para"].heading_path,
            score=c["score"],
            level=c["para"].level,
            page_number=c["para"].page_number,
            image_ids=c["para"].image_ids,
            parent_id=c["para"].parent_id,
        )
        for c in final
    ]
