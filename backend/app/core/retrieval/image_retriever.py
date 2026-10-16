"""
Image Retriever — finds relevant images, deduplicates by storage_url.
Now filtered by owner_id for strict data isolation.
"""
from __future__ import annotations
from dataclasses import dataclass
from typing import Optional
from loguru import logger

from app.services.qdrant_service import qdrant_service
from app.core.retrieval.tree_retriever import RetrievedChunk
from app.config import settings


@dataclass
class RetrievedImage:
    image_id: str
    doc_id: str
    storage_url: str
    caption: Optional[str]
    fig_label: Optional[str]
    heading_path: list[str]
    nearest_heading: Optional[str]
    surrounding_text: str
    score: float
    width: Optional[int] = None
    height: Optional[int] = None


async def retrieve_images_for_text_query(
    query: str,
    owner_id: str,
    retrieved_chunks: list[RetrievedChunk],
    top_k: int = 5,
    doc_ids: Optional[list[str]] = None,
) -> list[RetrievedImage]:
    images: dict[str, RetrievedImage] = {}  # keyed by storage_url for dedup

    # Build owner filter for strict isolation
    owner_filter = qdrant_service.filter_by_owner(owner_id)

    # Strategy 1: text embedding -> image collection search (FILTERED by owner)
    try:
        from app.utils.embeddings import embed_query
        query_vec = await embed_query(query)
        hits = await qdrant_service.search_images(
            vector=query_vec,
            top_k=top_k * 3,        # fetch more, dedup reduces to top_k
            owner_filter=owner_filter,
            score_threshold=0.15,
        )
        for hit in hits:
            img = _hit_to_image(hit)
            url_key = img.storage_url   # deduplicate by file URL
            if url_key not in images or img.score > images[url_key].score:
                images[url_key] = img
        logger.debug(f"Text->image search: {len(hits)} hits, {len(images)} unique")
    except Exception as e:
        logger.warning(f"Text->image search failed: {e}")

    # Strategy 2: chunk-referenced images
    referenced_ids: set[str] = set()
    for chunk in retrieved_chunks:
        for img_id in chunk.image_ids:
            referenced_ids.add(img_id)

    if referenced_ids:
        for img_id in referenced_ids:
            try:
                result = await qdrant_service._client.retrieve(
                    collection_name=settings.qdrant_image_collection,
                    ids=[img_id],
                    with_payload=True, with_vectors=False,
                )
                if result:
                    # Verify ownership before including
                    payload = result[0].payload
                    if payload.get("owner_id") == owner_id:
                        hit = {"id": img_id, "score": 0.75, "payload": payload}
                        img = _hit_to_image(hit)
                        url_key = img.storage_url
                        if url_key in images:
                            images[url_key].score = min(1.0, images[url_key].score + 0.15)
                        else:
                            images[url_key] = img
            except Exception as e:
                logger.debug(f"Could not fetch image {img_id}: {e}")

    ranked = sorted(images.values(), key=lambda x: x.score, reverse=True)[:top_k]
    logger.info(f"Image retrieval: {len(ranked)} unique images found")
    return ranked


async def retrieve_for_image_query(
    image_base64: str,
    owner_id: str,
    top_k_images: int = 5,
    top_k_text: int = 8,
    doc_ids: Optional[list[str]] = None,
) -> tuple[list[RetrievedChunk], list[RetrievedImage]]:
    import base64, tempfile, os
    img_bytes = base64.b64decode(image_base64)
    with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp:
        tmp.write(img_bytes)
        tmp_path = tmp.name
    text_chunks: list[RetrievedChunk] = []
    similar_images: list[RetrievedImage] = []

    # Build owner filter for strict isolation
    owner_filter = qdrant_service.filter_by_owner(owner_id)

    try:
        from app.utils.embeddings import embed_image_clip
        clip_vec = embed_image_clip(tmp_path)
        img_hits = await qdrant_service.search_images(
            vector=clip_vec, top_k=top_k_images,
            owner_filter=owner_filter,
            score_threshold=0.15,
        )
        seen_urls: set[str] = set()
        for h in img_hits:
            img = _hit_to_image(h)
            if img.storage_url not in seen_urls:
                similar_images.append(img)
                seen_urls.add(img.storage_url)
    except Exception:
        logger.warning("CLIP not available for image query")
    finally:
        try:
            os.unlink(tmp_path)
        except Exception:
            pass
    return text_chunks, similar_images


def _hit_to_image(hit: dict) -> RetrievedImage:
    p = hit.get("payload") or {}
    return RetrievedImage(
        image_id=str(hit["id"]),
        doc_id=p.get("doc_id", ""),
        storage_url=p.get("storage_url", ""),
        caption=p.get("caption"),
        fig_label=p.get("fig_label"),
        heading_path=p.get("heading_path", []),
        nearest_heading=p.get("nearest_heading") or p.get("spatial_nearest_heading"),
        surrounding_text=p.get("surrounding_text", ""),
        score=float(hit.get("score", 0.5)),
        width=p.get("width"),
        height=p.get("height"),
    )
