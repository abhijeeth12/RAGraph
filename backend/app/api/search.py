from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from loguru import logger
import json, time, asyncio
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
async def stream_search(session_id: str, request: SearchRequest):
    logger.info(f"Search session={session_id[:8]}: '{request.query[:60]}' model={request.model} "
                f"hyde={request.use_hyde} has_image={bool(request.image)}")
    return StreamingResponse(
        _pipeline(session_id, request),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache",
                 "X-Accel-Buffering": "no",
                 "Connection": "keep-alive"},
    )


async def _pipeline(session_id: str, request: SearchRequest):
    # Check if owner has any documents in Qdrant (survives server restarts)
    try:
        owner_filter = qdrant_service.filter_by_owner(session_id)
        check = await qdrant_service._client.scroll(
            collection_name=settings.qdrant_text_collection,
            scroll_filter=owner_filter, limit=1,
            with_payload=False, with_vectors=False,
        )
        if not check[0]:
            logger.warning(f"No documents in Qdrant for owner {session_id[:8]}")
            yield _sse(StreamChunkType.ERROR, "No documents available in this session. Please upload documents first.")
            return
    except Exception as e:
        logger.warning(f"Qdrant check failed, proceeding anyway: {e}")
        
    start = time.time()
    answer_buffer = ""

    try:
        # Cache check (skip if empty chunks stored)
        if not request.image:
            cached = await redis_service.get_cached_result(
                session_id, request.query, request.model, request.focus
            )
            if cached and cached.get("chunk_count", 0) > 0:
                logger.info("Cache hit")
                async for chunk in _replay_cached(cached):
                    yield chunk
                return

        # Retrieve
        from app.core.retrieval.orchestrator import retrieve
        retrieval = await retrieve(
            session_id=session_id,
            query=request.query,
            use_hyde=request.use_hyde,
            use_dual_path=request.use_dual_path,
            image_base64=request.image,
            top_k=settings.top_k_final,
        )

        # Get doc number + name maps for citations
        from app.services.db_service import db_service
        # For stream endpoints, session_id might actually be the user_id if logged in,
        # so pass it to both to let db_service resolve the owner
        doc_numbers = await db_service.get_doc_number_map(user_id=session_id, session_id=session_id)
        doc_names   = await db_service.get_doc_name_map(user_id=session_id, session_id=session_id)

        # Build source items with doc number
        sources = _chunks_to_sources(retrieval.chunks, doc_numbers, doc_names)
        yield _sse(StreamChunkType.SOURCES,
                   json.dumps([s.model_dump() for s in sources]))

        images = _to_image_items(retrieval.images)
        yield _sse(StreamChunkType.IMAGES,
                   json.dumps([i.model_dump() for i in images]))

        # Build context with doc-number citations
        from app.core.generation.context_builder import build_context
        context = build_context(
            query=request.query,
            chunks=retrieval.chunks,
            images=retrieval.images,
            conversation_history=request.conversation_history,
            image_base64=request.image,
            doc_numbers=doc_numbers,
            doc_names=doc_names,
        )

        # Stream LLM answer
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

        # Citation map for display
        citation_map = _build_citation_map(retrieval.chunks, doc_numbers, doc_names)
        yield _sse(StreamChunkType.CITATIONS, json.dumps(citation_map))

        # Related questions
        headings = list({
            c.heading_path[-1] for c in retrieval.chunks if c.heading_path
        })
        related = await generate_related_questions(
            query=request.query,
            answer=answer_buffer,
            headings=headings,
        )
        yield _sse(StreamChunkType.RELATED, json.dumps(related))

        elapsed_ms = int((time.time() - start) * 1000)
        done_meta = {
            "time_ms": elapsed_ms,
            "tokens": context.total_tokens + len(answer_buffer) // 4,
            "model": request.model,
            "hyde_used": retrieval.hyde_used,
            "dual_path_fallback_used": retrieval.dual_path_fallback_used,
            "chunks_used": len(retrieval.chunks),
            "strategies_used": getattr(retrieval, "strategies_used", []),
        }
        yield _sse(StreamChunkType.DONE, json.dumps(done_meta))

        # Cache only if we got real chunks
        if not request.image and answer_buffer and len(retrieval.chunks) > 0:
            await redis_service.cache_result(
                session_id, request.query, request.model, request.focus,
                {
                    "sources":     [s.model_dump() for s in sources],
                    "images":      [i.model_dump() for i in images],
                    "answer":      answer_buffer,
                    "related":     related,
                    "meta":        done_meta,
                    "citation_map": citation_map,
                    "chunk_count": len(retrieval.chunks),
                },
            )

    except asyncio.CancelledError:
        logger.info("Client disconnected")
    except Exception as e:
        logger.error("Pipeline error: {}", repr(e))
        yield _sse(StreamChunkType.ERROR, str(e))


def _sse(chunk_type, content: str) -> str:
    return StreamChunk(type=chunk_type, content=content).to_sse()


async def _replay_cached(cached: dict):
    yield _sse(StreamChunkType.SOURCES, json.dumps(cached.get("sources", [])))
    yield _sse(StreamChunkType.IMAGES,  json.dumps(cached.get("images", [])))
    answer = cached.get("answer", "")
    for word in answer.split(" "):
        await asyncio.sleep(0.008)
        yield _sse(StreamChunkType.TEXT, word + " ")
    yield _sse(StreamChunkType.CITATIONS, json.dumps(cached.get("citation_map", {})))
    yield _sse(StreamChunkType.RELATED,  json.dumps(cached.get("related", [])))
    yield _sse(StreamChunkType.DONE,     json.dumps(cached.get("meta", {})))


def _chunks_to_sources(chunks, doc_numbers, doc_names) -> list[SourceItem]:
    sources = []
    for c in chunks:
        num = doc_numbers.get(c.doc_id, 0)
        name = doc_names.get(c.doc_id, "Unknown")
        label = f"[Doc {num}] {name}" if num else name
        sources.append(SourceItem(
            id=c.node_id,
            title=c.heading_path[-1] if c.heading_path else label,
            url=f"#chunk-{c.node_id[:8]}",
            domain=f"Doc {num}" if num else "ragraph",
            snippet=c.text[:200],
            relevance_score=round(c.score, 3),
            heading_path=c.heading_path,
            doc_id=c.doc_id,
        ))
    return sources


def _to_image_items(images) -> list[ImageItem]:
    return [
        ImageItem(
            id=img.image_id, url=img.storage_url,
            caption=img.caption,
            source_title=img.nearest_heading or "Document Image",
            source_url=img.storage_url,
            heading_path=img.heading_path,
            relevance_score=round(img.score, 3),
            width=img.width, height=img.height,
        )
        for img in images
    ]


def _build_citation_map(chunks, doc_numbers, doc_names) -> dict:
    """Build citation number -> doc info mapping for display."""
    seen = {}
    result = {}
    for i, chunk in enumerate(chunks, 1):
        doc_id = chunk.doc_id
        if doc_id not in seen:
            seen[doc_id] = True
            num = doc_numbers.get(doc_id, 0)
            name = doc_names.get(doc_id, "Unknown")
            result[str(i)] = {
                "doc_number": num,
                "filename": name,
                "label": f"Doc {num}" if num else "Unknown",
                "heading": chunk.heading_path[-1] if chunk.heading_path else "",
            }
    return result


@router.post("", response_model=SearchResponse)
async def search(session_id: str, request: SearchRequest):
    start = time.time()
    sources, images, answer, related = [], [], "", []
    meta: dict = {}
    async for raw in _pipeline(session_id, request):
        try:
            line = raw.strip()
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
        query=request.query, answer=answer,
        sources=[SourceItem(**s) for s in sources],
        images=[ImageItem(**i) for i in images],
        related_questions=related,
        model_used=meta.get("model", request.model),
        tokens_used=meta.get("tokens", 0),
        time_ms=int((time.time() - start) * 1000),
        hyde_used=meta.get("hyde_used", False),
        dual_path_fallback_used=meta.get("dual_path_fallback_used", False),
    )
