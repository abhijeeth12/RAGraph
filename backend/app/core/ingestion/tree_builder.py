"""
Hierarchical Document Tree Builder.

KEY CHANGE vs original:
  H1/H2/H3 nodes are now ALSO embedded as standalone text nodes.
  This means the LLM sees both:
    - The heading text itself (for structural queries)
    - The paragraph chunks under it (for content queries)

  Previously only paragraphs were embedded and searchable.
  Now headings are first-class citizens in Qdrant.
"""
from __future__ import annotations
import uuid
from typing import Optional
from loguru import logger
import os

from app.core.ingestion.parser import ParsedDocument
from app.models.tree import TreeNode, ImageNode, DocumentTree, NodeLevel
from app.utils.text import (
    extract_heading_sections,
    chunk_by_tokens,
    count_tokens,
    clean_text,
)
from app.config import settings


def build_tree(parsed: ParsedDocument) -> DocumentTree:
    logger.info(f"Building tree for doc_id={parsed.doc_id} "
                f"({len(parsed.headings)} headings, {len(parsed.images)} images)")

    tree = DocumentTree(
        doc_id=parsed.doc_id,
        title=parsed.title or parsed.filename,
        source_filename=parsed.filename,
        total_pages=parsed.total_pages,
    )

    # ── Step 1: Extract sections ─────────────────────────────────────────
    if parsed.headings:
        sections = _sections_from_detected_headings(parsed)
        if not sections:
            logger.warning("Heading extraction failed — fallback to full text")
            sections = [("Document", 1, parsed.full_text)]
    else:
        raw_sections = extract_heading_sections(parsed.full_text)
        sections = [(k, 1, v) for k, v in raw_sections.items()]
        logger.debug("Used regex heading extraction")

    # ── Step 2: Root node ────────────────────────────────────────────────
    summary_text = _make_doc_summary(parsed)
    root = TreeNode(
        id=str(uuid.uuid4()),
        doc_id=parsed.doc_id,
        level=NodeLevel.DOCUMENT,
        parent_id=None,
        heading_path=[],
        text=summary_text,
        token_count=count_tokens(summary_text),
        page_number=1,
    )
    tree.nodes.append(root)

    # ── Step 3: Hierarchy ────────────────────────────────────────────────
    _build_hierarchy(tree, sections, parsed, root.id)

    # Fallback if nothing built
    if len(tree.nodes) == 1:
        logger.warning("No hierarchy built — fallback chunking full text")
        _add_paragraph_nodes(
            tree, parsed.doc_id, parsed.full_text,
            parent_id=root.id, heading_path=["Document"],
        )

    # ── Step 4: Images ───────────────────────────────────────────────────
    _build_image_nodes(tree, parsed)

    logger.info(
        f"Tree built: {len(tree.nodes)} nodes "
        f"(root=1, h1={_count(tree, NodeLevel.H1)}, "
        f"h2={_count(tree, NodeLevel.H2)}, "
        f"h3={_count(tree, NodeLevel.H3)}, "
        f"para={_count(tree, NodeLevel.PARAGRAPH)}), "
        f"{len(tree.images)} images"
    )
    return tree


def _sections_from_detected_headings(parsed: ParsedDocument):
    """
    Your improved version: sequential text matching instead of
    unreliable character offsets from PyMuPDF.
    """
    text = parsed.full_text
    headings = [h[0].strip() for h in parsed.headings]
    if not headings:
        return []

    positions = []
    for h in headings:
        idx = text.lower().find(h.lower())
        if idx != -1:
            positions.append((h, idx))

    positions.sort(key=lambda x: x[1])

    sections = []
    for i, (heading, start) in enumerate(positions):
        end = positions[i + 1][1] if i + 1 < len(positions) else len(text)
        content = text[start:end].replace(heading, "", 1).strip()
        if content:
            sections.append((heading, 1, content))

    return sections


def _build_hierarchy(
    tree: DocumentTree,
    sections,
    parsed: ParsedDocument,
    root_id: str,
):
    """
    Build node hierarchy.

    IMPORTANT: H1/H2/H3 nodes store HEADING TEXT + first ~300 chars
    of their section. This makes headings searchable via vector similarity
    even without their paragraph children being retrieved first.
    """
    current_h1: Optional[TreeNode] = None
    current_h2: Optional[TreeNode] = None

    for heading, level, content in sections:
        if not content.strip():
            continue

        if level == 1:
            # H1 node: heading text + content preview
            # ← This is the key: heading IS embedded with its content
            h1_text = heading + "\n" + content[:300]
            current_h1 = TreeNode(
                id=str(uuid.uuid4()),
                doc_id=parsed.doc_id,
                level=NodeLevel.H1,
                parent_id=root_id,
                heading_path=[heading],
                text=h1_text,
                token_count=count_tokens(h1_text),
            )
            tree.nodes.append(current_h1)
            current_h2 = None

            # Paragraph chunks under H1
            _add_paragraph_nodes(
                tree, parsed.doc_id, content,
                parent_id=current_h1.id,
                heading_path=[heading],
            )

        elif level == 2 and current_h1:
            h2_text = heading + "\n" + content[:200]
            current_h2 = TreeNode(
                id=str(uuid.uuid4()),
                doc_id=parsed.doc_id,
                level=NodeLevel.H2,
                parent_id=current_h1.id,
                heading_path=current_h1.heading_path + [heading],
                text=h2_text,
                token_count=count_tokens(h2_text),
            )
            tree.nodes.append(current_h2)

            _add_paragraph_nodes(
                tree, parsed.doc_id, content,
                parent_id=current_h2.id,
                heading_path=current_h2.heading_path,
            )

        elif level == 3 and current_h2:
            h3_text = heading + "\n" + content[:150]
            h3_node = TreeNode(
                id=str(uuid.uuid4()),
                doc_id=parsed.doc_id,
                level=NodeLevel.H3,
                parent_id=current_h2.id,
                heading_path=current_h2.heading_path + [heading],
                text=h3_text,
                token_count=count_tokens(h3_text),
            )
            tree.nodes.append(h3_node)

            _add_paragraph_nodes(
                tree, parsed.doc_id, content,
                parent_id=h3_node.id,
                heading_path=h3_node.heading_path,
            )

        else:
            # Orphan section — attach to nearest parent
            parent = (
                current_h2.id if current_h2
                else current_h1.id if current_h1
                else root_id
            )
            path = (
                current_h2.heading_path if current_h2
                else current_h1.heading_path if current_h1
                else []
            )
            _add_paragraph_nodes(
                tree, parsed.doc_id, content,
                parent_id=parent,
                heading_path=path + [heading],
            )


def _add_paragraph_nodes(
    tree: DocumentTree,
    doc_id: str,
    content: str,
    parent_id: str,
    heading_path: list[str],
):
    """
    Chunk content into paragraph nodes.
    Each chunk is prefixed with its heading for LLM context.
    chunk_size=200 tokens gives good granularity for retrieval.
    """
    heading = heading_path[-1] if heading_path else ""

    chunks = chunk_by_tokens(
        content,
        chunk_size=200,
        overlap=50,
        heading=heading,
    )

    for chunk in chunks:
        if not chunk.strip():
            continue
        node = TreeNode(
            id=str(uuid.uuid4()),
            doc_id=doc_id,
            level=NodeLevel.PARAGRAPH,
            parent_id=parent_id,
            heading_path=heading_path,
            text=clean_text(chunk),
            token_count=count_tokens(chunk),
        )
        tree.nodes.append(node)


def _build_image_nodes(tree: DocumentTree, parsed: ParsedDocument):
    os.makedirs(os.path.join(settings.local_storage_path, "images"), exist_ok=True)

    for raw_img in parsed.images:
        img_filename = f"{raw_img.id}.{raw_img.image_ext}"
        img_path = os.path.join(settings.local_storage_path, "images", img_filename)

        try:
            with open(img_path, "wb") as f:
                f.write(raw_img.image_bytes)
        except Exception as e:
            logger.warning(f"Failed to save image {img_filename}: {e}")
            continue

        # Find heading context from tree nodes (nearest H1 on same page)
        heading_path = _find_heading_path_for_page(tree, raw_img.page_number)

        img_node = ImageNode(
            id=raw_img.id,
            doc_id=parsed.doc_id,
            page_number=raw_img.page_number,
            storage_url=f"/uploads/images/{img_filename}",
            caption=raw_img.caption,
            fig_label=raw_img.fig_label,
            spatial_nearest_heading=raw_img.spatial_nearest_heading,
            spatial_y_coord=raw_img.bbox_y0,
            spatial_distance_to_heading=raw_img.spatial_distance,
            nearest_heading=raw_img.spatial_nearest_heading,
            heading_path=heading_path,
            surrounding_text="",
            width=raw_img.width,
            height=raw_img.height,
            image_ext=raw_img.image_ext,
        )
        tree.images.append(img_node)


def _find_heading_path_for_page(tree: DocumentTree, page_num: int) -> list[str]:
    """Find the heading path of H1 nodes on or before this page."""
    for node in reversed(tree.nodes):
        if (node.level == NodeLevel.H1
                and node.page_number
                and node.page_number <= page_num
                and node.heading_path):
            return node.heading_path
    return []


def _make_doc_summary(parsed: ParsedDocument) -> str:
    heading_list = ", ".join(h[0] for h in parsed.headings[:10])
    snippet = parsed.full_text[:600].replace("\n", " ")
    return (
        f"Document: {parsed.title}\n"
        f"Sections: {heading_list}\n"
        f"Content preview: {snippet}"
    )


def _count(tree: DocumentTree, level: NodeLevel) -> int:
    return sum(1 for n in tree.nodes if n.level == level)
