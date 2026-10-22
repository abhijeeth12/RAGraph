from fastapi import APIRouter
from datetime import datetime, UTC
from app.services.qdrant_service import qdrant_service
from app.services.redis_service import redis_service
from app.services.db_service import db_service
from app.config import settings

router = APIRouter(prefix="/api", tags=["health"])


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

    # PostgreSQL status — degraded if not connected, matches lifespan fix
    try:
        if db_service.is_connected and db_service._pool:
            async with db_service._pool.acquire() as conn:
                await conn.fetchval("SELECT 1")
            services["postgres"] = {"status": "ok"}
        else:
            services["postgres"] = {"status": "not_connected", "detail": "PostgreSQL not connected — app running in degraded mode"}
    except Exception as e:
        services["postgres"] = {"status": "error", "detail": str(e)}

    services["llm"] = {
        "openai": "configured" if settings.openai_api_key else "missing",
        "anthropic": "configured" if settings.anthropic_api_key else "missing",
        "default": settings.default_llm,
        "hyde_enabled": settings.hyde_enabled,
    }

    # In-memory vector cache stats
    try:
        from app.core.retrieval.in_memory_store import _STORE
        import time
        cache_entries = []
        for owner_id, entry in _STORE._cache.items():
            age_s = round(time.monotonic() - entry.loaded_at, 1)
            cache_entries.append({
                "owner": owner_id[:8] + "...",
                "paragraphs": len(entry.paragraphs),
                "size_kb": entry.para_vecs.nbytes // 1024,
                "age_s": age_s,
                "ttl_s": entry.ttl,
            })
        services["inmem_cache"] = {
            "status": "ok",
            "owners_cached": len(cache_entries),
            "entries": cache_entries,
        }
    except Exception as e:
        services["inmem_cache"] = {"status": "error", "detail": str(e)}

    # Memory observability
    try:
        from app.utils.memory import get_memory_snapshot
        mem_snap = get_memory_snapshot()
        services["memory"] = {
            "status": "ok" if mem_snap.headroom_mb > 50.0 else "warning",
            "rss_mb": mem_snap.rss_mb,
            "peak_rss_mb": mem_snap.peak_rss_mb,
            "container_used_mb": mem_snap.container_used_mb,
            "container_limit_mb": mem_snap.container_limit_mb,
            "headroom_mb": mem_snap.headroom_mb,
            "is_cgroup_measured": mem_snap.is_cgroup_measured,
        }
    except Exception as e:
        services["memory"] = {"status": "error", "detail": str(e)}

    overall = "ok" if all(
        v.get("status") == "ok"
        for v in services.values()
        if isinstance(v, dict) and "status" in v
    ) else "degraded"

    return {
        "status": overall,
        "app": settings.app_name,
        "version": "0.5.0",
        "env": settings.app_env,
        "timestamp": datetime.now(UTC).isoformat(),
        "services": services,
    }


@router.get("/health/ping")
async def ping():
    return {"pong": True, "ts": datetime.now(UTC).isoformat()}


@router.get("/health/memory")
async def memory_diagnostics():
    """
    Detailed non-blocking memory diagnostics endpoint.
    Exposes process RSS, VmHWM peak, cgroup container metrics, and GC statistics.
    """
    from app.utils.memory import get_diagnostic_memory_report
    return get_diagnostic_memory_report()


@router.delete("/cache/clear")
async def clear_cache():
    """Clear all cached search results and in-memory vector cache."""
    from app.services.redis_service import redis_service
    from app.core.retrieval.in_memory_store import _STORE
    from app.utils.memory import trim_memory
    count = await redis_service.clear_all_queries()
    inmem_count = len(_STORE._cache)
    _STORE._cache.clear()
    trim_memory()
    return {
        "redis_cleared": count,
        "inmem_cleared": inmem_count,
        "message": f"Deleted {count} Redis queries and {inmem_count} in-memory caches"
    }
