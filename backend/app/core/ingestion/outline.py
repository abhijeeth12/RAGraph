"""Outline generator – LLM hierarchical mind map + deterministic fallback."""
from __future__ import annotations
import json
import re
from typing import Optional

from loguru import logger
from app.config import settings

OutlineNode = dict  # {name: str, children: [OutlineNode]}


def deterministic_outline_from_tree(tree) -> dict:
    """Fallback: build outline from H1→paragraph tree hierarchy."""
    from app.models.tree import NodeLevel

    title = tree.title or tree.source_filename or "Document"
    # Root
    root: OutlineNode = {"name": title[:60], "children": []}

    h1_nodes = [n for n in tree.nodes if n.level == NodeLevel.H1]
    if not h1_nodes:
        # Use paragraph headings
        paras = [n for n in tree.nodes if n.level == NodeLevel.PARAGRAPH][:6]
        for p in paras:
            label = p.heading_path[-1] if p.heading_path else p.text[:28].strip()
            root["children"].append({"name": label[:36]})
        if not root["children"]:
            root["children"] = [{"name": "Overview"}]
        return root

    for h1 in h1_nodes[:6]:
        h1_name = h1.heading_path[-1] if h1.heading_path else h1.text.split("\n")[0][:40]
        h1_node: OutlineNode = {"name": h1_name.strip()[:42], "children": []}
        # H2 children
        h2_nodes = [n for n in tree.nodes if n.level == NodeLevel.H2 and n.parent_id == h1.id]
        for h2 in h2_nodes[:4]:
            h2_name = h2.heading_path[-1] if h2.heading_path else h2.text.split("\n")[0][:40]
            h1_node["children"].append({"name": h2_name.strip()[:40]})
        # If no H2, create 2-3 paragraph-derived leaves
        if not h1_node.get("children"):
            para_children = [n for n in tree.nodes if n.parent_id == h1.id and n.level == NodeLevel.PARAGRAPH][:3]
            for pc in para_children:
                # Extract a short phrase
                txt = pc.text.replace(f"[{''.join(pc.heading_path)}]", "").strip()[:36]
                if txt:
                    h1_node["children"].append({"name": txt.split(".")[0][:38]})
        if h1_node["children"]:
            root["children"].append(h1_node)
        else:
            root["children"].append({"name": h1_node["name"]})

    if not root["children"]:
        root["children"] = [{"name": "Overview"}]
    return root


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
        heading_hint = "Detected headings: " + "; ".join(headings[:12])

    prompt = f"""Create a hierarchical mind map outline for a knowledge graph.

Document title: {title or 'Document'}
{heading_hint}

Text excerpt (first 6000 chars):
{text[:6000]}

Return STRICTLY JSON with shape:
{{
  "name": "Central Topic (3-6 words)",
  "children": [
    {{"name": "Branch 1 (2-4 words)", "children": [{{"name": "Leaf 1"}}, {{"name": "Leaf 2"}}]}},
    {{"name": "Branch 2", "children": [{{"name": "Leaf 1"}}]}}
  ]
}}

Rules:
- 4-6 branches, each 2-4 leaves. Leaves 2-6 words, no punctuation.
- Names concise,Title Case, ≤32 chars.
- Branch names are conceptual groupings (e.g., Motivation, Methodology), leaves are specifics.
- No markdown, no explanations, only JSON.
"""

    try:
        resp = await client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": "You are NotebookLM's outline engine. Output only valid JSON outline object."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.2,
            max_tokens=800,
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
        # Validate
        if not isinstance(data, dict) or "name" not in data:
            raise ValueError("Outline missing name")
        # Normalize
        children = data.get("children") or []
        norm_children = []
        for ch in children[:6]:
            if not isinstance(ch, dict) or not ch.get("name"):
                continue
            leaves = ch.get("children") or []
            norm_leaves = []
            for lf in leaves[:4]:
                if isinstance(lf, dict) and lf.get("name"):
                    norm_leaves.append({"name": str(lf["name"])[:36].strip()})
                elif isinstance(lf, str):
                    norm_leaves.append({"name": lf[:36]})
            norm_children.append({"name": str(ch["name"])[:42].strip(), "children": norm_leaves})
        data["name"] = str(data["name"])[:56].strip()
        data["children"] = norm_children[:6]
        if not data["children"]:
            raise ValueError("Empty children after norm")
        logger.info(f"Outline LLM generated: {data['name']} with {len(data['children'])} branches")
        return data
    except Exception as e:
        logger.warning(f"Outline LLM failed ({repr(e)[:300]}), will use deterministic fallback")
        return None
