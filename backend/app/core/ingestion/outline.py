"""Outline generator – LLM hierarchical mind map + deterministic fallback."""
from __future__ import annotations
import json
import re
from typing import Optional

from loguru import logger
from app.config import settings

OutlineNode = dict  # {name: str, children: [OutlineNode]}


def _is_bad_name(name: str, central: str, seen: set) -> bool:
    low = (name or "").lower().strip()
    if not low or len(low) < 2:
        return True
    if "@" in low or "gmail" in low or "yahoo" in low:
        return True
    if low == central:
        return True
    if central and central.replace(" ", "") in low.replace(" ", "") and len(low) < len(central) + 10:
        return True
    if len(name) < 3 and " " not in name and len(name) > 25 and "mail" in low:
        return True
    return False

def _dedupe_recursive(node: dict, central: str, seen: set) -> dict | None:
    name = (node.get("name") or "").strip()[:42]
    if not name or _is_bad_name(name, central, seen):
        return None
    low = name.lower()
    if low in seen:
        return None
    seen.add(low)
    children = node.get("children") or []
    new_children = []
    for ch in children:
        res = _dedupe_recursive(ch, central, seen)
        if res:
            new_children.append(res)
    # Title-case leaves
    out = {"name": name}
    if new_children:
        out["children"] = new_children[:6]
    return out

def _dedupe_outline(outline: dict) -> dict:
    """Recursive dedupe, filters emails/truncation, preserves arbitrary depth."""
    central = (outline.get("name") or "").lower().strip()
    seen: set = set()
    # Don't add central to seen yet so children can be checked against it via _is_bad
    new_children = []
    for ch in outline.get("children", []) or []:
        res = _dedupe_recursive(ch, central, seen)
        if res:
            new_children.append(res)
    outline["children"] = new_children[:6]
    return outline

def _normalize_recursive(node: dict, depth: int = 0) -> dict | None:
    if not isinstance(node, dict) or not node.get("name"):
        return None
    name = str(node["name"]).strip()[:42 if depth>0 else 56]
    if not name:
        return None
    children = node.get("children") or []
    norm_children = []
    for ch in children[:8]:
        if isinstance(ch, dict):
            sub = _normalize_recursive(ch, depth+1)
            if sub:
                norm_children.append(sub)
        elif isinstance(ch, str) and ch.strip():
            norm_children.append({"name": ch.strip()[:36]})
    out: dict = {"name": name}
    if norm_children:
        out["children"] = norm_children[:6]
    return out


def deterministic_outline_from_tree(tree) -> dict:
    """Recursive deterministic fallback – mirrors H1→H2→H3→para hierarchy."""
    from app.models.tree import NodeLevel
    import re

    title = tree.title or tree.source_filename or "Document"
    title = re.sub(r"\.(pdf|docx|pptx|txt|md)$", "", title, flags=re.I).strip()[:40] or "Document"
    root: OutlineNode = {"name": title, "children": []}

    # Build id→node map for hierarchy walk
    by_id = {n.id: n for n in tree.nodes}
    # H1s that are not the title
    h1_nodes = [n for n in tree.nodes if n.level == NodeLevel.H1 and (n.heading_path[-1] if n.heading_path else n.text[:30]).lower().strip() != title.lower().strip()]

    def build_subtree(parent_id: str) -> list[dict]:
        children = [n for n in tree.nodes if n.parent_id == parent_id]
        # Prefer H2/H3 headings first, then paras
        heading_children = [n for n in children if n.level in (NodeLevel.H2, NodeLevel.H3)]
        para_children = [n for n in children if n.level == NodeLevel.PARAGRAPH]
        out = []
        for h in heading_children[:6]:
            h_name = h.heading_path[-1] if h.heading_path else h.text.split("\n")[0][:40]
            h_name = re.sub(r"^[\d\.\-\s]+", "", h_name).strip()[:42]
            if not h_name or h_name.lower() == title.lower():
                continue
            sub = build_subtree(h.id)
            if not sub:
                # Use paras under this heading as leaves
                for pc in para_children[:2]:
                    txt = re.sub(r"^\[.*?\]\s*", "", pc.text).strip()[:36]
                    if txt:
                        sub.append({"name": txt.split(".")[0][:36]})
            out.append({"name": h_name, "children": sub[:4]} if sub else {"name": h_name})
        if not out:
            for pc in para_children[:4]:
                raw = re.sub(r"^\[.*?\]\s*", "", pc.text).strip()
                label = " ".join(raw.split()[:5])
                label = re.sub(r"[^A-Za-z0-9 ]", " ", label).strip()
                if len(label) >= 3:
                    out.append({"name": label[:36].title()})
        return out[:6]

    if h1_nodes:
        for h1 in h1_nodes[:6]:
            h1_name = h1.heading_path[-1] if h1.heading_path else h1.text.split("\n")[0][:40]
            h1_name = re.sub(r"^[\d\.\-\s]+", "", h1_name).strip()[:42]
            if not h1_name or h1_name.lower() == title.lower():
                continue
            subtree = build_subtree(h1.id)
            root["children"].append({"name": h1_name, "children": subtree} if subtree else {"name": h1_name})
    else:
        # No H1 – build from paras directly but group into 3-4 branches
        paras = [n for n in tree.nodes if n.level == NodeLevel.PARAGRAPH][:12]
        for i in range(0, len(paras), 3):
            chunk = paras[i:i+3]
            if not chunk:
                continue
            first = re.sub(r"^\[.*?\]\s*", "", chunk[0].text).strip()
            branch_name = " ".join(first.split()[:4])
            branch_name = re.sub(r"[^A-Za-z0-9 ]", " ", branch_name).strip()[:36].title() or f"Section {i//3+1}"
            leaves = []
            for p in chunk[1:3]:
                raw = re.sub(r"^\[.*?\]\s*", "", p.text).strip()
                lab = " ".join(raw.split()[:5])
                lab = re.sub(r"[^A-Za-z0-9 ]", " ", lab).strip()
                if lab:
                    leaves.append({"name": lab[:36].title()})
            root["children"].append({"name": branch_name, "children": leaves})

    if not root["children"]:
        root["children"] = [{"name": "Overview"}]
    return _dedupe_outline(root)


async def generate_outline(text: str, headings: list[str], title: Optional[str] = None) -> dict:
    """LLM hierarchical outline. Falls back to deterministic if no key or parse fails."""
    if not settings.openai_api_key:
        logger.info("Outline: no API key, using deterministic")
        return None  # caller will fallback

    from app.core.generation.llm_client import _openai_client, _openrouter_headers
    client = _openai_client()
    model = settings.resolve_generation_model()

    heading_hint = ""
    if headings:
        # Filter headings that are just the title or email-like
        filtered = [h for h in headings[:12] if "@" not in h and len(h) < 60 and h.lower().strip() != (title or "").lower().strip()]
        if filtered:
            heading_hint = "Detected headings: " + "; ".join(filtered)

    clean_title = (title or "Document")[:60]
    prompt = f"""Analyze this document and create a hierarchical mind map. Let the document itself decide the structure — infer the most natural grouping from its content.

Document title: {clean_title}
{heading_hint}

Text excerpt (first 6000 chars):
{text[:6000]}

Return STRICTLY JSON. The structure is recursive — any node may have children, allowing arbitrary depth (the LLM decides how deep/wide based on the document):

{{
  "name": "Central Topic",
  "children": [
    {{ "name": "Topic A", "children": [{{ "name": "Subtopic A1" }}, {{ "name": "Subtopic A2", "children": [{{ "name": "Detail" }}] }}] }},
    {{ "name": "Topic B" }}
  ]
}}

Rules:
- Infer the central topic from the document (not necessarily the filename).
- Create as many expandable branches as the content naturally supports — each branch with children becomes expandable (<>), leaves are endpoints.
- No duplicates: central, branches, and leaves must all have distinct names (case-insensitive).
- No contact noise: never use raw emails/phones; if present, abstract them (e.g., not "abhijeeth@gmail.com").
- Names concise, Title Case, 2-5 words, ≤32 chars, no trailing punctuation.
- Prefer specific phrases from the document over generic labels.
- No markdown, only JSON.
"""

    try:
        resp = await client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": "You are NotebookLM's outline engine. Output only valid JSON outline object."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.2,
            max_tokens=1200,
            extra_headers=_openrouter_headers(),
        )
        content = resp.choices[0].message.content or ""
        content = content.strip()
        # fence
        m = re.search(r"```(?:json)?\s*(.*?)\s*```", content, re.DOTALL)
        if m:
            content = m.group(1).strip()
        # Extract first JSON object
        if not content.startswith("{"):
            obj_m = re.search(r"\{.*\}", content, re.DOTALL)
            if obj_m:
                content = obj_m.group(0)
        # Remove trailing commas before } ]
        content = re.sub(r",\s*([\}\]])", r"\1", content)
        data = json.loads(content)
        if not isinstance(data, dict) or "name" not in data:
            raise ValueError("Outline missing name")
        norm = _normalize_recursive(data)
        if not norm or not norm.get("children"):
            raise ValueError("Empty after normalize")
        norm = _dedupe_outline(norm)
        if not norm.get("children") or len(norm["children"]) < 2:
            raise ValueError(f"Too few branches after dedup ({len(norm.get('children',[]))})")
        # Ensure every expandable has at least 1 child for UX
        def ensure_leaves(n: dict):
            if n.get("children"):
                for ch in n["children"]:
                    ensure_leaves(ch)
            elif n is not norm:  # not root
                # leaf placeholder only if branch would be empty expandable
                pass
        for ch in norm["children"]:
            if ch.get("children") is not None and not ch["children"]:
                ch["children"] = [{"name": "Details"}]
        # Limit breadth to keep render sane
        def cap_breadth(n: dict, depth: int):
            if n.get("children"):
                n["children"] = n["children"][: 6 if depth==0 else 4]
                for ch in n["children"]:
                    cap_breadth(ch, depth+1)
        cap_breadth(norm, 0)
        logger.info(f"Outline LLM generated: {norm['name']} with {len(norm['children'])} branches")
        return norm
    except Exception as e:
        logger.warning(f"Outline LLM failed ({repr(e)[:300]}), will use deterministic fallback")
        return None
