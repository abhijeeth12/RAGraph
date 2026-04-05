from fastapi import APIRouter, HTTPException, Depends
from typing import Optional, List, Dict, Any
from app.services.db_service import db_service
from app.core.auth.dependencies import get_current_user_optional, get_session_from_cookie
from pydantic import BaseModel
import uuid

router = APIRouter(prefix="/api/conversations", tags=["conversations"])

class ConversationCreate(BaseModel):
    id: Optional[str] = None
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
    current_user: Optional[dict] = Depends(get_current_user_optional),
    session: Optional[dict] = Depends(get_session_from_cookie)
) -> dict:
    if current_user:
        return {"user_id": current_user["user_id"], "session_id": None}
    if session:
        return {"user_id": None, "session_id": session["id"]}
    raise HTTPException(status_code=401, detail="Not authenticated")


@router.get("/")
async def list_conversations(owner: dict = Depends(get_owner)):
    # We only persist conversations for logged in users, NOT guests.
    if not owner["user_id"]:
        return []
        
    convos = await db_service.list_conversations_by_user(owner["user_id"])
    return convos


@router.post("/")
async def create_conversation(data: ConversationCreate, owner: dict = Depends(get_owner)):
    if not owner["user_id"]:
        # Mock response for guest
        return {
            "id": str(uuid.uuid4()),
            "title": data.title,
            "model": data.model,
            "focus": data.focus
        }
        
    convo = await db_service.create_conversation(
        user_id=owner["user_id"],
        title=data.title,
        model=data.model,
        focus=data.focus,
        conv_id=data.id
    )
    return convo


@router.get("/{conversation_id}/messages")
async def get_messages(conversation_id: str, owner: dict = Depends(get_owner)):
    if not owner["user_id"]:
        return []
        
    c = await db_service.get_conversation(conversation_id)
    if not c or c["user_id"] != owner["user_id"]:
        raise HTTPException(status_code=404, detail="Conversation not found")
        
    messages = await db_service.list_messages(conversation_id)
    return messages


@router.post("/{conversation_id}/messages")
async def add_message(conversation_id: str, data: MessageCreate, owner: dict = Depends(get_owner)):
    if not owner["user_id"]:
        return {"id": "guest_msg"}
        
    c = await db_service.get_conversation(conversation_id)
    if not c or c["user_id"] != owner["user_id"]:
        raise HTTPException(status_code=404, detail="Conversation not found")
        
    msg = await db_service.create_message(
        conversation_id=conversation_id,
        role=data.role,
        content=data.content,
        sources=data.sources,
        images=data.images,
        citations=data.citation_map,
        related=data.related_questions,
        meta=data.meta
    )
    return msg


@router.delete("/{conversation_id}")
async def delete_conversation(conversation_id: str, owner: dict = Depends(get_owner)):
    if not owner["user_id"]:
        return {"deleted": True}
        
    c = await db_service.get_conversation(conversation_id)
    if not c or c["user_id"] != owner["user_id"]:
        raise HTTPException(status_code=404, detail="Conversation not found")
        
    await db_service.delete_conversation(conversation_id)
    return {"deleted": True}
