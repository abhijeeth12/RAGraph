"""
JSON repair utilities for LLM response parsing.

Handles the common failure modes of LLM-generated JSON:
  1. Markdown code fences (```json ... ```)
  2. Prose before/after the JSON object
  3. Greedy regex over-capture (Extra data errors)
  4. Truncated output (max_tokens hit mid-JSON)
  5. Trailing commas before ] or }

Usage:
    from app.utils.json_repair import extract_json_object, repair_truncated_triplets

    obj = extract_json_object(llm_response)
    if obj is None:
        # parse failed entirely — use fallback
        ...
"""
from __future__ import annotations

import json
import re
from typing import Optional

from loguru import logger


# ── Fence stripping ────────────────────────────────────────────────────────────

def strip_fences(content: str) -> str:
    """Remove ```json ... ``` or ``` ... ``` code fences."""
    content = content.strip()
    m = re.search(r"```(?:json)?\s*(.*?)\s*```", content, re.DOTALL)
    if m:
        return m.group(1).strip()
    return content


# ── Brace-counting extractor ───────────────────────────────────────────────────

def extract_first_json_object(content: str) -> Optional[str]:
    """
    Extract the first complete JSON object from content using brace counting.

    Unlike re.search(r"\\{.*\\}", ..., re.DOTALL) this is NOT greedy —
    it stops at the exact closing brace that balances the opening one,
    ignoring any trailing text or additional JSON objects.

    Returns the raw JSON string (not parsed), or None if no complete object found.
    """
    start = content.find("{")
    if start == -1:
        return None

    depth = 0
    in_string = False
    escape_next = False

    for i, ch in enumerate(content[start:], start):
        if escape_next:
            escape_next = False
            continue
        if ch == "\\" and in_string:
            escape_next = True
            continue
        if ch == '"':
            in_string = not in_string
            continue
        if in_string:
            continue
        if ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                return content[start : i + 1]

    # Incomplete object (truncated) — return everything from start
    # so repair_truncated_* can attempt recovery
    return content[start:] if depth > 0 else None


def extract_first_json_array(content: str) -> Optional[str]:
    """
    Extract the first complete JSON array from content using bracket counting.
    """
    start = content.find("[")
    if start == -1:
        return None

    depth = 0
    in_string = False
    escape_next = False

    for i, ch in enumerate(content[start:], start):
        if escape_next:
            escape_next = False
            continue
        if ch == "\\" and in_string:
            escape_next = True
            continue
        if ch == '"':
            in_string = not in_string
            continue
        if in_string:
            continue
        if ch == "[":
            depth += 1
        elif ch == "]":
            depth -= 1
            if depth == 0:
                return content[start : i + 1]

    return content[start:] if depth > 0 else None


# ── Trailing comma removal ─────────────────────────────────────────────────────

def strip_trailing_commas(s: str) -> str:
    """Remove trailing commas before ] or } (common LLM mistake)."""
    return re.sub(r",\s*([\]}])", r"\1", s)


# ── Truncation repair for triplets wrapper ────────────────────────────────────

def repair_truncated_triplets(content: str) -> str:
    """
    Attempt to salvage a truncated {"triplets": [...]} response.

    Strategy:
      1. Find the last complete triplet object (ends with `},` or `}` before `]`)
      2. Truncate after it and close the array + wrapper object
      3. If no complete triplet found, return '{"triplets": []}'

    This avoids the previous bug of using rfind("}") which finds the brace
    *inside* the last incomplete triplet and produces invalid nested structure.
    """
    # Strip trailing commas first
    cleaned = strip_trailing_commas(content)

    # If it already ends properly, return as-is
    stripped = cleaned.rstrip()
    if stripped.endswith("]}"):
        return cleaned

    # Find the last position of },  (end of a complete inner object in array)
    # We look for `}` followed by optional whitespace then `,` or `]` or `}`
    # The safest heuristic: find the last `},` (complete object in the array)
    last_complete = cleaned.rfind("},")
    if last_complete != -1:
        # Truncate after the closing brace of the last complete triplet
        repaired = cleaned[: last_complete + 1] + "]}"
        logger.debug("Repaired truncated triplets JSON: kept up to last complete object")
        return repaired

    # No complete triplet at all — return empty
    logger.debug("No complete triplets found in truncated response, returning empty")
    return '{"triplets": []}'


# ── High-level parse helpers ───────────────────────────────────────────────────

def parse_json_object(content: str) -> Optional[dict]:
    """
    Full pipeline: strip fences → extract first object → strip trailing commas → parse.

    Returns parsed dict on success, None on any failure (never raises).
    """
    if not content or not content.strip():
        return None

    try:
        content = strip_fences(content)

        # Try direct parse first (happy path)
        try:
            result = json.loads(content)
            if isinstance(result, dict):
                return result
        except json.JSONDecodeError:
            pass

        # Extract first complete object
        raw = extract_first_json_object(content)
        if not raw:
            return None

        # Strip trailing commas and try again
        raw = strip_trailing_commas(raw)
        result = json.loads(raw)
        return result if isinstance(result, dict) else None

    except Exception as e:
        logger.debug(f"parse_json_object failed: {e!r}")
        return None


def parse_triplets_response(content: str) -> Optional[list]:
    """
    Parse an LLM response that should contain a list of triplets.

    Accepts both:
      - {"triplets": [...]}  (preferred)
      - [...]                (bare array — some models ignore the wrapper)

    Returns list of dicts, or None if completely unparseable.
    Applies truncation repair when needed.
    """
    if not content or not content.strip():
        return None

    try:
        content = strip_fences(content)

        # --- Attempt 1: direct parse ---
        try:
            data = json.loads(content)
            return _unwrap_triplets(data)
        except json.JSONDecodeError as e:
            logger.debug(f"Direct triplets parse failed at char {e.pos}: {e.msg}")

        # --- Attempt 2: extract first JSON object ---
        obj_raw = extract_first_json_object(content)
        if obj_raw:
            obj_raw = strip_trailing_commas(obj_raw)
            try:
                data = json.loads(obj_raw)
                return _unwrap_triplets(data)
            except json.JSONDecodeError:
                pass

        # --- Attempt 3: extract first JSON array ---
        arr_raw = extract_first_json_array(content)
        if arr_raw:
            arr_raw = strip_trailing_commas(arr_raw)
            try:
                data = json.loads(arr_raw)
                if isinstance(data, list):
                    return data
            except json.JSONDecodeError:
                pass

        # --- Attempt 4: truncation repair ---
        start = content.find("{")
        if start != -1:
            repaired = repair_truncated_triplets(content[start:])
            try:
                data = json.loads(repaired)
                result = _unwrap_triplets(data)
                if result is not None:
                    logger.info(f"Recovered {len(result)} triplets via truncation repair")
                    return result
            except json.JSONDecodeError:
                pass

        logger.warning("All triplets parse attempts failed — returning empty")
        return []

    except Exception as e:
        logger.debug(f"parse_triplets_response unexpected error: {e!r}")
        return []


def _unwrap_triplets(data) -> Optional[list]:
    """Unwrap {"triplets": [...]} or bare [...] into a list."""
    if isinstance(data, dict) and "triplets" in data:
        val = data["triplets"]
        return val if isinstance(val, list) else None
    if isinstance(data, list):
        return data
    return None
