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


from typing import Optional, Callable


async def run_ingestion(
    owner_id: str,
    metadata: DocumentMetadata,
    is_cancelled: Optional[Callable[[], bool]] = None,
) -> DocumentMetadata:
    """
    Full ingestion pipeline for one document.
    Updates metadata.status at each step.
    Returns updated metadata.
    """
    start = time.time()
    doc_id = metadata.id

    logger.info(f"=== Ingestion start: {metadata.original_filename} ===")

    def _check_cancellation() -> bool:
        if is_cancelled and is_cancelled():
            logger.info(f"Ingestion cancelled for {metadata.original_filename} ({doc_id})")
            metadata.status = DocumentStatus.CANCELLED
            return True
        return False

    if _check_cancellation():
        return metadata

    try:
        # ── Step 1: Parse ────────────────────────────────────────────────
        from app.services import storage_service as store
        from app.services.db_service import db_service
        from app.config import settings
        from app.utils.memory import MemoryStageTracker, log_memory_checkpoint

        parse_path = store.ensure_local(metadata.storage_path)
        metadata.status = DocumentStatus.PARSING
        try:
            await db_service.update_document_status(doc_id, status=DocumentStatus.PARSING)
        except Exception as e:
            logger.debug(f"Failed to update db status to parsing: {e}")

        logger.info(f"[1/4] Parsing {metadata.original_filename}...")
        step1_timeout = min(float(getattr(settings, "liteparse_parse_timeout", 60.0)), 60.0)

        with MemoryStageTracker(
            "ingestion:step1_parse",
            context=metadata.original_filename,
            details={"doc_id": doc_id, "timeout_s": step1_timeout},
            profile_allocations=True,
        ) as t_step1:
            try:
                parsed = await asyncio.wait_for(
                    asyncio.to_thread(parse_document, parse_path, doc_id),
                    timeout=step1_timeout,
                )
            except asyncio.TimeoutError:
                logger.error(f"Step 1 parse exceeded {step1_timeout}s timeout for {metadata.original_filename}")
                metadata.status = DocumentStatus.ERROR
                metadata.error_message = f"Document parsing timed out (exceeded {int(step1_timeout)}s limit). Please retry with a smaller or text-based document."
                try:
                    await db_service.update_document_status(
                        doc_id, status=DocumentStatus.ERROR, error_message=metadata.error_message
                    )
                except Exception as dbe:
                    logger.debug(f"Failed to record timeout status: {dbe}")
                return metadata

            t_step1.checkpoint(
                "parse_complete",
                details={
                    "method": getattr(parsed, "extraction_method", "unknown"),
                    "pages": getattr(parsed, "total_pages", 0),
                    "headings": len(getattr(parsed, "headings", []) or []),
                    "tables": len(getattr(parsed, "tables", []) or []),
                    "images": len(getattr(parsed, "images", []) or []),
                    "text_len": len(getattr(parsed, "full_text", "") or ""),
                },
            )

        if _check_cancellation():
            return metadata

        if getattr(parsed, "ocr_timed_out", False):
            logger.warning(
                f"OCR timed out for {metadata.original_filename}; ingested from "
                f"the native text layer only (content may be incomplete)."
            )

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

        if _check_cancellation():
            del parsed
            return metadata

        # ── Step 2: Build tree ───────────────────────────────────────────
        logger.info(f"[2/4] Building heading tree...")
        with MemoryStageTracker(
            "ingestion:step2_build_tree",
            context=metadata.original_filename,
            details={
                "pages": parsed.total_pages,
                "headings": len(parsed.headings),
                "images": len(parsed.images),
            },
            profile_allocations=True,
        ) as t_step2:
            tree = await asyncio.to_thread(build_tree, owner_id, parsed)
            t_step2.checkpoint(
                "tree_built",
                details={"nodes": len(tree.nodes), "images": len(tree.images)},
            )

        del parsed
        try:
            from app.core.ingestion.liteparse_parser import shutdown as _liteparse_shutdown
            _liteparse_shutdown()
        except Exception as e:
            logger.debug(f"LiteParse worker shutdown: {e}")
        trim_memory()
        log_memory_checkpoint("step2:post_cleanup", context=metadata.original_filename)

        if _check_cancellation():
            del tree
            return metadata

        # ── Step 3: Resolve figures ──────────────────────────────────────
        logger.info(f"[3/4] Resolving figure references...")
        with MemoryStageTracker(
            "ingestion:step3_resolve_figures",
            context=metadata.original_filename,
            details={"nodes": len(tree.nodes), "images": len(tree.images)},
        ) as t_step3:
            tree = await asyncio.to_thread(resolve_figures, tree)

            # Update metadata counts
            from app.models.tree import NodeLevel
            metadata.h1_count        = sum(1 for n in tree.nodes if n.level == NodeLevel.H1)
            metadata.h2_count        = sum(1 for n in tree.nodes if n.level == NodeLevel.H2)
            metadata.h3_count        = sum(1 for n in tree.nodes if n.level == NodeLevel.H3)
            metadata.paragraph_count = sum(1 for n in tree.nodes if n.level == NodeLevel.PARAGRAPH)
            metadata.node_count      = len(tree.nodes)
            metadata.image_count     = len(tree.images)

        trim_memory()
        log_memory_checkpoint("step3:post_cleanup", context=metadata.original_filename)

        if _check_cancellation():
            del tree
            return metadata

        # ── Step 4: Embed ────────────────────────────────────────────────
        metadata.status = DocumentStatus.EMBEDDING
        try:
            await db_service.update_document_status(doc_id, status=DocumentStatus.EMBEDDING)
        except Exception as e:
            logger.debug(f"Failed to update db status to embedding: {e}")
        trim_memory()
        logger.info(f"[4/5] Embedding {metadata.node_count} nodes + "
                    f"{metadata.image_count} images...")

        with MemoryStageTracker(
            "ingestion:step4_embed_tree",
            context=metadata.original_filename,
            details={"nodes": metadata.node_count, "images": metadata.image_count},
            profile_allocations=True,
        ) as t_step4:
            tree = await embed_tree(tree)
            t_step4.checkpoint("tree_embedded")

        trim_memory()
        log_memory_checkpoint("step4:post_cleanup", context=metadata.original_filename)

        if _check_cancellation():
            del tree
            return metadata

        # ── Step 5: Index ────────────────────────────────────────────────
        metadata.status = DocumentStatus.INDEXING
        try:
            await db_service.update_document_status(doc_id, status=DocumentStatus.INDEXING)
        except Exception as e:
            logger.debug(f"Failed to update db status to indexing: {e}")
        logger.info(f"[5/5] Indexing into Qdrant...")

        with MemoryStageTracker(
            "ingestion:step5_index_tree",
            context=metadata.original_filename,
            details={"nodes": metadata.node_count, "images": metadata.image_count},
        ) as t_step5:
            stats = await index_tree(tree)
            t_step5.checkpoint("tree_indexed", details=stats)

        del tree
        trim_memory()
        log_memory_checkpoint("step5:post_cleanup", context=metadata.original_filename)

        if _check_cancellation():
            try:
                from app.services.qdrant_service import qdrant_service
                await qdrant_service.delete_by_doc(owner_id, doc_id)
            except Exception as clean_err:
                logger.warning(f"Failed to remove points after late cancellation: {clean_err}")
            return metadata

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

    except asyncio.CancelledError:
        logger.info(f"Ingestion cancelled via task cancellation for {metadata.original_filename}")
        metadata.status = DocumentStatus.CANCELLED
        try:
            from app.services.qdrant_service import qdrant_service
            await qdrant_service.delete_by_doc(owner_id, doc_id)
        except Exception:
            pass
        raise
    except Exception as e:
        metadata.status = DocumentStatus.ERROR
        err_msg = str(e).strip() or repr(e)
        metadata.error_message = err_msg[:2000]
        logger.exception(f"Ingestion failed for {metadata.original_filename}: {err_msg}")

    return metadata
