from fastapi import APIRouter, Depends, HTTPException, status, Response, Cookie, Header
import bcrypt
from datetime import datetime, UTC
from typing import Optional
import uuid
from loguru import logger

from app.services.db_service import db_service
from app.models.user import (
    UserCreate,
    UserLogin,
    TokenResponse,
    UserResponse,
    GoogleCallbackRequest,
    RefreshRequest,
    RefreshResponse,
)
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

def _get_cookie_params() -> dict:
    """Determine secure and samesite cookie parameters.
    In cross-origin production (e.g. Vercel frontend on *.vercel.app + Render backend on *.onrender.com),
    browsers require SameSite='none' and Secure=True for cookies to be included in fetch(..., credentials: 'include').
    In local development (HTTP), browsers reject SameSite='none' without Secure, so SameSite='lax' is used.
    """
    is_secure = settings.secure_cookies or (settings.app_env == "production")
    samesite = "none" if is_secure else "lax"
    return {"secure": is_secure, "samesite": samesite}

def _set_refresh_cookie(response: Response, token: str):
    params = _get_cookie_params()
    response.set_cookie(
        key="ragraph_refresh",
        value=token,
        httponly=True,
        secure=params["secure"],
        samesite=params["samesite"],
        max_age=settings.jwt_refresh_expire_days * 24 * 3600,
        path="/",
    )

def _clear_refresh_cookie(response: Response):
    params = _get_cookie_params()
    response.delete_cookie(
        key="ragraph_refresh",
        path="/",
        secure=params["secure"],
        httponly=True,
        samesite=params["samesite"],
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
    refresh_token_val = create_refresh_token(user["id"])
    _set_refresh_cookie(response, refresh_token_val)
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "refresh_token": refresh_token_val,
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
    refresh_token_val = create_refresh_token(user["id"])
    _set_refresh_cookie(response, refresh_token_val)
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "refresh_token": refresh_token_val,
        "user": _format_user(user)
    }

@router.post("/refresh", response_model=RefreshResponse)
async def refresh_token(
    response: Response,
    ragraph_refresh: Optional[str] = Cookie(None),
    x_refresh_token: Optional[str] = Header(None, alias="X-Refresh-Token"),
    body: Optional[RefreshRequest] = None,
):
    # Support cookie (primary), X-Refresh-Token header (cross-site fallback), and JSON body
    token_candidate = None
    source = "none"
    if ragraph_refresh and ragraph_refresh.strip():
        token_candidate = ragraph_refresh.strip()
        source = "cookie"
    elif x_refresh_token and x_refresh_token.strip():
        token_candidate = x_refresh_token.strip()
        source = "header"
    elif body and body.refresh_token and body.refresh_token.strip():
        token_candidate = body.refresh_token.strip()
        source = "body"

    if not token_candidate:
        logger.warning("[AUTH-REFRESH] 401 Unauthorized: No refresh token present in cookie, X-Refresh-Token header, or body")
        raise HTTPException(status_code=401, detail="No refresh token")

    payload = decode_token(token_candidate)
    if not payload or payload.get("type") != "refresh":
        _clear_refresh_cookie(response)
        logger.warning(f"[AUTH-REFRESH] 401 Unauthorized: Invalid or expired refresh token JWT (source={source})")
        raise HTTPException(status_code=401, detail="Invalid refresh token")
        
    user_id = payload.get("sub")
    if not user_id:
        _clear_refresh_cookie(response)
        logger.warning(f"[AUTH-REFRESH] 401 Unauthorized: Missing 'sub' claim in refresh token (source={source})")
        raise HTTPException(status_code=401, detail="Invalid token payload")
        
    # Check revocation with a 30-second grace window to absorb in-flight race conditions during token rotation
    if await db_service.is_token_revoked(token_candidate, grace_seconds=30):
        _clear_refresh_cookie(response)
        logger.warning(f"[AUTH-REFRESH] 401 Unauthorized: Refresh token is permanently revoked (source={source})")
        raise HTTPException(status_code=401, detail="Token revoked")

    user = await db_service.get_user_by_id(user_id)
    if not user:
        _clear_refresh_cookie(response)
        logger.warning(f"[AUTH-REFRESH] 401 Unauthorized: User '{user_id[:8]}...' not found in DB (source={source})")
        raise HTTPException(status_code=401, detail="User not found")

    # Revoke old token
    if payload.get("exp"):
        await db_service.revoke_token(token_candidate, datetime.fromtimestamp(payload["exp"], UTC))

    new_access = create_access_token(user["id"], user["email"])
    new_refresh = create_refresh_token(user["id"])
    _set_refresh_cookie(response, new_refresh)

    logger.info(f"[AUTH-REFRESH] 200 OK: Refreshed credentials for user={user['id'][:8]} (source={source})")
    return {
        "access_token": new_access,
        "token_type": "bearer",
        "refresh_token": new_refresh,
    }

@router.post("/logout")
async def logout(
    response: Response,
    ragraph_refresh: Optional[str] = Cookie(None),
    x_refresh_token: Optional[str] = Header(None, alias="X-Refresh-Token"),
    body: Optional[RefreshRequest] = None,
):
    token_candidate = None
    if ragraph_refresh and ragraph_refresh.strip():
        token_candidate = ragraph_refresh.strip()
    elif x_refresh_token and x_refresh_token.strip():
        token_candidate = x_refresh_token.strip()
    elif body and body.refresh_token and body.refresh_token.strip():
        token_candidate = body.refresh_token.strip()

    if token_candidate:
        payload = decode_token(token_candidate)
        if payload and payload.get("exp"):
            await db_service.revoke_token(token_candidate, datetime.fromtimestamp(payload["exp"], UTC))
    
    _clear_refresh_cookie(response)
    # Clear session/CSRF cookies as well
    response.delete_cookie(key="ragraph_session", path="/", secure=settings.secure_cookies, httponly=True)
    response.delete_cookie(key="ragraph_csrf", path="/", secure=settings.secure_cookies, httponly=False)
    logger.info("[AUTH-LOGOUT] User session terminated and cookies invalidated")
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
    refresh_token_val = create_refresh_token(user["id"])
    _set_refresh_cookie(response, refresh_token_val)
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "refresh_token": refresh_token_val,
        "user": _format_user(user)
    }
