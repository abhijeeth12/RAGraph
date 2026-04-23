from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
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
    try:
        await db_service.connect()
    except Exception as e:
        logger.warning(f"PostgreSQL unavailable at startup: {e}")
    try:
        await qdrant_service.connect()
    except Exception as e:
        logger.warning(f"Qdrant unavailable at startup: {e}")
    try:
        await redis_service.connect()
    except Exception as e:
        logger.warning(f"Redis unavailable at startup: {e}")
    logger.info("RAGraph backend ready")
    yield
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
    
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.add_middleware(BaseHTTPMiddleware, dispatch=rate_limit_middleware)
    app.add_middleware(GZipMiddleware, minimum_size=1000)
    app.include_router(api_router)

    # Serve uploaded images as static files
    uploads_path = os.path.abspath(settings.local_storage_path)
    os.makedirs(uploads_path, exist_ok=True)
    app.mount("/uploads", StaticFiles(directory=uploads_path), name="uploads")

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
