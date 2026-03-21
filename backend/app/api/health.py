from fastapi import APIRouter
from datetime import datetime, UTC
from app.services.qdrant_service import qdrant_service
from app.services.redis_service import redis_service
from app.config import settings

router = APIRouter(tags=["health"])


@router.get("/health")
async def health_check():
    services = {}
    try:
        if qdrant_service._client:
            cols = await qdrant_service._client.get_collections()
            services["qdrant"] = {
                "status": "ok",
                "collections": [c.name for c in cols.collections],
            }
        else:
            services["qdrant"] = {"status": "not_connected"}
    except Exception as e:
        services["qdrant"] = {"status": "error", "detail": str(e)}

    try:
        if redis_service._client:
            await redis_service._client.ping()
            services["redis"] = {"status": "ok"}
        else:
            services["redis"] = {"status": "not_connected"}
    except Exception as e:
        services["redis"] = {"status": "error", "detail": str(e)}

    services["llm"] = {
        "openai": "configured" if settings.openai_api_key else "missing",
        "anthropic": "configured" if settings.anthropic_api_key else "missing",
        "default": settings.default_llm,
        "hyde_enabled": settings.hyde_enabled,
    }

    overall = "ok" if all(
        v.get("status") == "ok"
        for v in services.values()
        if isinstance(v, dict) and "status" in v
    ) else "degraded"

    return {
        "status": overall,
        "app": settings.app_name,
        "env": settings.app_env,
        "timestamp": datetime.now(UTC).isoformat(),
        "services": services,
    }


@router.get("/health/ping")
async def ping():
    return {"pong": True, "ts": datetime.now(UTC).isoformat()}


@router.delete("/cache/clear")
async def clear_cache():
    """Clear all cached search results. Use after re-ingesting documents."""
    from app.services.redis_service import redis_service
    count = await redis_service.clear_all_queries()
    return {"cleared": count, "message": f"Deleted {count} cached queries"}
