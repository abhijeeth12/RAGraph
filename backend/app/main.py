from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
from loguru import logger
import sys
import os

from app.config import settings
from app.api.router import api_router
from app.services.qdrant_service import qdrant_service
from app.services.redis_service import redis_service
from app.services.db_service import db_service

logger.remove()
logger.add(
    sys.stderr,
    format="{time:HH:mm:ss} | {level: <8} | {name} - {message}",
    level="DEBUG" if settings.is_dev else "INFO",
    colorize=True,
)

import logging
class EndpointFilter(logging.Filter):
    def filter(self, record: logging.LogRecord) -> bool:
        return record.getMessage().find("GET /api/documents/") == -1

logging.getLogger("uvicorn.access").addFilter(EndpointFilter())


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"Starting {settings.app_name} [{settings.app_env}]")
    db_connected = False
    try:
        db_connected = await db_service.connect()
        if not db_connected:
            logger.warning("PostgreSQL not connected at startup — running in degraded mode (health will show degraded)")
            # Background retry so Render Postgres that starts a bit later can be picked up
            async def _db_retry_loop():
                import asyncio
                for attempt in range(12):  # retry for ~6 minutes
                    await asyncio.sleep(30)
                    if db_service.is_connected:
                        return
                    logger.info(f"Retrying PostgreSQL connection (attempt {attempt+1}/12)...")
                    try:
                        if await db_service.connect():
                            logger.info("PostgreSQL reconnected in background")
                            return
                    except Exception as e:
                        logger.debug(f"Background DB retry failed: {e}")
                logger.warning("Background PostgreSQL retry exhausted")
            import asyncio
            asyncio.create_task(_db_retry_loop())
    except Exception as e:
        logger.error(f"PostgreSQL unavailable at startup: {e}")
        logger.warning("Continuing without database — degraded mode")
    try:
        await qdrant_service.connect()
    except Exception as e:
        logger.warning(f"Qdrant unavailable at startup: {e}")
    try:
        await redis_service.connect()
    except Exception as e:
        logger.warning(f"Redis unavailable at startup: {e}")
        
    async def guest_cleanup_loop():
        import asyncio
        while True:
            try:
                await asyncio.sleep(3600)  # Check every hour
                from app.services.db_service import db_service
                await db_service.cleanup_old_guest_documents(hours=24)
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Guest cleanup loop error: {e}")
                
    import asyncio
    cleanup_task = asyncio.create_task(guest_cleanup_loop())
    
    logger.info("RAGraph backend ready")
    yield
    cleanup_task.cancel()
    await db_service.close()
    await qdrant_service.close()
    await redis_service.close()
    logger.info("Shutdown complete.")


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.app_name,
        description=(
            "Hierarchical RAG v5 — in-memory numpy retrieval, "
            "heading-aware tree ingestion, section-aware beam+diverse selection, "
            "HyDE query expansion, multimodal ColPali, graph reranking, "
            "GPT-4o / Claude 3.5 Sonnet streaming."
        ),
        version="0.5.0",
        docs_url="/docs"  if settings.is_dev else None,
        redoc_url="/redoc" if settings.is_dev else None,
        lifespan=lifespan,
    )

    from app.middleware.rate_limiter import rate_limit_middleware
    from starlette.middleware.base import BaseHTTPMiddleware

    # Rate limiter must be INNER (added first) so CORS is OUTER and wraps
    # all responses (including 429/400) with CORS headers. Otherwise preflight
    # OPTIONS never gets CORS headers and browser reports 400.
    app.add_middleware(BaseHTTPMiddleware, dispatch=rate_limit_middleware)

    # CORS: wildcard "*" with credentials is rejected by browsers
    # (Access-Control-Allow-Origin: * + credentials:include → blocked).
    # Filter "*" out and rely on allow_origin_regex to echo the request Origin.
    # This fixes 400/ERR_FAILED "must not be wildcard when credentials is include".
    raw_origins = settings.cors_origins_list
    cors_origins = [o for o in raw_origins if o != "*" and "your-frontend" not in o]
    # Always allow regex fallback so Vercel preview deploys work
    app.add_middleware(
        CORSMiddleware,
        allow_origins=cors_origins,
        allow_origin_regex=".*",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.include_router(api_router)

    # Serve uploaded images as static files
    uploads_path = os.path.abspath(settings.local_storage_path)
    os.makedirs(uploads_path, exist_ok=True)
    app.mount("/uploads", StaticFiles(directory=uploads_path), name="uploads")

    @app.get("/")
    @app.head("/")
    async def root():
        return {"status": "ok", "app": settings.app_name}

    return app


app = create_app()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=settings.app_port,
        reload=settings.is_dev,
    )
