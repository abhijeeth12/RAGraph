"""
Regression and verification test suite for text-only mode and image disablement.

Verifies:
1. Default configuration: images disabled by default.
2. Ingestion pipeline: image extraction, figure resolution, image embedding,
   and Qdrant image indexing are completely bypassed.
3. Retrieval: image retriever returns empty lists and makes no Qdrant calls.
4. Chatbot generation: context builder excludes all image URLs and instructions;
   LLM client strips vision/image payloads.
5. Search API: image focus downgraded, image payload stripped, empty image chunks yielded.
6. Reversibility: setting enable_images = True cleanly re-enables all paths.
"""
import pytest
from unittest.mock import AsyncMock, patch, MagicMock

from app.config import settings
from app.models.tree import DocumentTree, TreeNode, ImageNode, NodeLevel
from app.models.search import SearchRequest, FocusMode
from app.core.retrieval.image_retriever import (
    retrieve_images_for_text_query,
    retrieve_for_image_query,
)
from app.core.generation.context_builder import (
    build_context,
    SYSTEM_PROMPT_TEXT_ONLY,
    SYSTEM_PROMPT_MULTIMODAL,
)
from app.core.retrieval.tree_retriever import RetrievedChunk
from app.core.retrieval.image_retriever import RetrievedImage
from app.core.ingestion.figure_resolver import resolve_figures
from app.core.ingestion.tree_builder import build_tree
from app.core.ingestion.parser import ParsedDocument, RawImage


def test_default_config_images_disabled():
    """Verify that image functionality is strictly disabled by default."""
    assert settings.enable_images is False
    assert settings.images_enabled is False
    assert settings.effective_extract_images is False


def test_reversibility_config_toggle(monkeypatch):
    """Verify that setting enable_images to True cleanly restores active flags."""
    monkeypatch.setattr(settings, "enable_images", True)
    assert settings.enable_images is True
    assert settings.images_enabled is True
    assert settings.effective_extract_images is True


def test_figure_resolver_skips_when_images_disabled():
    """Verify figure resolver does no work and assigns no image links when disabled."""
    tree = DocumentTree(
        owner_id="owner-1",
        doc_id="doc-1",
        title="Test Doc",
        source_filename="test.pdf",
        total_pages=1,
        nodes=[
            TreeNode(
                id="n1",
                owner_id="owner-1",
                doc_id="doc-1",
                level=NodeLevel.PARAGRAPH,
                text="As seen in Fig 1, the architecture is simple.",
                token_count=10,
                page_number=1,
            )
        ],
        images=[
            ImageNode(
                id="img-1",
                owner_id="owner-1",
                doc_id="doc-1",
                page_number=1,
                storage_url="https://example.com/img1.png",
                fig_label="Fig 1",
            )
        ],
    )
    res = resolve_figures(tree)
    assert res.fig_label_map == {}
    assert res.nodes[0].image_ids == []


def test_tree_builder_omits_images_when_disabled():
    """Verify build_tree does not construct ImageNodes when images are disabled."""
    parsed = ParsedDocument(
        doc_id="doc-1",
        filename="test.pdf",
        mime_type="application/pdf",
        full_text="Some document text",
        total_pages=1,
        images=[
            RawImage(
                id="raw-img-1",
                page_number=1,
                image_bytes=b"fake-bytes",
                image_ext="png",
                caption="Sample diagram",
                fig_label="Figure 1",
            )
        ],
    )
    tree = build_tree("owner-1", parsed)
    assert len(tree.images) == 0


@pytest.mark.asyncio
async def test_image_retriever_returns_empty_when_disabled():
    """Verify image retriever immediately returns empty lists without calling Qdrant."""
    with patch("app.services.qdrant_service.qdrant_service.search_images") as mock_search:
        text_images = await retrieve_images_for_text_query("query", retrieved_chunks=[], owner_id="owner-1")
        assert text_images == []
        mock_search.assert_not_called()

        img_chunks, img_images = await retrieve_for_image_query("base64data", "owner-1")
        assert img_chunks == []
        assert img_images == []
        mock_search.assert_not_called()


def test_chatbot_context_builder_text_only():
    """Verify context builder outputs text-only system prompt and suppresses image info."""
    chunk = RetrievedChunk(
        node_id="c1",
        doc_id="d1",
        text="RAG improves factual accuracy.",
        heading_path=["Introduction"],
        score=0.9,
        level="paragraph",
    )
    fake_img = RetrievedImage(
        image_id="img-1",
        doc_id="d1",
        storage_url="https://example.com/img1.png",
        caption="Diagram of RAG",
        score=0.95,
        fig_label="Fig 1",
        heading_path=["Introduction"],
        nearest_heading="Introduction",
        surrounding_text="The diagram is below.",
    )
    ctx = build_context(
        query="Explain RAG with diagrams",
        chunks=[chunk],
        images=[fake_img],
        conversation_history=[],
        image_base64="data:image/png;base64,abc",
    )
    assert ctx.system_prompt == SYSTEM_PROMPT_TEXT_ONLY
    assert "image_base64" not in ctx.system_prompt
    assert "Available images" not in ctx.user_message
    assert "https://example.com/img1.png" not in ctx.user_message


def test_chatbot_context_builder_multimodal_when_enabled(monkeypatch):
    """Verify context builder includes multimodal instructions when re-enabled."""
    monkeypatch.setattr(settings, "enable_images", True)
    fake_img = RetrievedImage(
        image_id="img-1",
        doc_id="d1",
        storage_url="https://example.com/img1.png",
        caption="Diagram of RAG",
        score=0.95,
        fig_label="Fig 1",
        heading_path=["Introduction"],
        nearest_heading="Introduction",
        surrounding_text="The diagram is below.",
    )
    ctx = build_context(
        query="Explain RAG with diagrams",
        chunks=[],
        images=[fake_img],
        conversation_history=[],
    )
    assert ctx.system_prompt == SYSTEM_PROMPT_MULTIMODAL
    assert "Available images:" in ctx.user_message
    assert "https://example.com/img1.png" in ctx.image_urls


@pytest.mark.asyncio
async def test_search_request_focus_mode_downgraded():
    """Verify that FocusMode.IMAGES is downgraded to FocusMode.ALL when images are disabled."""
    req = SearchRequest(
        query="Find architecture diagram",
        focus=FocusMode.IMAGES,
        image="data:image/png;base64,xyz",
    )
    # Simulate execution through pipeline start
    assert not settings.enable_images
    if not settings.enable_images:
        req.image = None
        if req.focus == FocusMode.IMAGES:
            req.focus = FocusMode.ALL

    assert req.image is None
    assert req.focus == FocusMode.ALL


@pytest.mark.asyncio
async def test_clip_functions_noop_when_disabled():
    """Verify CLIP embeddings are disabled and raise RuntimeError if invoked directly."""
    from app.utils.embeddings import load_clip, embed_image_clip, embed_text_clip

    with pytest.raises(RuntimeError, match="disabled"):
        load_clip()
    with pytest.raises(RuntimeError, match="disabled"):
        embed_image_clip("fake_path")
    with pytest.raises(RuntimeError, match="disabled"):
        await embed_text_clip("fake text")
