from fastapi import APIRouter, HTTPException, Depends, Cookie, Header
from typing import Optional, List, Dict, Any
from app.services.db_service import db_service, NotebookNotFoundError, ConversationConflictError
from app.core.auth.dependencies import get_current_user_optional, get_session_from_cookie
from app.config import settings
from pydantic import BaseModel
import uuid
import json

router = APIRouter(prefix="/api/conversations", tags=["conversations"])


class ConversationCreate(BaseModel):
    id: Optional[str] = None
    notebook_id: Optional[str] = None
    title: str = "New Conversation"
    model: str = "openrouter/free"
    focus: str = "all"


class MessageCreate(BaseModel):
    role: str
    content: str
    sources: Optional[List[Dict[str, Any]]] = None
    images: Optional[List[Dict[str, Any]]] = None
    citation_map: Optional[Dict[str, Any]] = None
    related_questions: Optional[List[str]] = None
    meta: Optional[Dict[str, Any]] = None


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
        detail="Authentication required to access conversations",
        headers={"WWW-Authenticate": "Bearer"},
    )


def _verify_conv_access(c: dict, owner: dict) -> bool:
    if not c:
        return False
    user_id = owner["user_id"]
    session_id = owner["session_id"]
    if user_id and c.get("user_id") == user_id:
        return True
    if session_id and c.get("session_id") == session_id:
        return True
    return False


@router.get("/")
async def list_conversations(notebook_id: Optional[str] = None, owner: dict = Depends(get_owner)):
    user_id = owner["user_id"]
    session_id = owner["session_id"]
    convos = await db_service.list_conversations_by_owner(user_id, session_id, notebook_id=notebook_id)
    return convos


@router.post("/")
async def create_conversation(data: ConversationCreate, owner: dict = Depends(get_owner)):
    user_id = owner["user_id"]
    session_id = owner["session_id"]

    # Validate notebook reference before insert (same guardrail as document
    # upload) so an unknown/inaccessible notebook yields a structured 404
    # rather than a foreign-key 500.
    if data.notebook_id and not await db_service.verify_notebook_ownership(
        data.notebook_id, user_id, session_id
    ):
        raise HTTPException(status_code=404, detail=f"Notebook '{data.notebook_id}' not found")

    try:
        convo = await db_service.create_conversation(
            user_id=user_id,
            session_id=session_id,
            notebook_id=data.notebook_id,
            title=data.title,
            model=data.model,
            focus=data.focus,
            conv_id=data.id,
        )
    except NotebookNotFoundError:
        raise HTTPException(status_code=404, detail=f"Notebook '{data.notebook_id}' not found")
    except ConversationConflictError:
        # Same id already exists under a different owner/notebook. This is a
        # genuine identity conflict — reject clearly instead of reusing or
        # overwriting the existing conversation.
        raise HTTPException(
            status_code=409,
            detail=f"Conversation '{data.id}' already exists with a different owner or notebook",
        )
    return convo


@router.get("/{conversation_id}/messages")
async def get_messages(conversation_id: str, owner: dict = Depends(get_owner)):
    c = await db_service.get_conversation(conversation_id)
    if not c or not _verify_conv_access(c, owner):
        raise HTTPException(status_code=404, detail="Conversation not found")
        
    messages = await db_service.list_messages(conversation_id)
    if not settings.enable_images:
        for m in messages:
            m["images_json"] = None
            if "images" in m:
                m["images"] = []
    return messages


@router.post("/{conversation_id}/messages")
async def add_message(conversation_id: str, data: MessageCreate, owner: dict = Depends(get_owner)):
    c = await db_service.get_conversation(conversation_id)
    if not c or not _verify_conv_access(c, owner):
        raise HTTPException(status_code=404, detail="Conversation not found")

    images_payload = data.images if settings.enable_images else None
    msg = await db_service.create_message(
        conversation_id=conversation_id,
        role=data.role,
        content=data.content,
        sources_json=json.dumps(data.sources) if data.sources is not None else None,
        images_json=json.dumps(images_payload) if images_payload is not None else None,
        citations_json=json.dumps(data.citation_map) if data.citation_map is not None else None,
        related_json=json.dumps(data.related_questions) if data.related_questions is not None else None,
        meta_json=json.dumps(data.meta) if data.meta is not None else None,
    )
    return msg


@router.delete("/{conversation_id}")
async def delete_conversation(conversation_id: str, owner: dict = Depends(get_owner)):
    c = await db_service.get_conversation(conversation_id)
    if not c or not _verify_conv_access(c, owner):
        raise HTTPException(status_code=404, detail="Conversation not found")
        
    await db_service.delete_conversation(conversation_id)
    return {"deleted": True}
