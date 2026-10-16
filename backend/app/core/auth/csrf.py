import secrets
from fastapi import Request, HTTPException, status
from loguru import logger
from app.config import settings

SAFE_METHODS = {"GET", "HEAD", "OPTIONS", "TRACE"}

async def verify_csrf_token(request: Request):
    """
    CSRF Protection Middleware/Dependency.
    Requires state-changing requests to include a custom X-CSRF-Token header
    that matches the value in the ragraph_csrf cookie.
    """
    if not settings.csrf_enabled:
        return
        
    # SSE streams and pure GET endpoints don't need CSRF checks
    if request.url.path.startswith("/api/search/stream"):
        return
        
    if request.method in SAFE_METHODS:
        return
        
    cookie_token = request.cookies.get("ragraph_csrf")
    header_token = request.headers.get("x-csrf-token")
    
    if not cookie_token or not header_token or secrets.compare_digest(cookie_token, header_token) is False:
        logger.warning(f"CSRF validation failed for {request.url.path}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="CSRF token validation failed"
        )
