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

import importlib.util
from app.models.tree import DocumentTree, NodeLevel, ImageNode
from app.utils.embeddings import embed_batch, embed_text
from app.config import settings
from app.utils.memory import trim_memory


async def embed_tree(tree: DocumentTree) -> DocumentTree:
    await _embed_text_nodes(tree)
    if settings.enable_images:
        await _embed_image_nodes(tree)
    trim_memory()
    return tree


async def _embed_text_nodes(tree: DocumentTree) -> None:
    nodes_to_embed = [n for n in tree.nodes if n.embedding is None]
    if not nodes_to_embed:
        return
    texts = [n.text for n in nodes_to_embed]
    logger.info(f"Embedding {len(texts)} text nodes...")
    embeddings = await embed_batch(texts, batch_size=16)
    for node, emb in zip(nodes_to_embed, embeddings):
        node.embedding = emb
    del texts, embeddings
    trim_memory()
    logger.info(f"Text nodes embedded: {len(nodes_to_embed)}")


async def _embed_image_nodes(tree: DocumentTree) -> None:
    if not settings.enable_images or not tree.images:
        return
    logger.info(f"Embedding {len(tree.images)} image nodes...")

    # Pre-extract any available CLIP vectors
    clip_vecs = {}
    for img in tree.images:
        clip_vec = _try_clip(img)
        if clip_vec:
            clip_vecs[img.id] = clip_vec
            img.clip_embedding = clip_vec

    # Gather all text contexts across all images into a unified batch
    image_slots: dict[str, list[tuple[str, str, float]]] = {}
    all_texts_to_embed: list[str] = []

    for img in tree.images:
        slots = []
        has_clip = img.id in clip_vecs
        caption_text = (img.caption or img.fig_label or "").strip()
        if caption_text:
            slots.append(("caption", caption_text, img.caption_weight if has_clip else 0.45))
            all_texts_to_embed.append(caption_text)

        heading_text = (img.nearest_heading or " > ".join(img.heading_path)).strip()
        if heading_text:
            slots.append(("heading", heading_text, img.heading_weight if has_clip else 0.35))
            all_texts_to_embed.append(heading_text)

        para_text = (img.surrounding_text[:400] if img.surrounding_text else "").strip()
        if para_text:
            slots.append(("paragraph", para_text, img.paragraph_weight if has_clip else 0.20))
            all_texts_to_embed.append(para_text)

        if not slots and not has_clip:
            fallback = f"image page {img.page_number} {img.image_ext}"
            slots.append(("fallback", fallback, 1.0))
            all_texts_to_embed.append(fallback)

        image_slots[img.id] = slots

    # Embed all unique text snippets across all images in a single batch
    text_embeddings_map = {}
    if all_texts_to_embed:
        unique_texts = list(dict.fromkeys(all_texts_to_embed))
        embs = await embed_batch(unique_texts, batch_size=16)
        text_embeddings_map = {t: emb for t, emb in zip(unique_texts, embs)}

    embedded = 0
    from app.utils.embeddings import fuse_embeddings
    for img in tree.images:
        vectors = []
        weights = []
        if img.id in clip_vecs:
            vectors.append(clip_vecs[img.id])
            weights.append(img.clip_weight)

        for _, text, weight in image_slots.get(img.id, []):
            if text in text_embeddings_map:
                vectors.append(text_embeddings_map[text])
                weights.append(weight)

        if vectors:
            total = sum(weights)
            norm_weights = [w / total for w in weights]
            img.composite_embedding = fuse_embeddings(vectors, norm_weights)
            embedded += 1
        else:
            logger.warning(f"No embedding possible for image {img.id}")

    trim_memory()
    logger.info(f"Image nodes embedded: {embedded}/{len(tree.images)}")


def _try_clip(img: ImageNode):
    """Try CLIP — returns None silently if not installed or images disabled."""
    if not settings.enable_images:
        return None
    if importlib.util.find_spec("clip") is None:
        return None
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
