from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
import uuid


class User(BaseModel):
    user_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    name: Optional[str] = None
    avatar: Optional[str] = None
    provider: str = "email"  # 'email' | 'google' | 'github'
    password_hash: Optional[str] = None  # NULL for OAuth-only users
    created_at: datetime = Field(default_factory=datetime.utcnow)


class UserCreate(BaseModel):
    email: str = Field(..., min_length=3, max_length=255)
    password: str = Field(..., min_length=6, max_length=128)
    name: Optional[str] = None


class UserLogin(BaseModel):
    email: str
    password: str


class UserResponse(BaseModel):
    user_id: str
    email: str
    name: Optional[str] = None
    avatar: Optional[str] = None
    provider: str = "email"
    created_at: datetime


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class GoogleCallbackRequest(BaseModel):
    code: str
    state: Optional[str] = None
