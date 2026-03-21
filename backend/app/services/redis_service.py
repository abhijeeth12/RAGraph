import json
import hashlib
from typing import Optional, Any
import redis.asyncio as aioredis
from loguru import logger
from app.config import settings


class RedisService:
    def __init__(self):
        self._client: Optional[aioredis.Redis] = None

    async def connect(self) -> None:
        self._client = aioredis.from_url(
            settings.redis_url, encoding="utf-8", decode_responses=True,
        )
        await self._client.ping()
        logger.info(f"Redis connected -> {settings.redis_url}")

    def _query_key(self, query: str, model: str, focus: str) -> str:
        digest = hashlib.sha256(
            f"{query}|{model}|{focus}".encode()
        ).hexdigest()[:16]
        return f"ragraph:query:{digest}"

    async def get_cached_result(self, query: str, model: str, focus: str) -> Optional[dict]:
        if not self._client:
            return None
        try:
            raw = await self._client.get(self._query_key(query, model, focus))
            return json.loads(raw) if raw else None
        except Exception as e:
            logger.warning(f"Redis get failed: {e}")
            return None

    async def cache_result(self, query: str, model: str, focus: str, result: dict) -> None:
        if not self._client:
            return
        try:
            await self._client.setex(
                self._query_key(query, model, focus),
                settings.cache_ttl_seconds,
                json.dumps(result),
            )
        except Exception as e:
            logger.warning(f"Redis set failed: {e}")

    async def set(self, key: str, value: Any, ttl: int = 300) -> None:
        if self._client:
            await self._client.setex(key, ttl, json.dumps(value))

    async def get(self, key: str) -> Optional[Any]:
        if not self._client:
            return None
        raw = await self._client.get(key)
        return json.loads(raw) if raw else None

    async def clear_all_queries(self) -> int:
        """Delete all query cache entries. Call after fixing pipeline issues."""
        if not self._client:
            return 0
        try:
            keys = await self._client.keys("ragraph:query:*")
            if keys:
                await self._client.delete(*keys)
            return len(keys)
        except Exception as e:
            logger.warning(f"Cache clear failed: {e}")
            return 0

    async def close(self) -> None:
        if self._client:
            await self._client.aclose()


redis_service = RedisService()
