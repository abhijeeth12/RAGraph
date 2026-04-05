import time
from collections import defaultdict
from fastapi import Request
from fastapi.responses import JSONResponse
from loguru import logger
from app.config import settings

# Simple in-memory sliding window (fine for single instance)
_auth_limits = defaultdict(list)
_upload_limits = defaultdict(list)
_search_limits = defaultdict(list)

def _check_limit(store: dict, key: str, max_requests: int, window_seconds: int = 60) -> bool:
    now = time.time()
    # Remove stale timestamps
    store[key] = [t for t in store[key] if now - t < window_seconds]
    if len(store[key]) >= max_requests:
        return False
    store[key].append(now)
    return True

async def rate_limit_middleware(request: Request, call_next):
    path = request.url.path
    client_ip = request.client.host if request.client else "127.0.0.1"
    
    if path.startswith("/api/auth/"):
        if not _check_limit(_auth_limits, client_ip, settings.rate_limit_auth):
            logger.warning(f"Auth rate limit exceeded for IP: {client_ip}")
            return JSONResponse(status_code=429, content={"detail": "Too many auth requests"})

    if path.startswith("/api/documents/upload"):
        if not _check_limit(_upload_limits, client_ip, settings.rate_limit_upload):
            return JSONResponse(status_code=429, content={"detail": "Too many upload requests"})
            
    if path.startswith("/api/search"):
        if not _check_limit(_search_limits, client_ip, settings.rate_limit_search):
            return JSONResponse(status_code=429, content={"detail": "Too many search requests"})

    return await call_next(request)
