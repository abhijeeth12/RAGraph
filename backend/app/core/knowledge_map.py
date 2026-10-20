"""
Notebook knowledge maps — on-demand, unified, concept-based generation.

Replaces per-document automatic map generation during ingestion (old Step 3.5).
One map per notebook scope (owner + exact document set), generated only when
the user clicks Generate/Regenerate, persisted in the knowledge_maps table.

Multi-stage strategy (no silent omission, bounded contexts):
  1. Per document: gather text from Qdrant payloads (bounded scroll — files on
     Render are ephemeral, Qdrant is the durable text source), then build a
     mini-outline (existing generate_outline w/ its own LLM fallback chain)
     and triplets (existing extract_semantic_triplets). Per-doc failures are
     isolated: the doc is still represented by name and the rest continue.
  2. Single document: its mini-outline IS the map (no wasteful extra call).
  3. Multiple documents: one synthesis LLM call merges mini-outlines into a
     single concept-organized tree (cross-document links, deduped). Inputs are
     proportionally trimmed only if over budget — and trimming is logged plus
     reported, never silent.
Triplet lists merge by plain dedupe (no LLM needed).
"""
from __future__ import annotations

import asyncio
import hashlib
import json
import time
from loguru import logger

from app.config import settings

# Budgets (chars, not tokens — cheap pre-check before tiktoken counting)
_PER_DOC_TEXT_CHARS = 12_000
_SYNTHESIS_BUDGET_CHARS = 18_000
_MINI_TRIM_FLOOR = 400  # never trim a mini-outline below this (still representative)

_locks: dict[str, asyncio.Lock] = {}


def get_notebook_lock(notebook_id: str) -> asyncio.Lock:
    lock = _locks.get(notebook_id)
    if lock is None:
        lock = asyncio.Lock()
        _locks[notebook_id] = lock
    return lock


def get_scope_lock(scope_key: str) -> asyncio.Lock:
    return get_notebook_lock(scope_key)


def notebook_scope(owner_id: str, doc_ids: list[str]) -> tuple[str, str]:
    """Stable scope identity: owner + exact sorted document set."""
    ids = sorted(set(doc_ids))
    doc_ids_json = json.dumps(ids)
    digest = hashlib.sha256(f"{owner_id}|{','.join(ids)}".encode()).hexdigest()[:32]
    return digest, doc_ids_json


async def gather_doc_texts(owner_id: str, docs: list[dict]) -> dict[str, dict]:
    """Pull bounded paragraph text + headings per doc from Qdrant payloads."""
    from qdrant_client.models import Filter, FieldCondition, MatchValue
    from app.services.qdrant_service import qdrant_service

    out: dict[str, dict] = {}
    for doc in docs:
        doc_id = doc["id"]
        try:
            scroll_filter = Filter(must=[
                FieldCondition(key="owner_id", match=MatchValue(value=owner_id)),
                FieldCondition(key="doc_id", match=MatchValue(value=doc_id)),
                FieldCondition(key="level", match=MatchValue(value="paragraph")),
            ])
            points, _ = await qdrant_service._client.scroll(
                collection_name=settings.qdrant_text_collection,
                scroll_filter=scroll_filter,
                limit=80,
                with_payload=True,
                with_vectors=False,
            )
            texts: list[str] = []
            headings: list[str] = []
            seen_headings: set[str] = set()
            for pt in points or []:
                p = pt.payload or {}
                t = (p.get("text") or "")[:400]
                if t.strip():
                    texts.append(t)
                hp = p.get("heading_path") or []
                if hp:
                    last = str(hp[-1])[:60]
                    if last.lower() not in seen_headings:
                        seen_headings.add(last.lower())
                        headings.append(last)
            blob = "\n\n".join(texts)[:_PER_DOC_TEXT_CHARS]
            out[doc_id] = {
                "filename": doc.get("original_filename") or doc.get("filename") or doc_id,
                "text": blob,
                "headings": headings[:12],
                "para_count": len(texts),
            }
        except Exception as e:
            logger.warning(f"Map gather failed for doc {doc_id}: {repr(e)[:160]}")
            out[doc_id] = {
                "filename": doc.get("original_filename") or doc.get("filename") or doc_id,
                "text": "",
                "headings": [],
                "para_count": 0,
            }
    return out


async def generate_notebook_map(owner_id: str, docs: list[dict]) -> dict:
    """Build one unified concept map for exactly these docs.

    Returns {outline, triplets, doc_ids, failed_docs, trimmed_docs}.
    Raises on total failure (caller keeps the previous map).
    """
    from app.core.ingestion.outline import generate_outline
    from app.core.ingestion.extractor import extract_semantic_triplets

    gathered = await gather_doc_texts(owner_id, docs)
    usable = [d for d in docs if gathered[d["id"]]["text"].strip()]
    if not usable:
        raise RuntimeError("No readable document content found for map generation")

    minis: list[dict] = []     # [{document, outline}]
    triplets: list[dict] = []
    failed_docs: list[str] = []

    for doc in usable:
        g = gathered[doc["id"]]
        # Mini-outline (own LLM fallback chain inside; None only if all fail)
        try:
            mini = await generate_outline(g["text"], g["headings"], title=g["filename"])
        except Exception as e:
            logger.warning(f"Mini-outline error for {g['filename']}: {repr(e)[:160]}")
            mini = None
        if mini and mini.get("children"):
            minis.append({"document": g["filename"], "outline": mini})
        else:
            # Still represent the document (name-only branch) — never silently omit
            failed_docs.append(g["filename"])
            minis.append({"document": g["filename"],
                          "outline": {"name": g["filename"], "children": []}})
        # Triplets (own retry chain inside; [] on failure — isolated per doc)
        try:
            if g["text"].strip():
                triplets.extend(await extract_semantic_triplets(g["text"]) or [])
        except Exception as e:
            logger.warning(f"Triplet error for {g['filename']}: {repr(e)[:160]}")
            if g["filename"] not in failed_docs:
                failed_docs.append(g["filename"])

    if len(minis) == 1:
        outline = minis[0]["outline"]
        logger.info(f"Notebook map: single doc, using its outline directly")
    else:
        outline, trimmed = await synthesize_unified_outline(minis)
        if trimmed:
            logger.warning(f"Synthesis inputs trimmed for: {trimmed} (budget cap)")

    merged_triplets = dedupe_triplets(triplets)
    logger.info(
        f"Notebook map built: {len(minis)} docs, "
        f"{len(merged_triplets)} triplets, failed={failed_docs}"
    )
    return {
        "outline": outline,
        "triplets": merged_triplets,
        "doc_ids": sorted(d["id"] for d in docs),
        "failed_docs": failed_docs,
        "trimmed_docs": trimmed if len(minis) > 1 else [],
    }


async def synthesize_unified_outline(minis: list[dict]) -> tuple[dict, list[str]]:
    """Merge per-doc mini-outlines into ONE concept-organized tree via LLM."""
    from app.utils.json_repair import parse_json_object
    from app.core.ingestion.llm_json import JsonStage, complete_json_stages, dedupe_models
    from app.core.ingestion.outline import _normalize_recursive, _dedupe_outline

    if not settings.openai_api_key:
        raise RuntimeError("No LLM API key configured for map synthesis")

    trimmed: list[str] = []
    payload_items: list[str] = []
    for m in minis:
        blob = json.dumps(m["outline"], ensure_ascii=False)
        payload_items.append(f"--- {m['document']} ---\n{blob}")
    payload = "\n\n".join(payload_items)

    if len(payload) > _SYNTHESIS_BUDGET_CHARS and len(minis) > 1:
        # Proportional trim (deepest leaves first), every doc stays represented
        budget_each = max(_MINI_TRIM_FLOOR, _SYNTHESIS_BUDGET_CHARS // len(minis))
        compacted: list[str] = []
        for m in minis:
            blob = json.dumps(m["outline"], ensure_ascii=False)
            if len(blob) > budget_each:
                blob = _trim_outline_blob(m["outline"], budget_each)
                trimmed.append(m["document"])
            compacted.append(f"--- {m['document']} ---\n{blob}")
        payload = "\n\n".join(compacted)
        logger.warning(
            f"Synthesis payload {len(payload)} chars after trim "
            f"(trimmed docs: {trimmed})"
        )

    schema = """Return STRICTLY JSON, same recursive shape:
{"name": "Central Topic", "children": [{"name": "Topic A", "children": [{"name": "Subtopic"}]}]}"""

    user_full = f"""Merge these per-document mind maps into ONE unified knowledge map.

Per-document outlines:
{payload}

{schema}

Rules:
- Organize by CONCEPTS and relationships, not by document. Synthesize related
  branches across documents into shared topics; link connected ideas.
- Node labels are SHORT noun phrases: 2-4 words, ≤28 characters, Title Case.
  No sentences or filler wording.
- No duplicates (case-insensitive). No emails/phones. Keep genuinely distinct
  concepts separate — unify only what is truly the same idea.
- 5-8 main branches, each with 2-4 subtopics. Output ONLY valid JSON."""

    user_compact = (
        "Merge these document outlines into ONE concept-organized mind map "
        "(5-8 branches, short 2-4 word Title Case labels, no duplicates, "
        "no emails). Output ONLY valid JSON with 'name'/'children':\n\n"
        + payload[:9000]
    )

    system = ("You are a knowledge cartographer. Merge outline JSON inputs into "
              "one unified concept tree. Output only valid JSON.")
    primary = settings.resolve_generation_model()
    cheap = settings.resolve_cheap_model()
    models = dedupe_models(primary, cheap)
    fallback = models[1] if len(models) > 1 else models[0]

    stages = [
        JsonStage(name="synth-full", model=primary, system=system,
                  user=user_full, max_tokens=2048, temperature=0.2),
        JsonStage(name="synth-compact", model=primary, system=system,
                  user=user_compact, max_tokens=1024, temperature=0.2),
        JsonStage(name="synth-fallback", model=fallback, system=system,
                  user=user_compact, max_tokens=1024, temperature=0.2),
    ]
    data, raw, used = await complete_json_stages(stages, parse_json_object)
    if not data or not isinstance(data, dict):
        raise RuntimeError(
            f"Map synthesis failed after {len(stages)} LLM stages (last len={len(raw)})"
        )
    if not str(data.get("name") or "").strip():
        data["name"] = "Knowledge Base"
    norm = _normalize_recursive(data)
    if not norm or not norm.get("children"):
        raise RuntimeError("Synthesized map empty after normalization")
    norm = _dedupe_outline(norm)
    if not norm.get("children"):
        raise RuntimeError("Synthesized map empty after deduplication")
    _cap_breadth(norm, 0)
    logger.info(f"Unified map synthesized via model={used}: "
                f"{norm['name']} ({len(norm['children'])} branches)")
    return norm, trimmed


def _trim_outline_blob(outline: dict, budget: int) -> str:
    """Shrink one mini-outline to budget by dropping deepest leaves first."""
    import copy
    tree = copy.deepcopy(outline)

    def leaves(node: dict, depth: int) -> list[tuple[int, dict, int]]:
        found: list[tuple[int, dict, int]] = []
        for i, ch in enumerate(node.get("children") or []):
            if ch.get("children"):
                found.extend(leaves(ch, depth + 1))
            else:
                found.append((depth, node, i))
        return found

    blob = json.dumps(tree, ensure_ascii=False)
    while len(blob) > budget:
        cands = leaves(tree, 0)
        if not cands:
            break
        cands.sort(key=lambda t: -t[0])
        _, parent, idx = cands[0]
        del parent["children"][idx]
        blob = json.dumps(tree, ensure_ascii=False)
    return blob


def _cap_breadth(node: dict, depth: int) -> None:
    kids = node.get("children")
    if kids:
        node["children"] = kids[:6 if depth == 0 else 4]
        for ch in node["children"]:
            _cap_breadth(ch, depth + 1)


def dedupe_triplets(triplets: list[dict]) -> list[dict]:
    """Merge triplet lists across docs (pure — unit tested)."""
    seen: set[tuple[str, str, str]] = set()
    out: list[dict] = []
    for t in triplets or []:
        if not isinstance(t, dict) or not t.get("source") or not t.get("target"):
            continue
        key = (str(t["source"]).strip().lower(),
               str(t["target"]).strip().lower(),
               str(t.get("label", "")).strip().lower())
        if key in seen:
            continue
        seen.add(key)
        out.append(t)
    return out


def build_graph_view(triplets: list[dict], docs: list[dict]) -> dict:
    """Triplets + docs -> force-graph {nodes, links} (pure — unit tested)."""
    nodes: list = [{"id": "root", "name": "Knowledge Base", "group": "root", "val": 20}]
    links: list = []
    node_ids: set = {"root"}
    for doc in docs:
        doc_id = doc["id"]
        if doc_id not in node_ids:
            nodes.append({"id": doc_id,
                          "name": (doc.get("original_filename") or doc.get("filename") or doc_id),
                          "group": "document", "val": 15})
            links.append({"source": "root", "target": doc_id, "label": "contains"})
            node_ids.add(doc_id)
    for t in triplets or []:
        src = (t.get("source") or "").strip()
        tgt = (t.get("target") or "").strip()
        if not src or not tgt:
            continue
        src_id, tgt_id = f"entity_{src.lower()}", f"entity_{tgt.lower()}"
        for eid, name, typ in ((src_id, src, t.get("source_type", "Concept")),
                               (tgt_id, tgt, t.get("target_type", "Concept"))):
            if eid not in node_ids:
                nodes.append({"id": eid, "name": name,
                              "group": str(typ).lower(), "val": 8})
                node_ids.add(eid)
        links.append({"source": src_id, "target": tgt_id,
                      "label": t.get("label", "")})
    valid = {n["id"] for n in nodes}
    links = [l for l in links if l["source"] in valid and l["target"] in valid]
    return {"nodes": nodes, "links": links}
