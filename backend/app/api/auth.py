from fastapi import APIRouter, Depends, HTTPException, status, Response, Cookie
import bcrypt
from datetime import datetime, UTC
import uuid
from loguru import logger

from app.services.db_service import db_service
from app.models.user import UserCreate, UserLogin, TokenResponse, UserResponse, GoogleCallbackRequest
from app.core.auth.jwt_handler import (
    create_access_token,
    create_refresh_token,
    decode_token,
)
from app.core.auth.dependencies import get_current_user_required
from app.core.auth.oauth_google import get_google_auth_url, exchange_code
from app.config import settings

router = APIRouter(prefix="/api/auth", tags=["auth"])

def _format_user(user_row: dict) -> dict:
    """Map DB 'id' -> output 'user_id' for Pydantic"""
    d = dict(user_row)
    if "id" in d:
        d["user_id"] = d.pop("id")
    return d

def _set_refresh_cookie(response: Response, token: str):
    response.set_cookie(
        key="ragraph_refresh",
        value=token,
        httponly=True,
        secure=settings.secure_cookies,
        samesite="lax",
        max_age=settings.jwt_refresh_expire_days * 24 * 3600,
        path="/api/auth",
    )

def _clear_refresh_cookie(response: Response):
    response.delete_cookie(
        key="ragraph_refresh",
        path="/api/auth",
        secure=settings.secure_cookies,
        httponly=True,
        samesite="lax"
    )

@router.post("/signup", response_model=TokenResponse)
async def signup(user_data: UserCreate, response: Response):
    existing = await db_service.get_user_by_email(user_data.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    salt = bcrypt.gensalt()
    pwd_hash = bcrypt.hashpw(user_data.password.encode('utf-8'), salt).decode('utf-8')
    user_id = str(uuid.uuid4())
    
    user = await db_service.create_user(
        user_id=user_id,
        email=user_data.email,
        password_hash=pwd_hash,
        name=user_data.name,
        provider="email"
    )
    if not user:
        raise HTTPException(status_code=500, detail="Failed to create user")
        
    access_token = create_access_token(user["id"], user["email"])
    refresh_token = create_refresh_token(user["id"])
    _set_refresh_cookie(response, refresh_token)
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": _format_user(user)
    }

@router.post("/login", response_model=TokenResponse)
async def login(credentials: UserLogin, response: Response):
    user = await db_service.get_user_by_email(credentials.email)
    if not user or not user.get("password_hash"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
        
    if not bcrypt.checkpw(credentials.password.encode('utf-8'), user["password_hash"].encode('utf-8')):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
        
    access_token = create_access_token(user["id"], user["email"])
    refresh_token = create_refresh_token(user["id"])
    _set_refresh_cookie(response, refresh_token)
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": _format_user(user)
    }

@router.post("/refresh")
async def refresh_token(response: Response, ragraph_refresh: str = Cookie(None)):
    if not ragraph_refresh:
        raise HTTPException(status_code=401, detail="No refresh token")

    payload = decode_token(ragraph_refresh)
    if not payload or payload.get("type") != "refresh":
        _clear_refresh_cookie(response)
        raise HTTPException(status_code=401, detail="Invalid refresh token")
        
    user_id = payload.get("sub")
    if not user_id:
        _clear_refresh_cookie(response)
        raise HTTPException(status_code=401, detail="Invalid token payload")
        
    if await db_service.is_token_revoked(ragraph_refresh):
        _clear_refresh_cookie(response)
        raise HTTPException(status_code=401, detail="Token revoked")

    user = await db_service.get_user_by_id(user_id)
    if not user:
        _clear_refresh_cookie(response)
        raise HTTPException(status_code=401, detail="User not found")

    # Revoke old
    if payload.get("exp"):
        await db_service.revoke_token(ragraph_refresh, datetime.fromtimestamp(payload["exp"], UTC))

    new_access = create_access_token(user["id"], user["email"])
    new_refresh = create_refresh_token(user["id"])
    _set_refresh_cookie(response, new_refresh)

    return {"access_token": new_access, "token_type": "bearer"}

@router.post("/logout")
async def logout(response: Response, ragraph_refresh: str = Cookie(None)):
    if ragraph_refresh:
        payload = decode_token(ragraph_refresh)
        if payload and payload.get("exp"):
            await db_service.revoke_token(ragraph_refresh, datetime.fromtimestamp(payload["exp"], UTC))
    
    _clear_refresh_cookie(response)
    # Clear session/CSRF cookies as well
    response.delete_cookie(key="ragraph_session", path="/", secure=settings.secure_cookies, httponly=True)
    response.delete_cookie(key="ragraph_csrf", path="/", secure=settings.secure_cookies, httponly=False)
    return {"message": "Logged out successfully"}

@router.get("/me", response_model=UserResponse)
async def get_me(user: dict = Depends(get_current_user_required)):
    return _format_user(user)

@router.get("/google/url")
async def google_url():
    state = "state_" + str(datetime.now().timestamp())
    return {"url": get_google_auth_url(state)}

@router.post("/google/callback", response_model=TokenResponse)
async def google_callback(req: GoogleCallbackRequest, response: Response):
    user_info = await exchange_code(req.code)
    if not user_info or not user_info.get("email"):
        raise HTTPException(status_code=400, detail="Google authentication failed")

    email = user_info["email"]
    user = await db_service.get_user_by_email(email)
    
    if not user:
        user_id = str(uuid.uuid4())
        user = await db_service.create_user(
            user_id=user_id,
            email=email,
            name=user_info.get("name"),
            avatar=user_info.get("picture"),
            provider="google"
        )
    else:
        # Update profile if needed
        await db_service.update_user(
            user["id"], 
            name=user_info.get("name") or user.get("name"),
            avatar=user_info.get("picture") or user.get("avatar"),
        )
        user = await db_service.get_user_by_id(user["id"])

    access_token = create_access_token(user["id"], user["email"])
    refresh_token = create_refresh_token(user["id"])
    _set_refresh_cookie(response, refresh_token)
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": _format_user(user)
    }
