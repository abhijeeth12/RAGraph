"""
Notebook knowledge maps — on-demand API.

- GET  /api/knowledge-map[?doc_ids=..]  -> existing map state (never generates)
- POST /api/knowledge-map/generate      -> claim slot + background generation;
                                          poll GET until done/failed (409 if busy)

Scope = owner + exact document set. Data columns are written only on success,
so a failed (re)generation never destroys the previous map.
"""
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from typing import Optional
from loguru import logger
import json

from app.config import settings
from app.api.documents import get_owner
from app.services.db_service import db_service

router = APIRouter(prefix="/api/knowledge-map", tags=["knowledge-map"])


def _parse_doc_ids(doc_ids: Optional[str]) -> Optional[list[str]]:
    if not doc_ids:
        return None
    ids = [d.strip() for d in doc_ids.split(",") if d.strip()]
    return ids or None


async def _resolve_docs(owner: dict, wanted: Optional[list[str]]) -> list[dict]:
    docs = await db_service.list_documents_by_owner(owner["user_id"], owner["session_id"])
    by_id = {d["id"]: d for d in docs}
    if wanted is None:
        selected = list(docs)
    else:
        selected = [by_id[d] for d in wanted if d in by_id]
        missing = [d for d in wanted if d not in by_id]
        if missing:
            raise HTTPException(status_code=404,
                                detail=f"Documents not found: {missing[:5]}")
    # Only ingested docs can contribute content
    ready = [d for d in selected if (d.get("status") or "") == "done"]
    skipped = [d["original_filename"] for d in selected if (d.get("status") or "") != "done"]
    if skipped:
        logger.info(f"Map scope skips non-ingested docs: {skipped}")
    return ready


def _owner_id(owner: dict) -> str:
    return owner["user_id"] if owner["user_id"] else owner["session_id"]


@router.get("")
async def get_map(doc_ids: Optional[str] = None, owner: dict = Depends(get_owner)):
    from app.core.knowledge_map import notebook_scope, build_graph_view

    wanted = _parse_doc_ids(doc_ids)
    docs = await db_service.list_documents_by_owner(owner["user_id"], owner["session_id"])
    by_id = {d["id"]: d for d in docs}
    if wanted is not None:
        current = [by_id[d] for d in wanted if d in by_id]
    else:
        current = list(docs)
    current_ids = sorted(d["id"] for d in current)
    owner_id = _owner_id(owner)
    owner_key = f"user:{owner['user_id']}" if owner["user_id"] else f"session:{owner['session_id']}"
    scope_key, _ = notebook_scope(owner_id, current_ids)
    row = await db_service.get_knowledge_map(scope_key)

    if not current_ids:
        return {"exists": False, "empty": True, "status": "empty",
                "doc_count": 0, "message": "Upload documents to this notebook first."}

    if row is not None and (row.get("status") or "") == "generating":
        return {"exists": bool(row.get("outline_json")), "status": "generating",
                "generating": True, "doc_count": len(current_ids),
                "doc_ids": current_ids}

    if row is not None and row.get("outline_json"):
        return _map_response(row, current, current_ids)

    # No map for this exact set: fall back to the newest map for this notebook
    # (e.g. documents were added since). The prior map stays visible with a
    # "regenerate to include" hint instead of stranding the user on Generate —
    # but only when the current set genuinely adds documents. A narrowed
    # selection gets a fresh Generate to avoid presenting a superset as current.
    prior = await db_service.latest_knowledge_map_for_owner(owner_key)
    if prior is not None and prior.get("scope_key") != scope_key:
        try:
            prior_ids = set(json.loads(prior.get("doc_ids_json") or "[]"))
        except Exception:
            prior_ids = set()
        added = [d for d in current if d["id"] not in prior_ids]
        if added and prior.get("outline_json"):
            try:
                resp = _map_response(prior, current, current_ids)
            except Exception:
                resp = None
            if resp is not None:
                resp["stale"] = True
                resp["new_docs"] = [d["original_filename"] for d in added][:10]
                resp["prior_scope"] = True
                return resp

    if row is not None and not row.get("outline_json"):
        return {"exists": False,
                "status": row.get("status") or "failed",
                "error": row.get("error_message"),
                "doc_count": len(current_ids), "doc_ids": current_ids}
    return {"exists": False, "status": "empty", "doc_count": len(current_ids),
            "doc_ids": current_ids}


def _map_response(row: dict, current: list[dict], current_ids: list[str]) -> dict:
    """Row with stored map data -> API payload (raises if unparseable)."""
    from app.core.knowledge_map import build_graph_view

    stored_ids = set(json.loads(row.get("doc_ids_json") or "[]"))
    new_docs = [d["original_filename"] for d in current
                if d["id"] not in stored_ids]
    triplets = json.loads(row.get("graph_json") or "[]")
    outline = json.loads(row.get("outline_json"))
    return {
        "exists": True,
        "status": row.get("status") or "done",
        "outline": outline,
        "graph": build_graph_view(triplets, current),
        "doc_ids": sorted(stored_ids),
        "doc_count": len(current_ids),
        "stale": bool(new_docs),
        "new_docs": new_docs[:10],
        "updated_at": row.get("updated_at").isoformat() if row.get("updated_at") else None,
    }


@router.post("/generate")
async def generate_map(
    background_tasks: BackgroundTasks,
    body: Optional[dict] = None,
    owner: dict = Depends(get_owner),
):
    from app.core.knowledge_map import notebook_scope

    body = body or {}
    raw = body.get("doc_ids")
    wanted = [str(d) for d in raw] if isinstance(raw, list) and raw else None
    docs = await _resolve_docs(owner, wanted)
    if not docs:
        raise HTTPException(status_code=422, detail=(
            "No ingested documents available for map generation. "
            "Upload documents and wait for ingestion to finish first."))
    owner_id = _owner_id(owner)
    current_ids = sorted(d["id"] for d in docs)
    scope_key, doc_ids_json = notebook_scope(owner_id, current_ids)
    owner_key = f"user:{owner['user_id']}" if owner["user_id"] else f"session:{owner['session_id']}"
    claimed = await db_service.claim_knowledge_map_generation(
        scope_key, owner_key, doc_ids_json, len(current_ids))
    if not claimed:
        raise HTTPException(status_code=409, detail=(
            "Map generation already in progress for this notebook. "
            "Wait for it to finish before regenerating."))
    background_tasks.add_task(_run_generation, scope_key, owner_id, current_ids)
    logger.info(f"Map generation accepted scope={scope_key[:8]} docs={len(current_ids)}")
    return {"accepted": True, "status": "generating",
            "doc_count": len(current_ids), "doc_ids": current_ids}


async def _run_generation(scope_key: str, owner_id: str, doc_ids: list[str]) -> None:
    from app.core.knowledge_map import get_scope_lock, generate_notebook_map

    lock = get_scope_lock(scope_key)
    async with lock:
        try:
            # Re-resolve the snapshot set (ownership re-verified; docs may have
            # been deleted since claim — generate for exactly this defined set)
            async with db_service._pool.acquire() as conn:
                rows = await conn.fetch(
                    "SELECT * FROM documents WHERE id = ANY($1)", doc_ids)
            docs = [dict(r) for r in rows]
            if not docs:
                raise RuntimeError("Notebook documents no longer exist")
            result = await generate_notebook_map(owner_id, docs)
            await db_service.save_knowledge_map(
                scope_key,
                outline_json=json.dumps(result["outline"], ensure_ascii=False),
                graph_json=json.dumps(result["triplets"]),
            )
            logger.info(f"Map generation done scope={scope_key[:8]} "
                        f"failed_docs={result.get('failed_docs')}")
        except Exception as e:
            err = str(e).strip() or repr(e)
            logger.exception(f"Map generation failed scope={scope_key[:8]}: {err[:300]}")
            try:
                await db_service.fail_knowledge_map(scope_key, err[:2000])
            except Exception as db_e:
                logger.error(f"Failed to record map failure: {repr(db_e)}")
