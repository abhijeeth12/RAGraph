from qdrant_client import AsyncQdrantClient
from qdrant_client.models import (
    Distance, VectorParams, PointStruct,
    Filter, FieldCondition, MatchValue,
    HnswConfigDiff, OptimizersConfigDiff,
    FilterSelector,
)
from typing import Optional
from loguru import logger
from app.config import settings

TEXT_VECTOR_CONFIG = VectorParams(
    size=settings.embedding_dim,
    distance=Distance.COSINE,
    hnsw_config=HnswConfigDiff(m=16, ef_construct=200),
)
IMAGE_VECTOR_CONFIG = VectorParams(
    size=384,
    distance=Distance.COSINE,
    hnsw_config=HnswConfigDiff(m=16, ef_construct=200),
)


class QdrantService:
    def __init__(self):
        self._client: Optional[AsyncQdrantClient] = None

    async def connect(self) -> None:
        self._client = AsyncQdrantClient(
            url=settings.qdrant_url,
            api_key=settings.qdrant_api_key or None,
        )
        logger.info(f"Qdrant connected -> {settings.qdrant_url}")
        await self._ensure_collections()

    async def _ensure_collections(self) -> None:
        collections = await self._client.get_collections()
        existing = {c.name for c in collections.collections}
        if settings.qdrant_text_collection not in existing:
            await self._client.create_collection(
                collection_name=settings.qdrant_text_collection,
                vectors_config=TEXT_VECTOR_CONFIG,
                optimizers_config=OptimizersConfigDiff(indexing_threshold=10_000),
            )
            logger.info(f"Created collection: {settings.qdrant_text_collection}")

        # Ensure indexes exist on text collection for all frequently-filtered fields.
        # Some managed Qdrant setups require indexes for payload filtering.
        for field_name in ("owner_id", "level", "doc_id", "parent_id", "section_id"):
            try:
                await self._client.create_payload_index(
                    collection_name=settings.qdrant_text_collection,
                    field_name=field_name,
                    field_schema="keyword",
                )
            except Exception as e:
                logger.debug(f"Payload index {field_name} on text collection exists or failed: {e}")

        if settings.qdrant_image_collection not in existing:
            await self._client.create_collection(
                collection_name=settings.qdrant_image_collection,
                vectors_config=IMAGE_VECTOR_CONFIG,
                optimizers_config=OptimizersConfigDiff(indexing_threshold=1_000),
            )
            logger.info(f"Created collection: {settings.qdrant_image_collection}")

        # Ensure indexes exist on image collection for owner/doc filters.
        for field_name in ("owner_id", "doc_id"):
            try:
                await self._client.create_payload_index(
                    collection_name=settings.qdrant_image_collection,
                    field_name=field_name,
                    field_schema="keyword",
                )
            except Exception as e:
                logger.debug(f"Payload index {field_name} on image collection exists or failed: {e}")

    async def _search_points(
        self,
        collection_name: str,
        vector: list[float],
        limit: int,
        query_filter: Optional[Filter] = None,
        score_threshold: Optional[float] = None,
    ) -> list[dict]:
        """
        Compatibility wrapper for qdrant-client API differences.
        - Older clients expose `search`
        - Newer clients expose `query_points`
        """
        if hasattr(self._client, "search"):
            results = await self._client.search(
                collection_name=collection_name,
                query_vector=vector,
                limit=limit,
                query_filter=query_filter,
                score_threshold=score_threshold,
                with_payload=True,
            )
            return [{"id": r.id, "score": r.score, "payload": r.payload} for r in results]

        if hasattr(self._client, "query_points"):
            response = await self._client.query_points(
                collection_name=collection_name,
                query=vector,
                limit=limit,
                query_filter=query_filter,
                score_threshold=score_threshold,
                with_payload=True,
            )
            points = getattr(response, "points", response)
            return [{"id": p.id, "score": p.score, "payload": p.payload} for p in points]

        raise RuntimeError("Qdrant client has neither `search` nor `query_points` method")

    async def upsert_text_nodes(self, points: list[PointStruct]) -> None:
        await self._client.upsert(
            collection_name=settings.qdrant_text_collection,
            points=points, wait=True,
        )

    async def upsert_image_nodes(self, points: list[PointStruct]) -> None:
        await self._client.upsert(
            collection_name=settings.qdrant_image_collection,
            points=points, wait=True,
        )

    async def search_text(self, vector: list[float], top_k: int = 10,
                          payload_filter: Optional[Filter] = None,
                          owner_filter: Optional[Filter] = None,
                          score_threshold=None) -> list[dict]:
        if owner_filter:
            if payload_filter:
                payload_filter = Filter(must=payload_filter.must + owner_filter.must)
            else:
                payload_filter = owner_filter
        return await self._search_points(
            collection_name=settings.qdrant_text_collection,
            vector=vector,
            limit=top_k,
            query_filter=payload_filter,
            score_threshold=score_threshold,
        )

    async def search_images(self, vector: list[float], top_k: int = 5,
                            owner_filter: Optional[Filter] = None,
                            score_threshold: float = 0.15) -> list[dict]:
        return await self._search_points(
            collection_name=settings.qdrant_image_collection,
            vector=vector,
            limit=top_k,
            query_filter=owner_filter,
            score_threshold=score_threshold,
        )

    @staticmethod
    def filter_by_level(level: str) -> Filter:
        return Filter(must=[FieldCondition(key="level", match=MatchValue(value=level))])

    @staticmethod
    def filter_by_parent(parent_id: str) -> Filter:
        return Filter(must=[FieldCondition(key="parent_id", match=MatchValue(value=parent_id))])

    @staticmethod
    def filter_by_doc(doc_id: str) -> Filter:
        return Filter(must=[FieldCondition(key="doc_id", match=MatchValue(value=doc_id))])

    @staticmethod
    def filter_by_owner(owner_id: str) -> Filter:
        return Filter(must=[FieldCondition(key="owner_id", match=MatchValue(value=owner_id))])

    @staticmethod
    def filter_by_owner_doc(owner_id: str, doc_id: str) -> Filter:
        return Filter(
            must=[
                FieldCondition(key="owner_id", match=MatchValue(value=owner_id)),
                FieldCondition(key="doc_id", match=MatchValue(value=doc_id)),
            ]
        )

    async def delete_by_doc(self, owner_id: str, doc_id: str) -> None:
        for coll in [settings.qdrant_text_collection, settings.qdrant_image_collection]:
            await self._client.delete(
                collection_name=coll,
                points_selector=FilterSelector(filter=self.filter_by_owner_doc(owner_id, doc_id)),
            )

    async def delete_by_owner(self, owner_id: str) -> None:
        """Delete ALL vectors belonging to an owner (used for guest cleanup)."""
        for coll in [settings.qdrant_text_collection, settings.qdrant_image_collection]:
            await self._client.delete(
                collection_name=coll,
                points_selector=FilterSelector(filter=self.filter_by_owner(owner_id)),
            )
        logger.info(f"Deleted all Qdrant vectors for owner={owner_id[:8]}")

    async def close(self) -> None:
        if self._client:
            await self._client.close()


qdrant_service = QdrantService()
