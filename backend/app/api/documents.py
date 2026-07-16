from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks, Depends
from fastapi.responses import PlainTextResponse
from typing import Optional, List
from loguru import logger
import uuid, os, asyncio

from qdrant_client.models import Filter, FieldCondition, MatchValue, MatchAny
from app.config import settings
from app.models.search import UploadResponse
from app.core.auth.dependencies import get_current_user_optional
from app.services.db_service import db_service

router = APIRouter(prefix="/api/documents", tags=["documents"])

ALLOWED_EXT = {"pdf", "docx", "pptx", "txt", "md"}
MAX_FILE_SIZE = 50 * 1024 * 1024


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
    owner: dict = Depends(get_owner)
):
    user_id = owner["user_id"]
    session_id = owner["session_id"]
    
    ext = (file.filename or "").rsplit(".", 1)[-1].lower()
    if ext not in ALLOWED_EXT:
        raise HTTPException(status_code=415, detail=f"Unsupported .{ext}. Allowed: {ALLOWED_EXT}")

    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail=f"File too large. Max 50MB.")

    doc_id = str(uuid.uuid4())
    safe_filename = f"{doc_id}.{ext}"
    storage_path = os.path.join(settings.local_storage_path, safe_filename)
    os.makedirs(settings.local_storage_path, exist_ok=True)

    with open(storage_path, "wb") as f:
        f.write(content)

    original_name = file.filename or safe_filename
    
    await db_service.create_document(
        doc_id=doc_id,
        user_id=user_id,
        session_id=session_id,
        filename=safe_filename,
        original_filename=original_name,
        mime_type=file.content_type or f"application/{ext}",
        storage_path=storage_path,
        file_size=len(content)
    )

    number = await db_service.get_document_count(user_id, session_id)
    logger.info(f"[Doc {number}] Uploaded: {original_name} ({len(content):,} bytes)")
    
    background_tasks.add_task(_run_ingestion, doc_id, user_id, session_id)

    return UploadResponse(
        doc_id=doc_id,
        filename=original_name,
        status="queued",
        message=f"[Doc {number}] {original_name} queued for processing.",
    )


@router.get("/")
async def list_documents(owner: dict = Depends(get_owner)):
    user_id = owner["user_id"]
    session_id = owner["session_id"]
    docs = await db_service.list_documents_by_owner(user_id, session_id)
    
    docs.sort(key=lambda d: d.get("created_at", ""))
    results = []
    for i, doc in enumerate(docs, 1):
        results.append({
            "doc_id": doc.get("id") or str(uuid.uuid4()),  # ✅ FIX
            "number": i,
            "filename": doc["original_filename"],
            "status": doc["status"],
            "node_count": doc.get("node_count") or 0,
            "image_count": doc.get("image_count") or 0,
            "page_count": doc.get("page_count") or 0,
            "size_bytes": doc.get("file_size") or 0,
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
        "h1_count": doc.get("h1_count") or 0,
        "paragraph_count": doc.get("paragraph_count") or 0,
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
        if os.path.exists(doc["storage_path"]):
            os.remove(doc["storage_path"])
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
    if not os.path.exists(doc["storage_path"]):
        raise HTTPException(status_code=404, detail="File not found on disk")
        
    ext = doc["filename"].rsplit(".", 1)[-1].lower()
    try:
        if ext in ("txt", "md"):
            with open(doc["storage_path"], "r", encoding="utf-8", errors="replace") as f:
                return PlainTextResponse(f.read())
        elif ext == "pdf":
            import fitz
            pdf = fitz.open(doc["storage_path"])
            pages = []
            for i, page in enumerate(pdf):
                text = page.get_text()
                if text.strip():
                    pages.append(f"--- Page {i+1} ---\n{text}")
            pdf.close()
            return PlainTextResponse("\n\n".join(pages[:20]))
        elif ext == "docx":
            from docx import Document
            docx = Document(doc["storage_path"])
            text = "\n".join(p.text for p in docx.paragraphs if p.text.strip())
            return PlainTextResponse(text)
        else:
            return PlainTextResponse(f"Preview not available for .{ext} files")
    except Exception as e:
        return PlainTextResponse(f"Could not read file: {e}")

@router.get("/graph")
async def get_document_graph(
    doc_ids: Optional[str] = None, 
    owner: dict = Depends(get_owner)
):
    """
    Returns the semantic knowledge graph of the specified documents.
    Reads from local [doc_id]_graph.json files.
    """
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
        
    nodes = []
    links = []
    
    import json
    
    nodes.append({
        "id": "root",
        "name": "Knowledge Base",
        "group": "root",
        "val": 20
    })
    
    node_ids = set(["root"])
    
    for doc in docs_to_process:
        graph_path = doc["storage_path"] + "_graph.json"
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
        
        if os.path.exists(graph_path):
            try:
                with open(graph_path, "r", encoding="utf-8") as f:
                    triplets = json.load(f)
                    
                for t in triplets:
                    src = t.get("source")
                    tgt = t.get("target")
                    label = t.get("label", "")
                    src_type = t.get("source_type", "Concept")
                    tgt_type = t.get("target_type", "Concept")
                    
                    if not src or not tgt: continue
                    
                    # Ensure global uniqueness of entity names per knowledge base
                    # or per document depending on the desired scoping. 
                    # We will scope them globally by name to allow cross-document linking!
                    src_id = f"entity_{src.lower()}"
                    tgt_id = f"entity_{tgt.lower()}"
                    
                    if src_id not in node_ids:
                        nodes.append({
                            "id": src_id,
                            "name": src,
                            "group": src_type.lower(),
                            "val": 8
                        })
                        node_ids.add(src_id)
                        # Link entity back to document so it belongs to the file visually
                        links.append({"source": doc_id, "target": src_id, "label": "mentions"})
                        
                    if tgt_id not in node_ids:
                        nodes.append({
                            "id": tgt_id,
                            "name": tgt,
                            "group": tgt_type.lower(),
                            "val": 8
                        })
                        node_ids.add(tgt_id)
                        # Link entity back to document
                        links.append({"source": doc_id, "target": tgt_id, "label": "mentions"})
                        
                    links.append({
                        "source": src_id,
                        "target": tgt_id,
                        "label": label
                    })
            except Exception as e:
                logger.warning(f"Could not read graph for {doc['original_filename']}: {e}")
                
    # Filter out invalid links to prevent frontend crashes
    valid_node_ids = {n["id"] for n in nodes}
    valid_links = [l for l in links if l["source"] in valid_node_ids and l["target"] in valid_node_ids]
    
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
        storage_path=doc["storage_path"]
    )
    
    try:
        updated_meta = await run_ingestion(qdrant_owner, metadata)
        if updated_meta:
            await db_service.update_document_status(
                doc_id=doc_id,
                status=updated_meta.status,
                error_message=updated_meta.error_message,
                page_count=updated_meta.page_count,
                node_count=updated_meta.node_count,
                image_count=updated_meta.image_count,
                h1_count=updated_meta.h1_count,
                h2_count=updated_meta.h2_count,
                h3_count=updated_meta.h3_count,
                paragraph_count=updated_meta.paragraph_count
            )
    except Exception as e:
        logger.error(f"Ingestion crashed: {e}")
        await db_service.update_document_status(doc_id, "failed", error_message=str(e))