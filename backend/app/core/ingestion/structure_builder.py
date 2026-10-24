"""
Document Structure Builder.

Extracts and preserves the exact document hierarchy (Document -> H1 -> H2 -> H3 -> Paragraphs / Tables / Images)
directly from the ingestion pipeline without any LLM hallucination or conceptual inference.
"""
from __future__ import annotations
import json
import os
import re
from typing import Optional, List, Dict, Any
from loguru import logger

from app.models.tree import DocumentTree, TreeNode, ImageNode, NodeLevel
from app.config import settings


def clean_node_preview(text: str, max_chars: int = 48) -> str:
    """Clean text snippet for node badge display."""
    if not text:
        return ""
    # Strip leading markdown tags or heading brackets like [Section > Subsection]
    cleaned = re.sub(r"^\[.*?\]\s*", "", text).strip()
    # Strip leading markdown heading markers (#, ##, etc.) and bullets (-, *, +)
    cleaned = re.sub(r"^[#\*\-\+\>\s]+", "", cleaned).strip()
    # Strip trailing markdown heading markers or horizontal rule fragments (---, ===, ###)
    cleaned = re.sub(r"[\s\-\=\#\*\_]+$", "", cleaned).strip()
    # Strip bold/italic markdown markers
    cleaned = re.sub(r"\*\*([^*]+)\*\*", r"\1", cleaned)
    cleaned = re.sub(r"\*([^*]+)\*", r"\1", cleaned)
    # Normalize whitespace
    cleaned = " ".join(cleaned.split())
    if len(cleaned) <= max_chars:
        return cleaned
    return cleaned[:max_chars].rstrip() + "…"


def tree_to_document_structure(tree: DocumentTree) -> dict:
    """
    Transform DocumentTree into a hierarchical Document Structure dictionary.
    
    Preserves:
      - Actual heading hierarchy (Document -> H1 -> H2 -> H3)
      - Paragraph associations under their parent sections
      - Tables with element_kind="table"
      - Figures / Images with element_kind="image" and page numbers
      - Page references on all nodes
    """
    title = tree.title or tree.source_filename or "Document"
    clean_title = re.sub(r"\.(pdf|docx|pptx|txt|md)$", "", title, flags=re.I).strip() or "Document"

    # Map nodes by id and collect children by parent_id
    by_id: Dict[str, TreeNode] = {n.id: n for n in tree.nodes}
    children_by_parent: Dict[str, List[TreeNode]] = {}
    
    root_node: Optional[TreeNode] = None
    for n in tree.nodes:
        if n.level == NodeLevel.DOCUMENT or n.parent_id is None:
            if root_node is None:
                root_node = n
        p_id = n.parent_id or "ROOT"
        if p_id not in children_by_parent:
            children_by_parent[p_id] = []
        children_by_parent[p_id].append(n)

    root_id = root_node.id if root_node else (tree.nodes[0].id if tree.nodes else "root")

    # Map images to parent heading/section if possible (only when image functionality is enabled)
    images_by_parent: Dict[str, List[ImageNode]] = {}
    if settings.enable_images:
        for img in getattr(tree, "images", []) or []:
            # Find nearest heading in tree.nodes if available
            matched_parent_id = None
            if img.heading_path:
                target_path = img.heading_path
                for n in tree.nodes:
                    if n.heading_path == target_path and n.level in (NodeLevel.H1, NodeLevel.H2, NodeLevel.H3):
                        matched_parent_id = n.id
                        break
            if not matched_parent_id:
                matched_parent_id = root_id
            if matched_parent_id not in images_by_parent:
                images_by_parent[matched_parent_id] = []
            images_by_parent[matched_parent_id].append(img)

    def build_node_dict(n: TreeNode) -> dict:
        is_heading = n.level in (NodeLevel.H1, NodeLevel.H2, NodeLevel.H3)
        is_table = n.element_kind == "table" or (isinstance(n.text, str) and n.text.strip().startswith("|"))
        kind = "heading" if is_heading else ("table" if is_table else (n.element_kind or "paragraph"))
        
        # Display name
        if is_heading:
            if n.heading_path:
                display_name = n.heading_path[-1].strip()
            else:
                display_name = n.text.split("\n")[0].strip()
            # Clean leading markdown heading symbols or bullets
            display_name = re.sub(r"^[#\*\-\+\>\s]+", "", display_name).strip()
        elif is_table:
            display_name = "Table"
        else:
            snippet = clean_node_preview(n.text, 44)
            display_name = snippet if snippet else "Paragraph"

        # Full text content (clean heading prefix from paragraphs)
        raw_text = n.text or ""
        clean_full_text = re.sub(r"^\[.*?\]\s*", "", raw_text) if not is_heading else raw_text

        child_nodes: List[dict] = []
        # Add heading / paragraph children
        for ch in children_by_parent.get(n.id, []):
            child_nodes.append(build_node_dict(ch))

        # Add images associated with this heading
        for img in images_by_parent.get(n.id, []):
            label = img.fig_label or (img.caption[:36] if img.caption else f"Figure (p. {img.page_number})")
            child_nodes.append({
                "id": img.id,
                "name": label,
                "level": "image",
                "element_kind": "image",
                "page_number": img.page_number,
                "image_url": img.storage_url,
                "caption": img.caption,
                "text": img.caption or img.alt_text or f"Figure on page {img.page_number}",
                "doc_id": tree.doc_id,
            })

        out = {
            "id": n.id,
            "name": display_name,
            "level": str(n.level),
            "element_kind": kind,
            "page_number": n.page_number,
            "heading_path": n.heading_path,
            "token_count": n.token_count,
            "doc_id": tree.doc_id,
            "text": clean_full_text,
        }
        if child_nodes:
            out["children"] = child_nodes
        return out

    # Build direct children of the document root
    root_children_tree = children_by_parent.get(root_id, [])
    # If root_node is among them, avoid cycle
    direct_children = [build_node_dict(ch) for ch in root_children_tree if ch.id != root_id]

    # Also add root-level images
    for img in images_by_parent.get(root_id, []):
        label = img.fig_label or (img.caption[:36] if img.caption else f"Figure (p. {img.page_number})")
        direct_children.append({
            "id": img.id,
            "name": label,
            "level": "image",
            "element_kind": "image",
            "page_number": img.page_number,
            "image_url": img.storage_url,
            "caption": img.caption,
            "text": img.caption or img.alt_text or f"Figure on page {img.page_number}",
            "doc_id": tree.doc_id,
        })

    root_dict = {
        "id": f"doc_{tree.doc_id}",
        "name": clean_title,
        "level": "document",
        "element_kind": "document",
        "page_number": 1,
        "total_pages": tree.total_pages,
        "filename": tree.source_filename,
        "doc_id": tree.doc_id,
        "text": f"Document: {clean_title}\nPages: {tree.total_pages}\nFilename: {tree.source_filename}",
        "children": direct_children,
    }
    return root_dict


def combine_document_structures(structures: List[dict], notebook_title: str = "") -> dict:
    """
    Merge multiple document structures under a single view.
    If 1 document: returns that document's structure root directly.
    If multiple: returns a notebook root with each document as a major child branch.
    """
    if not structures:
        return {
            "id": "root",
            "name": notebook_title or "Document Structure",
            "level": "document",
            "element_kind": "document",
            "children": [],
        }
    if len(structures) == 1:
        return structures[0]

    return {
        "id": "notebook_root",
        "name": f"Notebook: {notebook_title}" if notebook_title else "Documents",
        "level": "document",
        "element_kind": "document",
        "children": structures,
    }


async def get_or_build_document_structure(
    doc: dict,
    owner_id: str,
) -> Optional[dict]:
    """
    Retrieve stored document structure from PostgreSQL or local cache.
    If not yet stored (e.g. ingested before this feature), builds it deterministically
    from Qdrant points or local file without running any LLM calls, then persists it.
    """
    from app.services.db_service import db_service
    from app.config import settings

    doc_id = doc["id"]

    # 1. Check PostgreSQL structure_json
    try:
        raw_db = await db_service.get_document_structure_data(doc_id)
        if raw_db:
            data = json.loads(raw_db)
            if data and data.get("name"):
                return data
    except Exception as e:
        logger.debug(f"DB structure read error for doc {doc_id}: {e}")

    # 2. Check local file cache
    storage_path = doc.get("storage_path") or ""
    if settings.cache_enabled and storage_path:
        cache_path = storage_path + "_structure.json"
        if os.path.exists(cache_path):
            try:
                with open(cache_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                if data and data.get("name"):
                    # Cache back to DB
                    try:
                        await db_service.update_document_structure(doc_id, json.dumps(data, ensure_ascii=False))
                    except Exception:
                        pass
                    return data
            except Exception as e:
                logger.debug(f"Local structure cache read failed for {doc_id}: {e}")

    # 3. Fallback: Reconstruct from Qdrant points (deterministic, no parse, no LLM)
    try:
        from qdrant_client.models import Filter, FieldCondition, MatchValue
        from app.services.qdrant_service import qdrant_service

        scroll_filter = Filter(must=[
            FieldCondition(key="doc_id", match=MatchValue(value=doc_id)),
        ])
        points, _ = await qdrant_service._client.scroll(
            collection_name=settings.qdrant_text_collection,
            scroll_filter=scroll_filter,
            limit=500,
            with_payload=True,
            with_vectors=False,
        )

        if points:
            title = doc.get("original_filename") or doc.get("filename") or "Document"
            clean_title = re.sub(r"\.(pdf|docx|pptx|txt|md)$", "", title, flags=re.I).strip()
            
            # Reconstruct TreeNodes from payload
            nodes: List[TreeNode] = []
            for pt in points:
                p = pt.payload or {}
                lvl = p.get("level", "paragraph")
                try:
                    level_enum = NodeLevel(lvl)
                except Exception:
                    level_enum = NodeLevel.PARAGRAPH

                nodes.append(TreeNode(
                    id=str(pt.id),
                    owner_id=p.get("owner_id", owner_id),
                    doc_id=doc_id,
                    level=level_enum,
                    parent_id=p.get("parent_id"),
                    section_id=p.get("section_id"),
                    heading_path=p.get("heading_path") or [],
                    text=p.get("text") or "",
                    element_kind=p.get("element_kind") or ("heading" if lvl in ("h1", "h2", "h3") else "paragraph"),
                    page_number=p.get("page_number"),
                    token_count=p.get("token_count", 0),
                ))

            # Build dummy DocumentTree
            dt = DocumentTree(
                owner_id=owner_id,
                doc_id=doc_id,
                title=clean_title,
                source_filename=doc.get("original_filename") or doc.get("filename") or "Document",
                total_pages=doc.get("page_count") or 1,
                nodes=nodes,
            )
            structure = tree_to_document_structure(dt)
            # Persist to DB for future requests
            try:
                await db_service.update_document_structure(doc_id, json.dumps(structure, ensure_ascii=False))
            except Exception:
                pass
            return structure
    except Exception as qe:
        logger.debug(f"Qdrant reconstruction failed for doc {doc_id}: {qe}")

    # 4. Fallback: Parse local file if it still exists (0 LLM calls)
    if storage_path and os.path.exists(storage_path):
        try:
            from app.core.ingestion.parser import parse_document
            from app.core.ingestion.tree_builder import build_tree
            from app.core.ingestion.figure_resolver import resolve_figures
            from app.services import storage_service as store
            import asyncio

            parse_path = store.ensure_local(storage_path)
            parsed = await asyncio.to_thread(parse_document, parse_path, doc_id)
            tree = await asyncio.to_thread(build_tree, owner_id, parsed)
            tree = await asyncio.to_thread(resolve_figures, tree)
            structure = tree_to_document_structure(tree)
            del parsed, tree
            from app.utils.memory import trim_memory
            trim_memory()

            try:
                await db_service.update_document_structure(doc_id, json.dumps(structure, ensure_ascii=False))
            except Exception:
                pass
            return structure
        except Exception as pe:
            logger.warning(f"File parse fallback failed for doc {doc_id}: {pe}")

    return None
