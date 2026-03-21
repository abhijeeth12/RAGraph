"""
Qdrant Indexer — uploads the embedded DocumentTree.

KEY CHANGE:
  Now indexes H1/H2/H3 nodes in the text collection alongside paragraphs.
  This means:
    - Heading searches work via beam-search (level filter)
    - Heading text is also searchable via dense global search
    - LLM gets heading context even when only H1 nodes are retrieved

  ALL nodes with embeddings are indexed, regardless of level.
"""
from __future__ import annotations
from loguru import logger
from qdrant_client.models import PointStruct

from app.models.tree import DocumentTree, NodeLevel
from app.services.qdrant_service import qdrant_service


async def index_tree(tree: DocumentTree) -> dict:
    text_points = _build_text_points(tree)
    image_points = _build_image_points(tree)

    if text_points:
        logger.info(f"Uploading {len(text_points)} text points to Qdrant...")
        for i in range(0, len(text_points), 100):
            await qdrant_service.upsert_text_nodes(text_points[i:i + 100])
        logger.info(f"Text nodes indexed: {len(text_points)}")

    if image_points:
        logger.info(f"Uploading {len(image_points)} image points to Qdrant...")
        for i in range(0, len(image_points), 50):
            await qdrant_service.upsert_image_nodes(image_points[i:i + 50])
        logger.info(f"Image nodes indexed: {len(image_points)}")

    # Count by level for stats
    level_counts = {}
    for pt in text_points:
        lvl = pt.payload.get("level", "unknown")
        level_counts[lvl] = level_counts.get(lvl, 0) + 1
    logger.info(f"Level distribution: {level_counts}")

    return {
        "text_points": len(text_points),
        "image_points": len(image_points),
        "doc_id": tree.doc_id,
        "level_counts": level_counts,
    }


def _build_text_points(tree: DocumentTree) -> list[PointStruct]:
    points = []
    skipped = 0
    for node in tree.nodes:
        if not node.embedding:
            skipped += 1
            continue
        # Index ALL levels: document, h1, h2, h3, paragraph
        level_val = node.level if isinstance(node.level, str) else node.level.value
        points.append(PointStruct(
            id=node.id,
            vector=node.embedding,
            payload={
                "doc_id":       node.doc_id,
                "level":        level_val,
                "parent_id":    node.parent_id,
                "heading_path": node.heading_path,
                "text":         node.text[:1000],
                "token_count":  node.token_count,
                "page_number":  node.page_number,
                "image_ids":    node.image_ids,
            },
        ))
    if skipped:
        logger.warning(f"Skipped {skipped} nodes without embeddings")
    return points


def _build_image_points(tree: DocumentTree) -> list[PointStruct]:
    points = []
    for img in tree.images:
        if not img.composite_embedding:
            logger.warning(f"Image {img.id} has no composite embedding — skipping")
            continue
        points.append(PointStruct(
            id=img.id,
            vector=img.composite_embedding,
            payload={
                "doc_id":                  img.doc_id,
                "page_number":             img.page_number,
                "storage_url":             img.storage_url,
                "caption":                 img.caption,
                "fig_label":               img.fig_label,
                "heading_path":            img.heading_path,
                "nearest_heading":         img.nearest_heading,
                "spatial_nearest_heading": img.spatial_nearest_heading,
                "surrounding_text":        img.surrounding_text[:500],
                "width":                   img.width,
                "height":                  img.height,
            },
        ))
    return points
