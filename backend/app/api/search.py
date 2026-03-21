"""
Search API — Phase 4: full RAG pipeline with LLM streaming.

Flow per request:
  1. Check Redis cache
  2. Retrieve (beam-search + dual-path + graph rerank)
  3. Build context (citations + token budget)
  4. Stream LLM answer token by token
  5. Generate related questions
  6. Cache result
  7. Send done signal
"""
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from loguru import logger
import json
import time
import asyncio
from app.models.search import (
    SearchRequest, SearchResponse,
    StreamChunk, StreamChunkType,
    SourceItem, ImageItem,
)
from app.config import settings
from app.services.qdrant_service import qdrant_service
from app.services.redis_service import redis_service

router = APIRouter(prefix="/api/search", tags=["search"])


@router.post("/stream")
async def stream_search(request: SearchRequest):
    logger.info(
        f"Search: '{request.query[:60]}' "
        f"model={request.model} hyde={request.use_hyde} "
        f"has_image={bool(request.image)}"
    )
    return StreamingResponse(
        _pipeline(request),
        media_type="text/event-stream",
        headers={
            "Cache-Control":     "no-cache",
            "X-Accel-Buffering": "no",
            "Connection":        "keep-alive",
        },
    )


async def _pipeline(request: SearchRequest):
    start = time.time()
    answer_buffer = ""

    try:
        # ── 0. Cache check ────────────────────────────────────────────────
        if not request.image:          # don't cache image queries
            cached = await redis_service.get_cached_result(
                request.query, request.model, request.focus
            )
            if cached:
                logger.info("Cache hit — streaming cached result")
                async for chunk in _replay_cached(cached):
                    yield chunk
                return

        # ── 1. Retrieve ───────────────────────────────────────────────────
        from app.core.retrieval.orchestrator import retrieve
        retrieval = await retrieve(
            query=request.query,
            use_hyde=request.use_hyde,
            use_dual_path=request.use_dual_path,
            image_base64=request.image,
            top_k=settings.top_k_final,
        )

        # ── 2. Emit sources ───────────────────────────────────────────────
        sources = _chunks_to_sources(retrieval.chunks)
        yield _sse(StreamChunkType.SOURCES,
                   json.dumps([s.model_dump() for s in sources]))

        # ── 3. Emit images ────────────────────────────────────────────────
        images = _to_image_items(retrieval.images)
        yield _sse(StreamChunkType.IMAGES,
                   json.dumps([i.model_dump() for i in images]))

        # ── 4. Build context ──────────────────────────────────────────────
        from app.core.generation.context_builder import build_context
        context = build_context(
            query=request.query,
            chunks=retrieval.chunks,
            images=retrieval.images,
            conversation_history=request.conversation_history,
            image_base64=request.image,
        )

        # ── 5. Stream LLM answer ──────────────────────────────────────────
        from app.core.generation.llm_client import (
            stream_answer, generate_related_questions
        )
        async for delta in stream_answer(
            context=context,
            model=request.model,
            image_base64=request.image,
        ):
            answer_buffer += delta
            yield _sse(StreamChunkType.TEXT, delta)

        # ── 6. Related questions ──────────────────────────────────────────
        headings = list({
            c.heading_path[-1]
            for c in retrieval.chunks if c.heading_path
        })
        related = await generate_related_questions(
            query=request.query,
            answer=answer_buffer,
            headings=headings,
        )
        yield _sse(StreamChunkType.RELATED, json.dumps(related))

        # ── 7. Done signal ────────────────────────────────────────────────
        elapsed_ms = int((time.time() - start) * 1000)
        tokens_used = context.total_tokens + len(answer_buffer) // 4

        done_meta = {
            "time_ms":                elapsed_ms,
            "tokens":                 tokens_used,
            "model":                  request.model,
            "hyde_used":              retrieval.hyde_used,
            "dual_path_fallback_used": retrieval.dual_path_fallback_used,
            "total_candidates":       retrieval.total_candidates,
            "chunks_used":            len(retrieval.chunks),
        }
        yield _sse(StreamChunkType.DONE, json.dumps(done_meta))

        # ── 8. Cache result (non-image queries) ───────────────────────────
        if not request.image and answer_buffer and len(retrieval.chunks) > 0:
            await redis_service.cache_result(
                request.query, request.model, request.focus,
                {
                    "sources": [s.model_dump() for s in sources],
                    "images":  [i.model_dump() for i in images],
                    "answer":  answer_buffer,
                    "related": related,
                    "meta":    done_meta,
                },
            )

    except asyncio.CancelledError:
        logger.info("Client disconnected")
    except Exception as e:
        logger.error("Pipeline error: {}", repr(e))
        yield _sse(StreamChunkType.ERROR, str(e))


# ── Non-streaming fallback ────────────────────────────────────────────────

@router.post("", response_model=SearchResponse)
async def search(request: SearchRequest):
    """Collect full streaming response and return at once."""
    start = time.time()
    sources, images, answer, related = [], [], "", []
    meta: dict = {}

    async for raw_sse in _pipeline(request):
        try:
            # raw_sse is "data: {...}\n\n"
            line = raw_sse.strip()
            if not line.startswith("data: "):
                continue
            chunk = json.loads(line[6:])
            if chunk["type"] == "sources":
                sources = json.loads(chunk["content"])
            elif chunk["type"] == "images":
                images = json.loads(chunk["content"])
            elif chunk["type"] == "text":
                answer += chunk["content"]
            elif chunk["type"] == "related":
                related = json.loads(chunk["content"])
            elif chunk["type"] == "done":
                meta = json.loads(chunk["content"])
        except Exception:
            pass

    return SearchResponse(
        query=request.query,
        answer=answer,
        sources=[SourceItem(**s) for s in sources],
        images=[ImageItem(**i) for i in images],
        related_questions=related,
        model_used=meta.get("model", request.model),
        tokens_used=meta.get("tokens", 0),
        time_ms=int((time.time() - start) * 1000),
        hyde_used=meta.get("hyde_used", False),
        dual_path_fallback_used=meta.get("dual_path_fallback_used", False),
    )


# ── Helpers ───────────────────────────────────────────────────────────────

def _sse(chunk_type: StreamChunkType, content: str) -> str:
    return StreamChunk(type=chunk_type, content=content).to_sse()


async def _replay_cached(cached: dict):
    """Replay a cached result as an SSE stream."""
    yield _sse(StreamChunkType.SOURCES, json.dumps(cached.get("sources", [])))
    yield _sse(StreamChunkType.IMAGES,  json.dumps(cached.get("images", [])))
    answer = cached.get("answer", "")
    for word in answer.split(" "):
        await asyncio.sleep(0.008)   # faster replay
        yield _sse(StreamChunkType.TEXT, word + " ")
    yield _sse(StreamChunkType.RELATED, json.dumps(cached.get("related", [])))
    yield _sse(StreamChunkType.DONE,    json.dumps(cached.get("meta", {})))


def _chunks_to_sources(chunks) -> list[SourceItem]:
    return [
        SourceItem(
            id=c.node_id,
            title=c.heading_path[-1] if c.heading_path else "Document",
            url=f"#chunk-{c.node_id[:8]}",
            domain="ragraph",
            snippet=c.text[:200],
            relevance_score=round(c.score, 3),
            heading_path=c.heading_path,
            doc_id=c.doc_id,
        )
        for c in chunks
    ]


def _to_image_items(images) -> list[ImageItem]:
    return [
        ImageItem(
            id=img.image_id,
            url=img.storage_url,
            caption=img.caption,
            source_title=img.nearest_heading or "Document Image",
            source_url=img.storage_url,
            heading_path=img.heading_path,
            relevance_score=round(img.score, 3),
            width=img.width,
            height=img.height,
        )
        for img in images
    ]
