from fastapi import APIRouter, HTTPException, Depends, Cookie, Header
from typing import Optional, List
from loguru import logger
import uuid, os

from app.services.db_service import db_service, NotebookConflictError, NotebookNotFoundError
from app.core.auth.dependencies import get_current_user_optional, get_session_from_cookie
from app.models.notebook import NotebookCreate, NotebookUpdate, NotebookResponse
from app.config import settings

router = APIRouter(prefix="/api/notebooks", tags=["notebooks"])


async def get_owner(
    session_id: Optional[str] = None,
    header_session_id: Optional[str] = Header(None, alias="X-Session-ID"),
    current_user: Optional[dict] = Depends(get_current_user_optional),
    session: Optional[dict] = Depends(get_session_from_cookie),
    cookie_session_id: Optional[str] = Cookie(None, alias="session_id"),
    ragraph_session: Optional[str] = Cookie(None, alias="ragraph_session"),
) -> dict:
    if current_user and "user_id" in current_user:
        return {"user_id": current_user["user_id"], "session_id": None}
    if session and "id" in session:
        return {"user_id": None, "session_id": session["id"]}
    if header_session_id and header_session_id.strip():
        return {"user_id": None, "session_id": header_session_id.strip()}
    if session_id and session_id.strip():
        return {"user_id": None, "session_id": session_id.strip()}
    if cookie_session_id and cookie_session_id.strip():
        return {"user_id": None, "session_id": cookie_session_id.strip()}
    if ragraph_session and ragraph_session.strip():
        return {"user_id": None, "session_id": ragraph_session.strip()}
    raise HTTPException(
        status_code=401,
        detail="Authentication required to access notebooks",
        headers={"WWW-Authenticate": "Bearer"},
    )


@router.get("/", response_model=List[NotebookResponse])
async def list_notebooks(owner: dict = Depends(get_owner)):
    user_id = owner["user_id"]
    session_id = owner["session_id"]
    nbs = await db_service.list_notebooks(user_id, session_id)
    results = []
    for nb in nbs:
        results.append(
            NotebookResponse(
                id=nb["id"],
                user_id=nb.get("user_id"),
                session_id=nb.get("session_id"),
                title=nb["title"],
                description=nb.get("description"),
                model=nb.get("model") or "openrouter/free",
                focus=nb.get("focus") or "all",
                document_count=nb.get("document_count") or 0,
                conversation_count=nb.get("conversation_count") or 0,
                created_at=nb["created_at"].isoformat() if nb.get("created_at") else "",
                updated_at=nb["updated_at"].isoformat() if nb.get("updated_at") else "",
            )
        )
    return results


@router.post("/", response_model=NotebookResponse)
async def create_notebook(data: NotebookCreate, owner: dict = Depends(get_owner)):
    user_id = owner["user_id"]
    session_id = owner["session_id"]
    nb_id = data.id or f"nb_{uuid.uuid4().hex[:8]}"

    try:
        nb = await db_service.create_notebook(
            notebook_id=nb_id,
            user_id=user_id,
            session_id=session_id,
            title=data.title.strip() or "Untitled Notebook",
            description=data.description.strip() if data.description else None,
            model=data.model or "openrouter/free",
            focus=data.focus or "all",
        )
    except NotebookConflictError:
        raise HTTPException(
            status_code=409,
            detail=f"Notebook id '{nb_id}' is already in use by another owner",
        )
    except NotebookNotFoundError:
        raise HTTPException(status_code=409, detail=f"Notebook '{nb_id}' could not be created")
    if not nb:
        raise HTTPException(status_code=500, detail="Failed to create notebook")

    return NotebookResponse(
        id=nb["id"],
        user_id=nb.get("user_id"),
        session_id=nb.get("session_id"),
        title=nb["title"],
        description=nb.get("description"),
        model=nb.get("model") or "openrouter/free",
        focus=nb.get("focus") or "all",
        document_count=0,
        conversation_count=0,
        created_at=nb["created_at"].isoformat() if nb.get("created_at") else "",
        updated_at=nb["updated_at"].isoformat() if nb.get("updated_at") else "",
    )


@router.get("/{notebook_id}", response_model=NotebookResponse)
async def get_notebook(notebook_id: str, owner: dict = Depends(get_owner)):
    user_id = owner["user_id"]
    session_id = owner["session_id"]
    valid = await db_service.verify_notebook_ownership(notebook_id, user_id, session_id)
    if not valid:
        raise HTTPException(status_code=404, detail="Notebook not found")

    nb = await db_service.get_notebook(notebook_id)
    return NotebookResponse(
        id=nb["id"],
        user_id=nb.get("user_id"),
        session_id=nb.get("session_id"),
        title=nb["title"],
        description=nb.get("description"),
        model=nb.get("model") or "openrouter/free",
        focus=nb.get("focus") or "all",
        document_count=nb.get("document_count") or 0,
        conversation_count=nb.get("conversation_count") or 0,
        created_at=nb["created_at"].isoformat() if nb.get("created_at") else "",
        updated_at=nb["updated_at"].isoformat() if nb.get("updated_at") else "",
    )


@router.patch("/{notebook_id}", response_model=NotebookResponse)
async def update_notebook(notebook_id: str, data: NotebookUpdate, owner: dict = Depends(get_owner)):
    user_id = owner["user_id"]
    session_id = owner["session_id"]
    valid = await db_service.verify_notebook_ownership(notebook_id, user_id, session_id)
    if not valid:
        raise HTTPException(status_code=404, detail="Notebook not found")

    updates = {}
    if data.title is not None:
        updates["title"] = data.title.strip() or "Untitled Notebook"
    if data.description is not None:
        updates["description"] = data.description.strip()
    if data.model is not None:
        updates["model"] = data.model
    if data.focus is not None:
        updates["focus"] = data.focus

    nb = await db_service.update_notebook(notebook_id, **updates)
    return NotebookResponse(
        id=nb["id"],
        user_id=nb.get("user_id"),
        session_id=nb.get("session_id"),
        title=nb["title"],
        description=nb.get("description"),
        model=nb.get("model") or "openrouter/free",
        focus=nb.get("focus") or "all",
        document_count=nb.get("document_count") or 0,
        conversation_count=nb.get("conversation_count") or 0,
        created_at=nb["created_at"].isoformat() if nb.get("created_at") else "",
        updated_at=nb["updated_at"].isoformat() if nb.get("updated_at") else "",
    )


@router.delete("/{notebook_id}")
async def delete_notebook(notebook_id: str, owner: dict = Depends(get_owner)):
    user_id = owner["user_id"]
    session_id = owner["session_id"]
    valid = await db_service.verify_notebook_ownership(notebook_id, user_id, session_id)
    if not valid:
        raise HTTPException(status_code=404, detail="Notebook not found")

    # Clean up associated documents (disk storage, Qdrant vectors)
    docs = await db_service.list_documents_by_notebook(notebook_id)
    from app.services.qdrant_service import qdrant_service
    from app.services import storage_service as store
    qdrant_owner = user_id if user_id else session_id

    for doc in docs:
        doc_id = doc["id"]
        try:
            image_urls = await qdrant_service.get_image_urls_by_doc(qdrant_owner, doc_id)
            for url in image_urls:
                filename = url.split("/")[-1]
                local_img = os.path.join(settings.local_storage_path, "images", filename)
                if os.path.exists(local_img):
                    os.remove(local_img)
        except Exception as e:
            logger.warning(f"Error deleting images for doc {doc_id}: {e}")

        try:
            await qdrant_service.delete_by_doc(qdrant_owner, doc_id)
        except Exception as e:
            logger.warning(f"Error deleting Qdrant vectors for doc {doc_id}: {e}")

        try:
            store.delete_storage(doc["storage_path"])
        except Exception as e:
            logger.warning(f"Error deleting storage file for doc {doc_id}: {e}")

    # Invalidate in-memory cache
    try:
        from app.core.retrieval import in_memory_store
        in_memory_store.invalidate(qdrant_owner)
    except Exception:
        pass

    # Database cascade deletion handles deleting documents, conversations, and messages
    await db_service.delete_notebook(notebook_id)
    return {"deleted": notebook_id, "success": True}


@router.get("/{notebook_id}/documents")
async def list_notebook_documents(notebook_id: str, owner: dict = Depends(get_owner)):
    user_id = owner["user_id"]
    session_id = owner["session_id"]
    valid = await db_service.verify_notebook_ownership(notebook_id, user_id, session_id)
    if not valid:
        raise HTTPException(status_code=404, detail="Notebook not found")

    docs = await db_service.list_documents_by_notebook(notebook_id)
    docs.sort(key=lambda d: d.get("created_at", ""))
    results = []
    for i, doc in enumerate(docs, 1):
        results.append({
            "doc_id": doc.get("id"),
            "notebook_id": doc.get("notebook_id"),
            "number": i,
            "filename": doc["original_filename"],
            "status": doc["status"],
            "node_count": doc.get("node_count") or 0,
            "image_count": doc.get("image_count") or 0,
            "page_count": doc.get("page_count") or 0,
            "size_bytes": doc.get("file_size") or 0,
            "created_at": doc["created_at"].isoformat() if doc.get("created_at") else "",
        })
    return {"documents": results, "total": len(results)}


@router.get("/{notebook_id}/conversations")
async def list_notebook_conversations(notebook_id: str, owner: dict = Depends(get_owner)):
    user_id = owner["user_id"]
    session_id = owner["session_id"]
    valid = await db_service.verify_notebook_ownership(notebook_id, user_id, session_id)
    if not valid:
        raise HTTPException(status_code=404, detail="Notebook not found")

    convos = await db_service.list_conversations_by_notebook(notebook_id)
    return convos
