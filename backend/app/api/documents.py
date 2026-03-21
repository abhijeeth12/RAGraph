from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse
from loguru import logger
import uuid
import os
from app.config import settings
from app.models.search import UploadResponse
from app.models.documents import DocumentMetadata, DocumentStatus

router = APIRouter(prefix="/api/documents", tags=["documents"])

ALLOWED_EXT = {"pdf", "docx", "pptx", "txt", "md"}
MAX_FILE_SIZE = 50 * 1024 * 1024

# In-memory status store (Phase 5: replace with MongoDB)
_doc_status: dict[str, DocumentMetadata] = {}


@router.post("/upload", response_model=UploadResponse)
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
):
    ext = (file.filename or "").rsplit(".", 1)[-1].lower()
    if ext not in ALLOWED_EXT:
        raise HTTPException(status_code=415,
            detail=f"Unsupported type .{ext}. Allowed: {ALLOWED_EXT}")

    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413,
            detail=f"File too large ({len(content)/1024/1024:.1f} MB). Max 50 MB.")

    doc_id = str(uuid.uuid4())
    safe_filename = f"{doc_id}.{ext}"
    storage_path = os.path.join(settings.local_storage_path, safe_filename)
    os.makedirs(settings.local_storage_path, exist_ok=True)

    with open(storage_path, "wb") as f:
        f.write(content)

    logger.info(f"Saved: {file.filename} -> {storage_path} ({len(content):,} bytes)")

    metadata = DocumentMetadata(
        id=doc_id,
        filename=safe_filename,
        original_filename=file.filename or safe_filename,
        mime_type=file.content_type or f"application/{ext}",
        storage_path=storage_path,
        status=DocumentStatus.QUEUED,
    )
    _doc_status[doc_id] = metadata

    # Queue real ingestion pipeline
    background_tasks.add_task(_run_ingestion, metadata)

    return UploadResponse(
        doc_id=doc_id,
        filename=file.filename or safe_filename,
        status="queued",
        message=f"Ingestion started. Poll /api/documents/{doc_id}/status to track progress.",
    )


@router.get("/{doc_id}/status")
async def get_status(doc_id: str):
    """Poll ingestion status for a document."""
    meta = _doc_status.get(doc_id)
    if not meta:
        raise HTTPException(status_code=404, detail="Document not found")
    return {
        "doc_id": doc_id,
        "status": meta.status,
        "filename": meta.original_filename,
        "page_count": meta.page_count,
        "node_count": meta.node_count,
        "image_count": meta.image_count,
        "h1_count": meta.h1_count,
        "h2_count": meta.h2_count,
        "paragraph_count": meta.paragraph_count,
        "error": meta.error_message,
        "ingested_at": meta.ingested_at.isoformat() if meta.ingested_at else None,
    }


@router.get("/")
async def list_documents():
    """List all documents and their ingestion status."""
    return {
        "documents": [
            {
                "doc_id": doc_id,
                "filename": meta.original_filename,
                "status": meta.status,
                "node_count": meta.node_count,
                "image_count": meta.image_count,
            }
            for doc_id, meta in _doc_status.items()
        ]
    }


async def _run_ingestion(metadata: DocumentMetadata) -> None:
    from app.core.ingestion.pipeline import run_ingestion
    updated = await run_ingestion(metadata)
    _doc_status[metadata.id] = updated
