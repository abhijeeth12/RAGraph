"""
Ingestion Pipeline — orchestrates all Phase 2 steps.

parse → build_tree → resolve_figures → embed → index

Called by the document upload background task.
"""
from __future__ import annotations
import time
import asyncio
from loguru import logger

from app.core.ingestion.parser import parse_document
from app.core.ingestion.tree_builder import build_tree
from app.core.ingestion.figure_resolver import resolve_figures
from app.core.ingestion.embedder import embed_tree
from app.core.ingestion.indexer import index_tree
from app.models.documents import DocumentMetadata, DocumentStatus
from app.utils.memory import trim_memory


async def run_ingestion(owner_id: str, metadata: DocumentMetadata) -> DocumentMetadata:
    """
    Full ingestion pipeline for one document.
    Updates metadata.status at each step.
    Returns updated metadata.
    """
    start = time.time()
    doc_id = metadata.id

    logger.info(f"=== Ingestion start: {metadata.original_filename} ===")

    try:
        # ── Step 1: Parse ────────────────────────────────────────────────
        # Reversibility: S3 objects are downloaded to temp via storage service;
        # local paths pass through unchanged (Render-safe default).
        from app.services import storage_service as store
        parse_path = store.ensure_local(metadata.storage_path)
        metadata.status = DocumentStatus.PARSING
        logger.info(f"[1/4] Parsing {metadata.original_filename}...")
        parsed = await asyncio.to_thread(parse_document, parse_path, doc_id)

        if not parsed.full_text.strip():
            logger.warning("Parser returned empty text; using generic placeholder.")
            parsed.full_text = "[Image-only or unreadable document]"

        metadata.page_count = parsed.total_pages
        metadata.table_count = len(getattr(parsed, "tables", []) or [])
        metadata.extraction_method = getattr(parsed, "extraction_method", None)
        logger.info(
            f"Extraction: method={metadata.extraction_method} "
            f"tables={metadata.table_count} pages={metadata.page_count}"
        )

        # ── Step 2: Build tree ───────────────────────────────────────────
        logger.info(f"[2/4] Building heading tree...")
        tree = await asyncio.to_thread(build_tree, owner_id, parsed)

        # Save necessary info for outline generation, then free parsed from memory
        del parsed
        trim_memory()

        # ── Step 3: Resolve figures ──────────────────────────────────────
        logger.info(f"[3/4] Resolving figure references...")
        tree = await asyncio.to_thread(resolve_figures, tree)

        # Update metadata counts
        from app.models.tree import NodeLevel
        metadata.h1_count        = sum(1 for n in tree.nodes if n.level == NodeLevel.H1)
        metadata.h2_count        = sum(1 for n in tree.nodes if n.level == NodeLevel.H2)
        metadata.h3_count        = sum(1 for n in tree.nodes if n.level == NodeLevel.H3)
        metadata.paragraph_count = sum(1 for n in tree.nodes if n.level == NodeLevel.PARAGRAPH)
        metadata.node_count      = len(tree.nodes)
        metadata.image_count     = len(tree.images)

        # NOTE: knowledge-map generation (old Step 3.5: triplet extraction +
        # outline LLM + per-doc DB/file persistence) was removed. Maps are now
        # generated on demand per notebook via POST /api/knowledge-map/generate
        # (see app/core/knowledge_map.py), which reuses the same LLM helpers.
        trim_memory()

        # ── Step 4: Embed ────────────────────────────────────────────────
        metadata.status = DocumentStatus.EMBEDDING
        logger.info(f"[4/5] Embedding {metadata.node_count} nodes + "
                    f"{metadata.image_count} images...")
        tree = await embed_tree(tree)

        # ── Step 5: Index ────────────────────────────────────────────────
        metadata.status = DocumentStatus.INDEXING
        logger.info(f"[5/5] Indexing into Qdrant...")
        stats = await index_tree(tree)
        del tree
        trim_memory()

        # ── Done ─────────────────────────────────────────────────────────
        from datetime import datetime
        metadata.status = DocumentStatus.DONE
        metadata.ingested_at = datetime.utcnow()

        elapsed = round(time.time() - start, 1)
        logger.info(
            f"=== Ingestion complete: {metadata.original_filename} "
            f"in {elapsed}s | nodes={stats['text_points']} "
            f"images={stats['image_points']} ==="
        )

    except Exception as e:
        metadata.status = DocumentStatus.ERROR
        # str(e) can be empty for some Qdrant/OpenAI errors; use repr fallback
        err_msg = str(e).strip() or repr(e)
        metadata.error_message = err_msg[:2000]
        logger.exception(f"Ingestion failed for {metadata.original_filename}: {err_msg}")

    return metadata
