from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks, Depends
from fastapi.responses import PlainTextResponse
from typing import Optional, List
from loguru import logger
import uuid, os, asyncio, tempfile

from qdrant_client.models import Filter, FieldCondition, MatchValue, MatchAny
from app.config import settings
from app.models.search import UploadResponse
from app.core.auth.dependencies import get_current_user_optional
from app.services.db_service import db_service
from app.utils.memory import trim_memory

router = APIRouter(prefix="/api/documents", tags=["documents"])

ALLOWED_EXT = {"pdf", "docx", "pptx", "txt", "md"}
MAX_FILE_SIZE = 50 * 1024 * 1024
# Only allow 1 ingestion at a time to stay strictly within 512MB RAM
_ingestion_semaphore = asyncio.Semaphore(1)


async def get_owner(
    session_id: Optional[str] = None,
    current_user: Optional[dict] = Depends(get_current_user_optional)
) -> dict:
    """Returns {'user_id': str} or {'session_id': str} or raises 401"""
    if current_user and "user_id" in current_user:
        return {"user_id": current_user["user_id"], "session_id": None}
    if session_id:
        return {"user_id": None, "session_id": session_id}
    raise HTTPException(status_code=401, detail="Not authenticated or missing session")


@router.post("/upload", response_model=UploadResponse)
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    notebook_id: Optional[str] = None,
    owner: dict = Depends(get_owner)
):
    user_id = owner["user_id"]
    session_id = owner["session_id"]
    
    ext = (file.filename or "").rsplit(".", 1)[-1].lower()
    if ext not in ALLOWED_EXT:
        raise HTTPException(status_code=415, detail=f"Unsupported .{ext}. Allowed: {ALLOWED_EXT}")

    doc_id = str(uuid.uuid4())
    from app.services import storage_service as store

    # Dual-backend write: local default (Render-safe), S3 opt-in (AWS lab).
    # Persisted `storage_path` is either a local path or "s3://bucket/key".
    use_s3 = store.s3_enabled()
    if use_s3:
        s3_key, storage_path = store.s3_key_for(doc_id, ext)
    else:
        storage_path = os.path.join(settings.local_storage_path, f"{doc_id}.{ext}")
        os.makedirs(settings.local_storage_path, exist_ok=True)
    safe_filename = f"{doc_id}.{ext}"

    # Stream file to disk in 1MB chunks to prevent buffering up to 50MB in RAM
    # For S3 mode we stage to a temp file first, then upload (no RAM blowup).
    stage_path = storage_path if not use_s3 else os.path.join(
        tempfile.gettempdir(), safe_filename)
    file_size = 0
    with open(stage_path, "wb") as f:
        while True:
            chunk = await file.read(1024 * 1024)
            if not chunk:
                break
            file_size += len(chunk)
            if file_size > MAX_FILE_SIZE:
                f.close()
                if os.path.exists(stage_path):
                    os.remove(stage_path)
                raise HTTPException(status_code=413, detail="File too large. Max 50MB.")
            f.write(chunk)

    if use_s3:
        try:
            storage_path = store.upload_fileobj_to_s3(stage_path, s3_key)
        finally:
            if os.path.exists(stage_path):
                os.remove(stage_path)

    original_name = file.filename or safe_filename
    
    await db_service.create_document(
        doc_id=doc_id,
        user_id=user_id,
        session_id=session_id,
        filename=safe_filename,
        original_filename=original_name,
        mime_type=file.content_type or f"application/{ext}",
        storage_path=storage_path,
        file_size=file_size,
        notebook_id=notebook_id,
    )

    number = await db_service.get_document_count(user_id, session_id, notebook_id=notebook_id)
    logger.info(f"[Doc {number}] Uploaded to notebook={notebook_id}: {original_name} ({file_size:,} bytes)")
    
    background_tasks.add_task(_run_ingestion, doc_id, user_id, session_id)

    return UploadResponse(
        doc_id=doc_id,
        filename=original_name,
        status="queued",
        message=f"[Doc {number}] {original_name} queued for processing.",
    )


@router.get("/")
async def list_documents(notebook_id: Optional[str] = None, owner: dict = Depends(get_owner)):
    user_id = owner["user_id"]
    session_id = owner["session_id"]
    docs = await db_service.list_documents_by_owner(user_id, session_id, notebook_id=notebook_id)
    
    docs.sort(key=lambda d: d.get("created_at", ""))
    results = []
    for i, doc in enumerate(docs, 1):
        results.append({
            "doc_id": doc.get("id") or str(uuid.uuid4()),
            "notebook_id": doc.get("notebook_id"),
            "number": i,
            "filename": doc["original_filename"],
            "status": doc["status"],
            "node_count": doc.get("node_count") or 0,
            "image_count": doc.get("image_count") or 0,
            "table_count": doc.get("table_count") or 0,
            "page_count": doc.get("page_count") or 0,
            "extraction_method": doc.get("extraction_method"),
            "size_bytes": doc.get("file_size") or 0,
            "created_at": doc["created_at"].isoformat() if doc.get("created_at") else "",
        })
    return {"documents": results, "total": len(results)}


@router.get("/{doc_id}/status")
async def get_status(doc_id: str, owner: dict = Depends(get_owner)):
    user_id = owner["user_id"]
    session_id = owner["session_id"]
    valid = await db_service.verify_document_ownership(doc_id, user_id, session_id)
    if not valid:
        raise HTTPException(status_code=404, detail="Document not found")
        
    doc = await db_service.get_document(doc_id)
    num_map = await db_service.get_doc_number_map(user_id, session_id)
    number = num_map.get(doc_id, 0)

    return {
        "doc_id": doc_id,
        "number": number,
        "filename": doc["original_filename"],
        "status": doc["status"],
        "page_count": doc.get("page_count") or 0,
        "node_count": doc.get("node_count") or 0,
        "image_count": doc.get("image_count") or 0,
        "table_count": doc.get("table_count") or 0,
        "h1_count": doc.get("h1_count") or 0,
        "paragraph_count": doc.get("paragraph_count") or 0,
        "extraction_method": doc.get("extraction_method"),
        "error": doc.get("error_message"),
        "ingested_at": doc["ingested_at"].isoformat() if doc.get("ingested_at") else None,
    }


@router.delete("/{doc_id}")
async def delete_document(doc_id: str, owner: dict = Depends(get_owner)):
    user_id = owner["user_id"]
    session_id = owner["session_id"]
    
    valid = await db_service.verify_document_ownership(doc_id, user_id, session_id)
    if not valid:
        raise HTTPException(status_code=404, detail="Document not found")
        
    doc = await db_service.get_document(doc_id)
    
    from app.services.qdrant_service import qdrant_service
    qdrant_owner = user_id if user_id else session_id
    image_urls = []
    
    try:
        image_urls = await qdrant_service.get_image_urls_by_doc(qdrant_owner, doc_id)
    except Exception as e:
        logger.warning(f"Failed to fetch image URLs: {e}")
        
    try:
        await qdrant_service.delete_by_doc(qdrant_owner, doc_id)
    except Exception as e:
        logger.warning(f"Qdrant delete failed: {e}")

    # Invalidate in-memory numpy cache for this owner
    try:
        from app.core.retrieval import in_memory_store
        in_memory_store.invalidate(user_id if user_id else session_id)
    except Exception:
        pass
        
    try:
        from app.services import storage_service as store
        store.delete_storage(doc["storage_path"])
    except Exception as e:
        logger.warning(f"File delete failed: {e}")
        
    for url in image_urls:
        try:
            filename = url.split("/")[-1]
            local_img_path = os.path.join(settings.local_storage_path, "images", filename)
            if os.path.exists(local_img_path):
                os.remove(local_img_path)
        except Exception as e:
            logger.warning(f"Failed to delete image file {url}: {e}")
        
    await db_service.delete_document(doc_id)
    docs_remaining = await db_service.get_document_count(user_id, session_id)
    
    return {
        "deleted": doc_id,
        "filename": doc["original_filename"],
        "documents_remaining": docs_remaining,
    }


@router.delete("/session/{target_session_id}/cleanup")
async def cleanup_session(target_session_id: str):
    docs = await db_service.list_documents_by_session(target_session_id)
    deleted_files = 0
    deleted_vectors = False
    
    from app.services.qdrant_service import qdrant_service
    image_urls = []
    try:
        image_urls = await qdrant_service.get_image_urls_by_owner(target_session_id)
    except Exception as e:
        logger.warning(f"Failed to fetch image URLs for session {target_session_id}: {e}")
        
    try:
        await qdrant_service.delete_by_owner(target_session_id)
        deleted_vectors = True
    except Exception as e:
        logger.warning(f"Qdrant cleanup failed: {e}")

    # Invalidate in-memory cache
    try:
        from app.core.retrieval import in_memory_store
        in_memory_store.invalidate(target_session_id)
    except Exception:
        pass
        
    for doc in docs:
        try:
            if os.path.exists(doc["storage_path"]):
                os.remove(doc["storage_path"])
                deleted_files += 1
        except Exception as e:
            logger.warning(f"File cleanup failed: {e}")
            
    for url in image_urls:
        try:
            filename = url.split("/")[-1]
            local_img_path = os.path.join(settings.local_storage_path, "images", filename)
            if os.path.exists(local_img_path):
                os.remove(local_img_path)
                deleted_files += 1
        except Exception as e:
            logger.warning(f"Failed to delete session image file {url}: {e}")
            
    try:
        from app.services.redis_service import redis_service
        await redis_service.clear_owner_cache(target_session_id)
    except Exception:
        pass
        
    await db_service.delete_session_documents(target_session_id)
    
    return {
        "cleaned": True,
        "owner_id": target_session_id,
        "files_deleted": deleted_files,
        "vectors_deleted": deleted_vectors,
    }


@router.get("/{doc_id}/content")
async def get_document_content(doc_id: str, owner: dict = Depends(get_owner)):
    user_id = owner["user_id"]
    session_id = owner["session_id"]
    
    valid = await db_service.verify_document_ownership(doc_id, user_id, session_id)
    if not valid:
        raise HTTPException(status_code=404, detail="Document not found")
        
    doc = await db_service.get_document(doc_id)
    from app.services import storage_service as store
    try:
        local_path = store.ensure_local(doc["storage_path"])
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"File not available: {e}")
    if not os.path.exists(local_path):
        raise HTTPException(status_code=404, detail="File not found on disk")
        
    ext = doc["filename"].rsplit(".", 1)[-1].lower()
    try:
        if ext in ("txt", "md"):
            with open(local_path, "r", encoding="utf-8", errors="replace") as f:
                return PlainTextResponse(f.read())
        elif ext == "pdf":
            import fitz
            pdf = fitz.open(local_path)
            pages = []
            for i, page in enumerate(pdf):
                text = page.get_text()
                if text.strip():
                    pages.append(f"--- Page {i+1} ---\n{text}")
            pdf.close()
            return PlainTextResponse("\n\n".join(pages[:20]))
        elif ext == "docx":
            from docx import Document
            docx = Document(local_path)
            text = "\n".join(p.text for p in docx.paragraphs if p.text.strip())
            return PlainTextResponse(text)
        else:
            return PlainTextResponse(f"Preview not available for .{ext} files")
    except Exception as e:
        return PlainTextResponse(f"Could not read file: {e}")

@router.get("/outline")
async def get_document_outline(
    doc_ids: Optional[str] = None,
    owner: dict = Depends(get_owner),
):
    """Returns hierarchical outline (mind map) for NotebookLM-style map.
    
    Read order:
      1. PostgreSQL outline_json column (primary — survives Render restarts)
      2. Local _outline.json file (secondary cache, ephemeral)
      3. Deterministic fallback from tree (only if document file still exists locally)
    Never triggers a full parse+embed cycle on an API request path.
    """
    import json
    user_id = owner["user_id"]
    session_id = owner["session_id"]
    docs_db = await db_service.list_documents_by_owner(user_id, session_id)
    valid_docs = {d["id"]: d for d in docs_db}
    docs_to_process = []
    if doc_ids:
        for d_id in doc_ids.split(","):
            d_id = d_id.strip()
            if d_id in valid_docs:
                docs_to_process.append(valid_docs[d_id])
    else:
        docs_to_process = list(valid_docs.values())

    outlines = []
    for doc in docs_to_process:
        data = None

        # --- Source 1: PostgreSQL (primary, restart-durable) ---
        try:
            outline_raw = await db_service.get_document_outline_data(doc["id"])
            if outline_raw:
                data = json.loads(outline_raw)
        except Exception as e:
            logger.debug(f"DB outline read failed for {doc['id']}: {e}")

        # --- Source 2: Local file cache (secondary, ephemeral) ---
        # Skipped entirely when caching is disabled (Postgres stays primary).
        if data is None and settings.cache_enabled:
            outline_path = doc["storage_path"] + "_outline.json"
            if os.path.exists(outline_path):
                try:
                    with open(outline_path, "r", encoding="utf-8") as f:
                        data = json.load(f)
                    logger.debug(f"Outline loaded from local file cache for {doc['id']}")
                except Exception as e:
                    logger.debug(f"Local outline file read failed: {e}")

        # --- Source 3: Light deterministic fallback (no parse, no LLM, no embed) ---
        # Only attempt if the document file still exists locally (not wiped by restart)
        if data is None and os.path.exists(doc.get("storage_path", "")):
            try:
                from app.core.ingestion.parser import parse_document
                from app.core.ingestion.tree_builder import build_tree
                from app.core.ingestion.outline import deterministic_outline_from_tree
                from app.services import storage_service as store
                owner_id = user_id if user_id else session_id
                parse_path = store.ensure_local(doc["storage_path"])
                parsed = await asyncio.to_thread(parse_document, parse_path, doc["id"])
                tree = await asyncio.to_thread(build_tree, owner_id, parsed)
                data = await asyncio.to_thread(deterministic_outline_from_tree, tree)
                del parsed, tree
                from app.utils.memory import trim_memory
                trim_memory()
                # Persist to DB so future requests avoid the re-parse
                try:
                    await db_service.update_document_kg(
                        doc_id=doc["id"],
                        outline_json=json.dumps(data, ensure_ascii=False),
                    )
                except Exception:
                    pass
                logger.info(f"Deterministic outline generated on-demand for {doc['id']}")
            except Exception as e:
                logger.warning(f"Deterministic outline fallback failed for {doc['original_filename']}: {e}")

        if data is not None:
            # Dedupe/clean outline
            try:
                from app.core.ingestion.outline import _dedupe_outline
                data = _dedupe_outline(data)
            except Exception:
                pass
            outlines.append({"doc_id": doc["id"], "filename": doc["original_filename"], "outline": data})
        else:
            logger.info(f"No outline available for {doc['original_filename']} (ingestion pending or file lost)")

    if not outlines:
        return {"outline": {"name": "Knowledge Base", "children": []}, "count": 0}
    if len(outlines) == 1:
        return {"outline": outlines[0]["outline"], "count": 1, "filename": outlines[0]["filename"]}
    # Multi-doc: merge under Knowledge Base root.
    # No document-name wrapper nodes: the LLM already references documents where
    # relevant, so filename/outline-title wrappers would only duplicate the first
    # expansion with redundant branches. Merge every outline's concept children
    # directly (deduplicated), preserving order across documents.
    merged = {"name": "Knowledge Base", "children": []}
    seen: set = set()
    for o in outlines:
        branches = o["outline"].get("children", []) or []
        if not branches:
            # Childless outline: its root name is the only signal — keep it.
            root_name = (o["outline"].get("name") or "").strip()
            if root_name:
                branches = [{"name": root_name}]
        for b in branches:
            key = str(b.get("name", "")).strip().lower()
            if not key or key in seen:
                continue
            seen.add(key)
            merged["children"].append(b)
    return {"outline": merged, "count": len(outlines)}


@router.get("/graph")
async def get_document_graph(
    doc_ids: Optional[str] = None,
    owner: dict = Depends(get_owner)
):
    """
    Returns the semantic knowledge graph of the specified documents.
    
    Read order:
      1. PostgreSQL graph_json column (primary — survives Render restarts)
      2. Local _graph.json file (secondary cache, ephemeral)
    """
    import json
    user_id = owner["user_id"]
    session_id = owner["session_id"]

    docs_db = await db_service.list_documents_by_owner(user_id, session_id)
    valid_docs = {d["id"]: d for d in docs_db}

    docs_to_process = []
    if doc_ids:
        for d_id in doc_ids.split(","):
            d_id = d_id.strip()
            if d_id in valid_docs:
                docs_to_process.append(valid_docs[d_id])
    else:
        docs_to_process = list(valid_docs.values())

    nodes: list = []
    links: list = []
    nodes.append({"id": "root", "name": "Knowledge Base", "group": "root", "val": 20})
    node_ids: set = {"root"}

    for doc in docs_to_process:
        doc_id = doc["id"]

        # Add document root node
        if doc_id not in node_ids:
            nodes.append({
                "id": doc_id,
                "name": doc["original_filename"],
                "group": "document",
                "val": 15
            })
            links.append({"source": "root", "target": doc_id, "label": "contains"})
            node_ids.add(doc_id)

        triplets = None

        # --- Source 1: PostgreSQL (primary) ---
        try:
            graph_raw = await db_service.get_document_graph_data(doc_id)
            if graph_raw:
                triplets = json.loads(graph_raw)
        except Exception as e:
            logger.debug(f"DB graph read failed for {doc_id}: {e}")

        # --- Source 2: Local file cache (secondary) ---
        # Skipped entirely when caching is disabled (Postgres stays primary).
        if triplets is None and settings.cache_enabled:
            graph_path = doc["storage_path"] + "_graph.json"
            if os.path.exists(graph_path):
                try:
                    with open(graph_path, "r", encoding="utf-8") as f:
                        triplets = json.load(f)
                except Exception as e:
                    logger.debug(f"Local graph file read failed: {e}")

        if not triplets:
            continue

        for t in triplets:
            src = t.get("source")
            tgt = t.get("target")
            label = t.get("label", "")
            src_type = t.get("source_type", "Concept")
            tgt_type = t.get("target_type", "Concept")
            if not src or not tgt:
                continue
            src_id = f"entity_{src.lower()}"
            tgt_id = f"entity_{tgt.lower()}"
            if src_id not in node_ids:
                nodes.append({"id": src_id, "name": src, "group": src_type.lower(), "val": 8})
                node_ids.add(src_id)
                links.append({"source": doc_id, "target": src_id, "label": "mentions"})
            if tgt_id not in node_ids:
                nodes.append({"id": tgt_id, "name": tgt, "group": tgt_type.lower(), "val": 8})
                node_ids.add(tgt_id)
                links.append({"source": doc_id, "target": tgt_id, "label": "mentions"})
            links.append({"source": src_id, "target": tgt_id, "label": label})

    # Filter out invalid links to prevent frontend crashes
    valid_node_ids = {n["id"] for n in nodes}
    valid_links = [lnk for lnk in links if lnk["source"] in valid_node_ids and lnk["target"] in valid_node_ids]
    return {"nodes": nodes, "links": valid_links}


async def _run_ingestion(doc_id: str, user_id: Optional[str], session_id: Optional[str]) -> None:
    from app.core.ingestion.pipeline import run_ingestion
    from app.models.documents import DocumentMetadata
    
    await asyncio.sleep(0.5)
    
    doc = await db_service.get_document(doc_id)
    if not doc:
        return
        
    qdrant_owner = user_id if user_id else session_id
    
    metadata = DocumentMetadata(
        id=doc["id"],
        owner_id=qdrant_owner,
        filename=doc["filename"],
        original_filename=doc["original_filename"],
        mime_type=doc["mime_type"],
        storage_path=doc["storage_path"],
        notebook_id=doc.get("notebook_id"),
    )
    
    async with _ingestion_semaphore:
        try:
            logger.info(f"Acquired ingestion slot for {metadata.original_filename}")
            updated_meta = await run_ingestion(qdrant_owner, metadata)
            if updated_meta:
                await db_service.update_document_status(
                    doc_id=doc_id,
                    status=updated_meta.status,
                    error_message=updated_meta.error_message,
                    page_count=updated_meta.page_count,
                    node_count=updated_meta.node_count,
                    image_count=updated_meta.image_count,
                    table_count=updated_meta.table_count,
                    h1_count=updated_meta.h1_count,
                    h2_count=updated_meta.h2_count,
                    h3_count=updated_meta.h3_count,
                    paragraph_count=updated_meta.paragraph_count,
                    extraction_method=updated_meta.extraction_method,
                )
        except Exception as e:
            err = str(e).strip() or repr(e)
            logger.exception(f"Ingestion crashed for {metadata.original_filename}: {err}")
            try:
                await db_service.update_document_status(doc_id, "failed", error_message=err[:2000])
            except Exception as db_e:
                logger.exception(f"Failed to update document status after crash: {repr(db_e)}")
        finally:
            trim_memory()