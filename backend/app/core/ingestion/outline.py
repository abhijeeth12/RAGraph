"""Outline generator – LLM hierarchical mind map + deterministic fallback."""
from __future__ import annotations
import json
import re
from typing import Optional

from loguru import logger
from app.config import settings

OutlineNode = dict  # {name: str, children: [OutlineNode]}


def _dedupe_outline(outline: dict) -> dict:
    """Remove duplicate branch/leaf names and central→branch repeats. Filter emails."""
    central = (outline.get("name") or "").lower().strip()
    # Also filter central that looks like email/name truncation
    def is_bad(name: str) -> bool:
        low = name.lower().strip()
        if not low:
            return True
        if "@" in low or "gmail" in low or "yahoo" in low:
            return True
        if low == central:
            return True
        # Truncated email like abhijeethchandragimail
        if central.replace(" ", "") in low.replace(" ", "") and len(low) < len(central) + 10:
            # leaf is just mangled central+email
            return True
        if len(low) < 2:
            return True
        return False

    seen = set()
    uniq_children = []
    for ch in outline.get("children", []):
        name = (ch.get("name") or "").strip()
        if is_bad(name):
            continue
        low = name.lower()
        if low in seen:
            continue
        seen.add(low)
        leaf_seen = set()
        uniq_leaves = []
        for lf in ch.get("children", []) or []:
            lname = (lf.get("name") or "").strip()
            if is_bad(lname):
                continue
            llow = lname.lower()
            if llow == low or llow in leaf_seen or llow in seen:
                continue
            # Also skip leaves that are just email fragments
            if len(lname) < 3 or lname.count(" ") == 0 and len(lname) > 25:
                # likely truncated glue like "Abhijeethchandragimail"
                if "mail" in llow or "@" in llow:
                    continue
            leaf_seen.add(llow)
            # Title case leaves
            uniq_leaves.append({"name": lname[:36].strip()})
        ch["children"] = uniq_leaves[:4]
        # Keep branch even if leaves empty – will be filled later
        uniq_children.append(ch)
    outline["children"] = uniq_children[:6]
    return outline


def deterministic_outline_from_tree(tree) -> dict:
    """Fallback: build outline from H1→paragraph tree hierarchy."""
    from app.models.tree import NodeLevel
    import re

    title = tree.title or tree.source_filename or "Document"
    # Clean title – remove file extension, trim
    title = re.sub(r"\.(pdf|docx|pptx|txt|md)$", "", title, flags=re.I).strip()[:40]
    root: OutlineNode = {"name": title or "Document", "children": []}

    h1_nodes = [n for n in tree.nodes if n.level == NodeLevel.H1]
    # Filter H1 that equals title (common for resumes where H1 is the name)
    h1_nodes = [h for h in h1_nodes if (h.heading_path[-1] if h.heading_path else h.text[:30]).lower().strip() != title.lower().strip()]

    if not h1_nodes:
        # Try to infer sections from paragraph content – use first phrase per para
        paras = [n for n in tree.nodes if n.level == NodeLevel.PARAGRAPH][:8]
        for p in paras:
            raw = p.text
            # Strip heading prefix "[...]" and take first meaningful chunk
            raw = re.sub(r"^\[.*?\]\s*", "", raw).strip()
            # Take up to first 4 words
            label = " ".join(raw.split()[:4])
            label = re.sub(r"[^A-Za-z0-9 ]", "", label).strip()
            if len(label) >= 3:
                root["children"].append({"name": label[:36].title()})
        if not root["children"]:
            root["children"] = [{"name": "Overview"}]
        return _dedupe_outline(root)

    for h1 in h1_nodes[:6]:
        h1_name = h1.heading_path[-1] if h1.heading_path else h1.text.split("\n")[0][:40]
        h1_name = re.sub(r"^[\d\.\-\s]+", "", h1_name).strip()[:42]
        if not h1_name or h1_name.lower() == title.lower():
            continue
        h1_node: OutlineNode = {"name": h1_name, "children": []}
        h2_nodes = [n for n in tree.nodes if n.level == NodeLevel.H2 and n.parent_id == h1.id]
        for h2 in h2_nodes[:4]:
            h2_name = h2.heading_path[-1] if h2.heading_path else h2.text.split("\n")[0][:40]
            h2_name = h2_name.strip()[:40]
            if h2_name.lower() not in (h1_name.lower(), title.lower()):
                h1_node["children"].append({"name": h2_name})
        if not h1_node.get("children"):
            para_children = [n for n in tree.nodes if n.parent_id == h1.id and n.level == NodeLevel.PARAGRAPH][:3]
            for pc in para_children:
                txt = re.sub(r"^\[.*?\]\s*", "", pc.text).strip()[:36]
                if txt and txt.lower() not in (h1_name.lower(), title.lower()):
                    h1_node["children"].append({"name": txt.split(".")[0][:38]})
        if h1_node["children"] or h1_name:
            root["children"].append(h1_node)

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
    # Detect resume vs paper
    is_resume = any(kw in text.lower() for kw in ["experience", "education", "skills", "projects", "certifications", "achievements"]) and len(text) < 12000

    if is_resume:
        extra_rules = """For this RESUME/CV:
- Central name is the person (e.g., Abhijeeth Chandragi).
- Branches MUST be 4-5 thematic sections: Experience, Education, Skills, Projects, Achievements/Certifications. Use exactly these if present.
- Leaves: specific items, NEVER contact info (no emails/phones/addresses). Examples: "Evaluation Engineer @ AirDawg AI", "ML Scholar @ Amazon", "JavaScript / Express / REST", "Multiple Mappings Project".
- If a section has no data, omit it. Each leaf 2-5 words, distinct."""
    else:
        extra_rules = """For papers/reports:
- Branches: Motivation, Methodology, Key Findings, Applications etc. as appropriate."""

    prompt = f"""Analyze this document and create a hierarchical mind map outline like NotebookLM.

Document title: {clean_title}
{heading_hint}

Text excerpt (first 6000 chars):
{text[:6000]}

Return STRICTLY JSON with shape:
{{
  "name": "Central Topic (3-6 words, Title Case)",
  "children": [
    {{"name": "Branch 1", "children": [{{"name": "Leaf 1"}}, {{"name": "Leaf 2"}}]}},
    {{"name": "Branch 2", "children": [{{"name": "Leaf 1"}}]}}
  ]
}}

Critical Rules:
- 4-6 branches, each 2-4 distinct leaves. No duplicates across branches/leaves/central.
- NEVER repeat central name in branches/leaves. Each leaf distinct, no truncated emails.
- {extra_rules}
- Names concise, Title Case, 2-5 words, ≤32 chars, no punctuation, no emails.
- Leaves must be specific phrases from document content.
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
        data = _dedupe_outline(data)
        if not data["children"] or len(data["children"]) < 2:
            raise ValueError(f"Too few branches after dedup ({len(data['children'])})")
        # Ensure leaves are not empty – fill with at least 1 leaf per branch if needed
        for ch in data["children"]:
            if not ch.get("children"):
                ch["children"] = [{"name": "Overview"}]
        logger.info(f"Outline LLM generated: {data['name']} with {len(data['children'])} branches ({sum(len(c.get('children',[])) for c in data['children'])} leaves)")
        return data
    except Exception as e:
        logger.warning(f"Outline LLM failed ({repr(e)[:300]}), will use deterministic fallback")
        return None
