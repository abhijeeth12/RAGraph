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
from app.config import settings


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

        # ── Step 2: Build tree ───────────────────────────────────────────
        logger.info(f"[2/4] Building heading tree...")
        tree = await asyncio.to_thread(build_tree, owner_id, parsed)

        # Save necessary info for outline generation, then free parsed from memory
        parsed_title = getattr(parsed, 'title', '')
        parsed_headings_hint = [h[0] for h in getattr(parsed, 'headings', [])[:12]]
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

        # ── Step 3.5: Extract Knowledge Graph + Outline ───────────────
        logger.info(f"[3.5/5] Extracting semantic knowledge graph + outline...")

        paragraphs = [n.text for n in tree.nodes if n.level == NodeLevel.PARAGRAPH and n.text]
        full_text = "\n\n".join(paragraphs)

        # --- Triplet extraction ---
        graph_json_str: str = "[]"
        try:
            from app.core.ingestion.extractor import extract_semantic_triplets
            import json as _json
            triplets = await extract_semantic_triplets(full_text[:15000])
            graph_json_str = _json.dumps(triplets, indent=2)
            logger.info(f"Extracted {len(triplets)} semantic triplets.")
        except Exception as e:
            logger.exception(f"Semantic extraction failed, skipping: {repr(e)}")

        # --- Outline generation ---
        outline_json_str: str = ""
        try:
            from app.core.ingestion.outline import generate_outline, deterministic_outline_from_tree
            import json as _json
            llm_outline = await generate_outline(
                full_text, parsed_headings_hint,
                title=parsed_title or metadata.original_filename,
            )
            outline = llm_outline if llm_outline else await asyncio.to_thread(
                deterministic_outline_from_tree, tree
            )
            outline_json_str = _json.dumps(outline, indent=2, ensure_ascii=False)
            logger.info(f"Outline generated: {outline.get('name')} ({len(outline.get('children', []))} branches)")
        except Exception as e:
            logger.exception(f"Outline generation failed, using deterministic fallback: {repr(e)}")
            try:
                from app.core.ingestion.outline import deterministic_outline_from_tree
                import json as _json
                fallback = await asyncio.to_thread(deterministic_outline_from_tree, tree)
                outline_json_str = _json.dumps(fallback, indent=2, ensure_ascii=False)
            except Exception:
                pass

        # --- Persist to PostgreSQL (primary — survives Render restarts) ---
        try:
            from app.services.db_service import db_service
            await db_service.update_document_kg(
                doc_id=metadata.id,
                outline_json=outline_json_str if outline_json_str else None,
                graph_json=graph_json_str,
            )
            logger.info(f"Outline + graph saved to PostgreSQL for doc_id={metadata.id}")
        except Exception as e:
            logger.warning(f"Failed to persist outline/graph to DB: {repr(e)}")

        # --- Also write local files as secondary cache (best-effort, ephemeral) ---
        # Skipped for s3:// paths (Postgres is primary; S3 object is durable),
        # and skipped entirely when caching is disabled.
        try:
            if settings.cache_enabled and not store.is_s3_path(metadata.storage_path):
                if graph_json_str:
                    with open(metadata.storage_path + "_graph.json", "w", encoding="utf-8") as f:
                        f.write(graph_json_str)
                if outline_json_str:
                    with open(metadata.storage_path + "_outline.json", "w", encoding="utf-8") as f:
                        f.write(outline_json_str)
        except Exception:
            pass  # local cache is best-effort only

        # Free intermediate data before the memory-intensive embed step
        del paragraphs, full_text
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
