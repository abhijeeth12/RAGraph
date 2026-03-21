"""
Ingestion Pipeline — orchestrates all Phase 2 steps.

parse → build_tree → resolve_figures → embed → index

Called by the document upload background task.
"""
from __future__ import annotations
import time
from loguru import logger

from app.core.ingestion.parser import parse_document
from app.core.ingestion.tree_builder import build_tree
from app.core.ingestion.figure_resolver import resolve_figures
from app.core.ingestion.embedder import embed_tree
from app.core.ingestion.indexer import index_tree
from app.models.documents import DocumentMetadata, DocumentStatus


async def run_ingestion(metadata: DocumentMetadata) -> DocumentMetadata:
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
        metadata.status = DocumentStatus.PARSING
        logger.info(f"[1/4] Parsing {metadata.original_filename}...")
        parsed = parse_document(metadata.storage_path, doc_id)

        if not parsed.full_text.strip():
            raise ValueError("Parser returned empty text")

        metadata.page_count = parsed.total_pages

        # ── Step 2: Build tree ───────────────────────────────────────────
        logger.info(f"[2/4] Building heading tree...")
        tree = build_tree(parsed)

        # ── Step 3: Resolve figures ──────────────────────────────────────
        logger.info(f"[3/4] Resolving figure references...")
        tree = resolve_figures(tree)

        # Update metadata counts
        from app.models.tree import NodeLevel
        metadata.h1_count     = sum(1 for n in tree.nodes if n.level == NodeLevel.H1)
        metadata.h2_count     = sum(1 for n in tree.nodes if n.level == NodeLevel.H2)
        metadata.h3_count     = sum(1 for n in tree.nodes if n.level == NodeLevel.H3)
        metadata.paragraph_count = sum(1 for n in tree.nodes if n.level == NodeLevel.PARAGRAPH)
        metadata.node_count   = len(tree.nodes)
        metadata.image_count  = len(tree.images)

        # ── Step 4: Embed ────────────────────────────────────────────────
        metadata.status = DocumentStatus.EMBEDDING
        logger.info(f"[4/5] Embedding {metadata.node_count} nodes + "
                    f"{metadata.image_count} images...")
        tree = await embed_tree(tree)

        # ── Step 5: Index ────────────────────────────────────────────────
        metadata.status = DocumentStatus.INDEXING
        logger.info(f"[5/5] Indexing into Qdrant...")
        stats = await index_tree(tree)

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
        metadata.error_message = str(e)
        logger.error(f"Ingestion failed for {metadata.original_filename}: {e}")

    return metadata
