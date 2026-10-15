"""
Shared LLM-JSON helper — multi-stage fallback chain for ingestion tasks.

Problem it solves: free-tier models intermittently return empty bodies,
safety snippets, or malformed JSON. A single strict-JSON call then collapses
to the deterministic fallback (poor mind-map quality). Instead, every
ingestion task that needs LLM JSON (outline, triplets) walks an ordered list
of stages — primary model first, then simpler prompts and cheaper models —
and returns the first parseable result. The deterministic builders remain as
the final floor, but are now reached only after all LLM stages fail.

Each attempt is logged (model, length, preview) so Render logs show exactly
which stage succeeded and what the model returned.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Callable, Optional
from loguru import logger


@dataclass
class JsonStage:
    """One attempt in the fallback chain."""
    name: str
    model: str
    system: str
    user: str
    max_tokens: int = 2048
    temperature: float = 0.2


def _is_free_model(model: str) -> bool:
    return ":free" in model or model == "openrouter/free"


async def complete_json_stages(
    stages: list[JsonStage],
    parse_fn: Callable[[str], Optional[Any]],
) -> tuple[Optional[Any], str, str]:
    """
    Try each stage in order; return (parsed, raw_of_last_attempt, model_used).

    parse_fn maps raw text -> parsed object or None (use the shared
    json_repair utilities). Never raises — exhaustion returns (None, "", "").
    """
    from app.core.generation.llm_client import _openai_client, _openrouter_headers

    if not stages:
        return None, "", ""

    client = _openai_client()
    last_raw, last_model = "", ""
    for st in stages:
        try:
            extra_kwargs: dict = {}
            if not _is_free_model(st.model):
                try:
                    extra_kwargs["response_format"] = {"type": "json_object"}
                except Exception:
                    pass
            resp = await client.chat.completions.create(
                model=st.model,
                messages=[
                    {"role": "system", "content": st.system},
                    {"role": "user", "content": st.user},
                ],
                temperature=st.temperature,
                max_tokens=st.max_tokens,
                extra_headers=_openrouter_headers(),
                **extra_kwargs,
            )
            raw = resp.choices[0].message.content or ""
            last_raw, last_model = raw, st.model
            logger.info(
                f"LLM-JSON stage={st.name} model={st.model} "
                f"len={len(raw)} preview={raw[:2000]!r}"
            )
            parsed = parse_fn(raw)
            if parsed is not None:
                logger.info(f"LLM-JSON stage={st.name} succeeded model={st.model}")
                return parsed, raw, st.model
            logger.warning(
                f"LLM-JSON stage={st.name} unparseable model={st.model} len={len(raw)}"
            )
        except Exception as e:
            logger.warning(
                f"LLM-JSON stage={st.name} failed model={st.model}: {repr(e)[:200]}"
            )
    return None, last_raw, last_model


def dedupe_models(*models: str) -> list[str]:
    """Preserve order, drop duplicates/empties (avoids retrying the same model twice)."""
    seen: list[str] = []
    for m in models:
        if m and m not in seen:
            seen.append(m)
    return seen
