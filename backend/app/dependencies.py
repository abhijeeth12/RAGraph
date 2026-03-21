from app.services.qdrant_service import qdrant_service, QdrantService
from app.services.redis_service import redis_service, RedisService


def get_qdrant() -> QdrantService:
    return qdrant_service


def get_redis() -> RedisService:
    return redis_service
