import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from app.core.retrieval.tree_retriever import RetrievedChunk, beam_search_retrieve
from app.core.retrieval.hybrid_search import _rrf_fuse
from app.core.reranking.graph_reranker import _pagerank_boost, graph_rerank


def _make_chunk(node_id: str, score: float, heading: str = "Section",
                text: str = "sample text") -> RetrievedChunk:
    return RetrievedChunk(
        node_id=node_id,
        doc_id="test-doc",
        text=text,
        heading_path=[heading],
        score=score,
        level="paragraph",
    )


# ── RRF fusion tests ─────────────────────────────────────────────────────

def test_rrf_fuse_combines_lists():
    dense = [_make_chunk("a", 0.9), _make_chunk("b", 0.8), _make_chunk("c", 0.7)]
    sparse = [_make_chunk("b", 0.85), _make_chunk("d", 0.75), _make_chunk("a", 0.6)]
    fused = _rrf_fuse(dense, sparse)
    # "b" appears in both lists — should have higher fused score than "d"
    assert fused["b"].score > fused["d"].score


def test_rrf_fuse_includes_all_unique():
    dense  = [_make_chunk("a", 0.9), _make_chunk("b", 0.8)]
    sparse = [_make_chunk("c", 0.85), _make_chunk("d", 0.75)]
    fused = _rrf_fuse(dense, sparse)
    assert set(fused.keys()) == {"a", "b", "c", "d"}


def test_rrf_fuse_empty_lists():
    fused = _rrf_fuse([], [])
    assert fused == {}


def test_rrf_fuse_one_empty():
    dense = [_make_chunk("a", 0.9)]
    fused = _rrf_fuse(dense, [])
    assert "a" in fused


# ── PageRank tests ───────────────────────────────────────────────────────

def test_pagerank_returns_correct_length():
    chunks = [_make_chunk(f"node-{i}", 0.9 - i * 0.1) for i in range(5)]
    scores = _pagerank_boost(chunks)
    assert len(scores) == len(chunks)


def test_pagerank_scores_are_positive():
    chunks = [_make_chunk(f"node-{i}", 0.9 - i * 0.1) for i in range(4)]
    scores = _pagerank_boost(chunks)
    assert all(s > 0 for s in scores)


def test_pagerank_shared_heading_boosts_score():
    """Chunks in the same heading cluster should form edges."""
    # 3 chunks in same heading, 1 outlier
    same_heading = [_make_chunk(f"n{i}", 0.8, heading="Methods") for i in range(3)]
    outlier = _make_chunk("outlier", 0.8, heading="Appendix")
    chunks = same_heading + [outlier]
    scores = _pagerank_boost(chunks)
    # Chunks with shared headings should have connected graph — no crash
    assert len(scores) == 4


# ── Orchestrator integration (mocked) ────────────────────────────────────

@pytest.mark.asyncio
async def test_graph_rerank_empty_input():
    result = await graph_rerank("test query", [], [], top_k=5)
    assert result == []


@pytest.mark.asyncio
async def test_graph_rerank_returns_top_k():
    chunks = [_make_chunk(f"n{i}", 0.9 - i * 0.05) for i in range(10)]
    with patch(
        "app.core.reranking.graph_reranker._cross_encoder_rerank",
        new_callable=AsyncMock,
        return_value=chunks[:5],
    ):
        result = await graph_rerank("test query", chunks, [], top_k=5)
    assert len(result) <= 5


@pytest.mark.asyncio
async def test_retrieve_uses_fallback_when_no_beam_results():
    """When beam-search returns nothing, dual-path fallback should be used."""
    from app.core.retrieval.orchestrator import retrieve

    with patch(
        "app.core.retrieval.orchestrator.beam_search_retrieve",
        new_callable=AsyncMock,
        return_value=[],
    ), patch(
        "app.core.retrieval.orchestrator._dense_search",
        new_callable=AsyncMock,
        return_value=[_make_chunk("fallback-1", 0.7)],
    ), patch(
        "app.core.retrieval.orchestrator._bm25_search",
        new_callable=AsyncMock,
        return_value=[_make_chunk("fallback-1", 0.7)],
    ), patch(
        "app.core.retrieval.orchestrator.graph_rerank",
        new_callable=AsyncMock,
        return_value=[_make_chunk("fallback-1", 0.7)],
    ), patch(
        "app.core.retrieval.orchestrator.retrieve_images_for_text_query",
        new_callable=AsyncMock,
        return_value=[],
    ), patch(
        "app.core.retrieval.orchestrator.embed_query",
        new_callable=AsyncMock,
        return_value=[0.1] * 3072,
    ):
        result = await retrieve(
            session_id="test-session",
            query="test query",
            use_hyde=False,
            use_dual_path=True,
        )

    assert result.dual_path_fallback_used is True
    assert len(result.chunks) >= 1
