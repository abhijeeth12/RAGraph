"""
Embedder — generates embeddings for all tree nodes and image nodes.

Text nodes  : all-MiniLM-L6-v2 via sentence-transformers
Image nodes : text-only composite (no CLIP required)
              caption * 0.45 + heading * 0.35 + paragraph * 0.20

When CLIP is eventually installed, the composite will automatically
include the visual embedding and re-weight accordingly.
"""
from __future__ import annotations
import asyncio
from loguru import logger

from app.models.tree import DocumentTree, NodeLevel, ImageNode
from app.utils.embeddings import embed_batch, embed_text
from app.config import settings


async def embed_tree(tree: DocumentTree) -> DocumentTree:
    await _embed_text_nodes(tree)
    await _embed_image_nodes(tree)
    return tree


async def _embed_text_nodes(tree: DocumentTree) -> None:
    nodes_to_embed = [n for n in tree.nodes if n.embedding is None]
    if not nodes_to_embed:
        return
    texts = [n.text for n in nodes_to_embed]
    logger.info(f"Embedding {len(texts)} text nodes...")
    embeddings = await embed_batch(texts, batch_size=64)
    for node, emb in zip(nodes_to_embed, embeddings):
        node.embedding = emb
    logger.info(f"Text nodes embedded: {len(nodes_to_embed)}")


async def _embed_image_nodes(tree: DocumentTree) -> None:
    if not tree.images:
        return
    logger.info(f"Embedding {len(tree.images)} image nodes...")
    embedded = 0
    for img in tree.images:
        success = await _embed_image_text_only(img)
        if success:
            embedded += 1
    logger.info(f"Image nodes embedded: {embedded}/{len(tree.images)}")


async def _embed_image_text_only(img: ImageNode) -> bool:
    """
    Build composite embedding from text context only.
    No CLIP required — uses the same MiniLM model as text nodes.

    Weights (text-only, sum to 1.0):
      caption          0.45  (most descriptive for the image content)
      nearest_heading  0.35  (document structural context)
      surrounding_text 0.20  (paragraph context)
    """
    vectors = []
    weights = []

    # Try CLIP first (optional — no crash if missing)
    clip_vec = _try_clip(img)
    if clip_vec:
        vectors.append(clip_vec)
        weights.append(img.clip_weight)
        img.clip_embedding = clip_vec

    # Caption
    caption_text = img.caption or img.fig_label or ""
    if caption_text.strip():
        try:
            vec = await embed_text(caption_text)
            weight = img.caption_weight if clip_vec else 0.45
            vectors.append(vec)
            weights.append(weight)
        except Exception as e:
            logger.debug(f"Caption embed failed: {e}")

    # Heading
    heading_text = img.nearest_heading or " > ".join(img.heading_path)
    if heading_text.strip():
        try:
            vec = await embed_text(heading_text)
            weight = img.heading_weight if clip_vec else 0.35
            vectors.append(vec)
            weights.append(weight)
        except Exception as e:
            logger.debug(f"Heading embed failed: {e}")

    # Surrounding paragraph
    para_text = img.surrounding_text[:400] if img.surrounding_text else ""
    if para_text.strip():
        try:
            vec = await embed_text(para_text)
            weight = img.paragraph_weight if clip_vec else 0.20
            vectors.append(vec)
            weights.append(weight)
        except Exception as e:
            logger.debug(f"Paragraph embed failed: {e}")

    if not vectors:
        # Last resort: embed the storage URL path as a dummy signal
        fallback = f"image page {img.page_number} {img.image_ext}"
        try:
            vec = await embed_text(fallback)
            vectors.append(vec)
            weights.append(1.0)
        except Exception:
            logger.warning(f"No embedding possible for image {img.id}")
            return False

    # Normalise weights to sum to 1
    total = sum(weights)
    weights = [w / total for w in weights]

    from app.utils.embeddings import fuse_embeddings
    img.composite_embedding = fuse_embeddings(vectors, weights)
    return True


def _try_clip(img: ImageNode):
    """Try CLIP — returns None silently if not installed."""
    import os
    img_path = os.path.join(
        settings.local_storage_path, "images",
        f"{img.id}.{img.image_ext}"
    )
    if not os.path.exists(img_path):
        return None
    try:
        from app.utils.embeddings import embed_image_clip
        return embed_image_clip(img_path)
    except Exception:
        return None
