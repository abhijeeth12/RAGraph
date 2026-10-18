from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
import uuid


class NotebookCreate(BaseModel):
    id: Optional[str] = None
    title: str = Field(default="Untitled Notebook", max_length=200)
    description: Optional[str] = Field(default=None, max_length=1000)
    model: Optional[str] = "openrouter/free"
    focus: Optional[str] = "all"


class NotebookUpdate(BaseModel):
    title: Optional[str] = Field(default=None, max_length=200)
    description: Optional[str] = Field(default=None, max_length=1000)
    model: Optional[str] = None
    focus: Optional[str] = None


class NotebookResponse(BaseModel):
    id: str
    user_id: Optional[str] = None
    session_id: Optional[str] = None
    title: str
    description: Optional[str] = None
    model: str = "openrouter/free"
    focus: str = "all"
    document_count: int = 0
    conversation_count: int = 0
    created_at: str
    updated_at: str
