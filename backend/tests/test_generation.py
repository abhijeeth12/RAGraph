import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from app.core.generation.context_builder import (
    build_context, BuiltContext, SYSTEM_PROMPT
)
from app.core.generation.llm_client import (
    _fallback_answer, _heading_based_questions
)
from app.core.retrieval.tree_retriever import RetrievedChunk
from app.core.retrieval.image_retriever import RetrievedImage
from app.models.search import ConversationMessage


def _chunk(node_id: str, text: str, heading: str = "Methods",
           score: float = 0.9) -> RetrievedChunk:
    return RetrievedChunk(
        node_id=node_id, doc_id="doc-1", text=text,
        heading_path=[heading], score=score, level="paragraph",
    )


def _image(img_id: str) -> RetrievedImage:
    return RetrievedImage(
        image_id=img_id, doc_id="doc-1",
        storage_url=f"/uploads/images/{img_id}.png",
        caption="Architecture diagram",
        fig_label="Fig 1",
        heading_path=["Methods"],
        nearest_heading="Methods",
        surrounding_text="The architecture is shown below.",
        score=0.85,
    )


# ── Context builder tests ─────────────────────────────────────────────────

def test_build_context_creates_citations():
    chunks = [_chunk(f"c{i}", f"Content about topic {i}") for i in range(3)]
    ctx = build_context("What is RAG?", chunks, [], [])
    assert len(ctx.citation_map) == 3
    assert 1 in ctx.citation_map
    assert 3 in ctx.citation_map


def test_build_context_system_prompt_present():
    ctx = build_context("test query", [], [], [])
    assert ctx.system_prompt == SYSTEM_PROMPT
    assert "cite" in ctx.system_prompt.lower()


def test_build_context_user_message_contains_query():
    chunks = [_chunk("c1", "Some relevant text")]
    ctx = build_context("my specific query", chunks, [], [])
    assert "my specific query" in ctx.user_message


def test_build_context_includes_image_info():
    chunks = [_chunk("c1", "Some text")]
    images = [_image("img1")]
    ctx = build_context("show architecture", chunks, images, [])
    assert "Fig 1" in ctx.user_message or "Architecture" in ctx.user_message


def test_build_context_respects_token_budget():
    # Large number of chunks — should not exceed budget
    big_chunks = [
        _chunk(f"c{i}", "x " * 500, score=0.9 - i * 0.01)
        for i in range(50)
    ]
    ctx = build_context("test", big_chunks, [], [])
    # Should have stopped before all 50
    assert len(ctx.citation_map) < 50
    assert ctx.total_tokens < 10000


def test_build_context_with_conversation_history():
    history = [
        ConversationMessage(role="user", content="What is RAG?"),
        ConversationMessage(role="assistant", content="RAG stands for..."),
    ]
    ctx = build_context("Tell me more", [], [], history)
    assert "USER" in ctx.user_message or "ASSISTANT" in ctx.user_message


def test_build_context_empty_chunks():
    ctx = build_context("empty query", [], [], [])
    assert ctx.citation_map == {}
    assert ctx.total_tokens > 0  # system prompt still counts


# ── LLM client helpers ────────────────────────────────────────────────────

def test_fallback_answer_with_no_citations():
    ctx = BuiltContext(
        system_prompt=SYSTEM_PROMPT,
        user_message="test",
        citation_map={},
        image_urls=[],
        total_tokens=100,
    )
    answer = _fallback_answer(ctx)
    assert "upload" in answer.lower() or "api key" in answer.lower()


def test_fallback_answer_with_citations():
    chunk = _chunk("c1", "The transformer uses attention mechanisms.")
    ctx = BuiltContext(
        system_prompt=SYSTEM_PROMPT,
        user_message="test",
        citation_map={1: chunk},
        image_urls=[],
        total_tokens=200,
    )
    answer = _fallback_answer(ctx)
    assert "transformer" in answer or "attention" in answer


def test_heading_based_questions():
    questions = _heading_based_questions(["Introduction", "Methods", "Results"])
    assert len(questions) == 3
    assert all(isinstance(q, str) for q in questions)


def test_heading_based_questions_fallback():
    questions = _heading_based_questions([])
    assert len(questions) > 0


# ── Full pipeline smoke test ──────────────────────────────────────────────

async def test_stream_answer_fallback_no_key():
    """With no API key, fallback answer should still stream."""
    from app.core.generation.llm_client import stream_answer
    chunk = _chunk("c1", "Attention is all you need.")
    ctx = build_context("What is attention?", [chunk], [], [])

    # Temporarily clear API keys
    import app.config as cfg
    original_key = cfg.settings.openai_api_key
    cfg.settings.openai_api_key = ""
    cfg.settings.anthropic_api_key = ""

    tokens = []
    async for delta in stream_answer(ctx, "gpt-4o"):
        tokens.append(delta)

    cfg.settings.openai_api_key = original_key

    assert len(tokens) > 0
    full = "".join(tokens)
    assert len(full) > 10


async def test_generate_related_fallback():
    """Related questions should work without API key."""
    from app.core.generation.llm_client import generate_related_questions
    import app.config as cfg
    original_key = cfg.settings.openai_api_key
    cfg.settings.openai_api_key = ""
    cfg.settings.anthropic_api_key = ""

    questions = await generate_related_questions(
        query="What is RAG?",
        answer="RAG stands for Retrieval Augmented Generation.",
        headings=["Introduction", "Methods"],
    )

    cfg.settings.openai_api_key = original_key
    assert isinstance(questions, list)
    assert len(questions) > 0
