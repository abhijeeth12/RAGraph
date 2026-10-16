from fastapi import Depends, HTTPException, status, Cookie
from fastapi.security import OAuth2PasswordBearer
from typing import Optional
from app.core.auth.jwt_handler import decode_token
from app.services.db_service import db_service

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login", auto_error=False)

async def get_current_user_optional(token: str = Depends(oauth2_scheme)) -> Optional[dict]:
    """Returns the user dict if a valid access token is present, else None."""
    if not token:
        return None
    
    payload = decode_token(token)
    if not payload or payload.get("type") != "access":
        return None
        
    user_id = payload.get("sub")
    if not user_id:
        return None

    user = await db_service.get_user_by_id(user_id)
    if user and "id" in user and "user_id" not in user:
        user = dict(user)
        user["user_id"] = user.pop("id")
    return user

async def get_current_user_required(user: Optional[dict] = Depends(get_current_user_optional)) -> dict:
    """Returns the user dict or raises a 401 if not authenticated."""
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Valid access token required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user

async def get_session_from_cookie(ragraph_session: Optional[str] = Cookie(None)) -> Optional[dict]:
    """Reads the guest/user session from the HTTP-only cookie."""
    if not ragraph_session:
        return None
    return await db_service.get_session(ragraph_session)
