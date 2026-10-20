"""
Notebook knowledge maps — on-demand, notebook-isolated API.

- GET    /api/knowledge-map?notebook_id=..[&doc_ids=..] -> existing map state for this notebook (never auto-generates)
- POST   /api/knowledge-map/generate                    -> claim slot + background generation for this notebook
- DELETE /api/knowledge-map?notebook_id=..              -> delete map for this notebook

Scope = strictly isolated per notebook. Every notebook independently owns its own map.
Data columns are written only on success, so a failed regeneration never destroys
a previously existing valid map.
"""
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, Cookie
from typing import Optional, List
from datetime import datetime, timezone
from loguru import logger
import json

from app.config import settings
from app.core.auth.dependencies import get_current_user_optional, get_session_from_cookie
from app.services.db_service import db_service

router = APIRouter(prefix="/api/knowledge-map", tags=["knowledge-map"])


async def get_owner(
    session_id: Optional[str] = None,
    current_user: Optional[dict] = Depends(get_current_user_optional),
    session: Optional[dict] = Depends(get_session_from_cookie),
    cookie_session_id: Optional[str] = Cookie(None, alias="session_id"),
    ragraph_session: Optional[str] = Cookie(None, alias="ragraph_session"),
) -> dict:
    """Returns {'user_id': str, 'session_id': None} or {'user_id': None, 'session_id': str} or raises 401."""
    if current_user and "user_id" in current_user:
        return {"user_id": current_user["user_id"], "session_id": None}
    if session and "id" in session:
        return {"user_id": None, "session_id": session["id"]}
    if session_id:
        return {"user_id": None, "session_id": session_id}
    if cookie_session_id:
        return {"user_id": None, "session_id": cookie_session_id}
    if ragraph_session:
        return {"user_id": None, "session_id": ragraph_session}
    raise HTTPException(status_code=401, detail="Not authenticated or missing session")


def _parse_doc_ids(doc_ids: Optional[str]) -> Optional[list[str]]:
    if not doc_ids:
        return None
    ids = [d.strip() for d in doc_ids.split(",") if d.strip()]
    return ids or None


def _owner_id(owner: dict) -> str:
    return owner["user_id"] if owner["user_id"] else owner["session_id"]


async def _resolve_docs(
    owner: dict,
    wanted: Optional[list[str]],
    notebook_id: str,
) -> list[dict]:
    docs = await db_service.list_documents_by_notebook(notebook_id)
    by_id = {d["id"]: d for d in docs}
    if wanted is None:
        selected = list(docs)
    else:
        selected = [by_id[d] for d in wanted if d in by_id]
        missing = [d for d in wanted if d not in by_id]
        if missing:
            raise HTTPException(
                status_code=404,
                detail=f"Documents not found in this notebook: {missing[:5]}",
            )
    # Only ingested docs can contribute content
    ready = [d for d in selected if (d.get("status") or "") == "done"]
    skipped = [d["original_filename"] for d in selected if (d.get("status") or "") != "done"]
    if skipped:
        logger.info(f"Notebook {notebook_id} map generation skips non-ingested docs: {skipped}")
    return ready


def _map_response(row: dict, current: list[dict], current_ids: list[str], notebook_id: str) -> dict:
    """Row with stored map data -> API payload (raises if unparseable)."""
    from app.core.knowledge_map import build_graph_view

    stored_ids = set(json.loads(row.get("doc_ids_json") or "[]"))
    new_docs = [
        d["original_filename"]
        for d in current
        if d["id"] not in stored_ids
    ]
    triplets = json.loads(row.get("graph_json") or "[]")
    outline = json.loads(row.get("outline_json"))
    return {
        "exists": True,
        "status": row.get("status") or "done",
        "notebook_id": notebook_id,
        "outline": outline,
        "graph": build_graph_view(triplets, current),
        "doc_ids": sorted(stored_ids),
        "doc_count": len(current_ids),
        "stale": bool(new_docs),
        "new_docs": new_docs[:10],
        "updated_at": row.get("updated_at").isoformat() if row.get("updated_at") else None,
    }


@router.get("")
async def get_map(
    notebook_id: str = Query(..., description="Target Notebook ID"),
    doc_ids: Optional[str] = None,
    owner: dict = Depends(get_owner),
):
    """Retrieve existing map for this specific notebook. Never auto-generates."""
    if not notebook_id or not notebook_id.strip():
        raise HTTPException(status_code=400, detail="notebook_id query parameter is required")

    notebook_id = notebook_id.strip()

    # Validate notebook ownership
    valid = await db_service.verify_notebook_ownership(
        notebook_id, owner["user_id"], owner["session_id"]
    )
    if not valid:
        raise HTTPException(status_code=404, detail="Notebook not found")

    docs = await db_service.list_documents_by_notebook(notebook_id)
    by_id = {d["id"]: d for d in docs}
    wanted = _parse_doc_ids(doc_ids)
    if wanted is not None:
        current = [by_id[d] for d in wanted if d in by_id]
    else:
        current = list(docs)
    current_ids = sorted(d["id"] for d in current)

    # Strictly isolated query by notebook_id
    row = await db_service.get_knowledge_map_by_notebook(notebook_id)

    if not current_ids:
        return {
            "exists": False,
            "empty": True,
            "status": "empty",
            "notebook_id": notebook_id,
            "doc_count": 0,
            "message": "Upload documents to this notebook first.",
        }

    if row is not None and (row.get("status") or "") == "generating":
        # Check for stale or timed-out generation (> 15 minutes)
        updated_at = row.get("updated_at")
        if updated_at:
            if updated_at.tzinfo is None:
                updated_at = updated_at.replace(tzinfo=timezone.utc)
            age = (datetime.now(timezone.utc) - updated_at).total_seconds()
            if age > 900:
                return {
                    "exists": bool(row.get("outline_json")),
                    "status": "failed",
                    "error": "Previous generation timed out. Click Regenerate to retry.",
                    "notebook_id": notebook_id,
                    "doc_count": len(current_ids),
                    "doc_ids": current_ids,
                }
        return {
            "exists": bool(row.get("outline_json")),
            "status": "generating",
            "generating": True,
            "notebook_id": notebook_id,
            "doc_count": len(current_ids),
            "doc_ids": current_ids,
        }

    if row is not None and row.get("outline_json"):
        return _map_response(row, current, current_ids, notebook_id=notebook_id)

    if row is not None and not row.get("outline_json"):
        return {
            "exists": False,
            "status": row.get("status") or "failed",
            "error": row.get("error_message"),
            "notebook_id": notebook_id,
            "doc_count": len(current_ids),
            "doc_ids": current_ids,
        }

    # No map exists for this notebook yet -> clean empty state with Generate action
    return {
        "exists": False,
        "status": "empty",
        "notebook_id": notebook_id,
        "doc_count": len(current_ids),
        "doc_ids": current_ids,
    }


@router.post("/generate")
async def generate_map(
    background_tasks: BackgroundTasks,
    body: Optional[dict] = None,
    owner: dict = Depends(get_owner),
):
    """Claim generation slot for this notebook and start background synthesis."""
    body = body or {}
    notebook_id = body.get("notebook_id")
    if not notebook_id or not str(notebook_id).strip():
        raise HTTPException(status_code=400, detail="notebook_id is required in request body")

    notebook_id = str(notebook_id).strip()

    # Validate notebook ownership
    valid = await db_service.verify_notebook_ownership(
        notebook_id, owner["user_id"], owner["session_id"]
    )
    if not valid:
        raise HTTPException(status_code=404, detail="Notebook not found")

    raw = body.get("doc_ids")
    wanted = [str(d) for d in raw] if isinstance(raw, list) and raw else None
    docs = await _resolve_docs(owner, wanted, notebook_id=notebook_id)
    if not docs:
        raise HTTPException(
            status_code=422,
            detail=(
                "No ingested documents available for map generation in this notebook. "
                "Upload documents and wait for ingestion to finish first."
            ),
        )

    owner_id = _owner_id(owner)
    current_ids = sorted(d["id"] for d in docs)
    doc_ids_json = json.dumps(current_ids)
    owner_key = f"user:{owner['user_id']}" if owner["user_id"] else f"session:{owner['session_id']}"

    claimed = await db_service.claim_knowledge_map_generation(
        notebook_id=notebook_id,
        owner_key=owner_key,
        doc_ids_json=doc_ids_json,
        doc_count=len(current_ids),
        user_id=owner["user_id"],
        session_id=owner["session_id"],
    )
    if not claimed:
        raise HTTPException(
            status_code=409,
            detail=(
                "Map generation already in progress for this notebook. "
                "Wait for it to finish before regenerating."
            ),
        )

    background_tasks.add_task(_run_generation, notebook_id, owner_id, current_ids)
    logger.info(f"Map generation accepted notebook={notebook_id} docs={len(current_ids)}")
    return {
        "accepted": True,
        "status": "generating",
        "notebook_id": notebook_id,
        "doc_count": len(current_ids),
        "doc_ids": current_ids,
    }


async def _run_generation(notebook_id: str, owner_id: str, doc_ids: list[str]) -> None:
    from app.core.knowledge_map import get_notebook_lock, generate_notebook_map

    lock = get_notebook_lock(notebook_id)
    async with lock:
        try:
            all_docs = await db_service.list_documents_by_notebook(notebook_id)
            doc_id_set = set(doc_ids)
            docs = [d for d in all_docs if d.get("id") in doc_id_set]
            if not docs:
                raise RuntimeError("Notebook documents no longer exist")

            result = await generate_notebook_map(owner_id, docs)
            await db_service.save_knowledge_map(
                notebook_id=notebook_id,
                outline_json=json.dumps(result["outline"], ensure_ascii=False),
                graph_json=json.dumps(result["triplets"]),
            )
            logger.info(
                f"Map generation done notebook={notebook_id} "
                f"failed_docs={result.get('failed_docs')}"
            )
        except Exception as e:
            err = str(e).strip() or repr(e)
            logger.exception(f"Map generation failed notebook={notebook_id}: {err[:300]}")
            try:
                await db_service.fail_knowledge_map(notebook_id, err[:2000])
            except Exception as db_e:
                logger.error(f"Failed to record map failure: {repr(db_e)}")


@router.delete("")
async def delete_map(
    notebook_id: str = Query(..., description="Target Notebook ID"),
    owner: dict = Depends(get_owner),
):
    """Delete knowledge map for this specific notebook."""
    if not notebook_id or not notebook_id.strip():
        raise HTTPException(status_code=400, detail="notebook_id query parameter is required")

    notebook_id = notebook_id.strip()
    valid = await db_service.verify_notebook_ownership(
        notebook_id, owner["user_id"], owner["session_id"]
    )
    if not valid:
        raise HTTPException(status_code=404, detail="Notebook not found")

    deleted = await db_service.delete_knowledge_map(notebook_id)
    return {"notebook_id": notebook_id, "deleted": deleted}
