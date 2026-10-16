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

import asyncio
import random
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


def _is_rate_limited(exc: BaseException) -> bool:
    text = repr(exc).lower()
    return "429" in text or "rate limit" in text or "ratelimit" in type(exc).__name__.lower()


def _is_daily_quota_exhausted(exc: BaseException) -> bool:
    """Free-tier daily quota (free-models-per-day) — waiting cannot help today.

    Retrying against this burns quota-less calls and stalls ingestion behind
    the single-slot semaphore, so the chain must abort immediately instead.
    """
    text = repr(exc).lower()
    return (
        "per-day" in text
        or "per day" in text
        or "daily" in text and "limit" in text
        or "add 10 credits" in text
        or "free model requests" in text
    )


def _retry_after_seconds(exc: BaseException, attempt: int) -> float:
    """Honor the server's Retry-After header; otherwise exponential backoff."""
    try:
        resp = getattr(exc, "response", None)
        headers = getattr(resp, "headers", None) or {}
        ra = headers.get("retry-after") or headers.get("Retry-After")
        if ra is not None:
            return max(0.0, min(float(ra), 60.0))
    except Exception:
        pass
    return min(5.0 * (2 ** attempt), 30.0)


async def _create_with_retry(client, st: JsonStage, max_attempts: int = 3):
    """One stage with transient-429 retries. Raises the last error on exhaustion.

    Raises _DailyQuotaExhausted immediately when the free daily quota is gone —
    callers abort the whole chain instead of burning the remaining stages.
    """
    last_exc: Optional[BaseException] = None
    for attempt in range(max_attempts):
        try:
            extra_kwargs: dict = {}
            if not _is_free_model(st.model):
                try:
                    extra_kwargs["response_format"] = {"type": "json_object"}
                except Exception:
                    pass
            from app.core.generation.llm_client import _openrouter_headers
            return await client.chat.completions.create(
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
        except Exception as e:
            last_exc = e
            if _is_daily_quota_exhausted(e):
                raise _DailyQuotaExhausted(str(e)) from e
            if _is_rate_limited(e) and attempt < max_attempts - 1:
                wait = _retry_after_seconds(e, attempt) + random.uniform(0, 1.0)
                logger.warning(
                    f"LLM-JSON stage={st.name} rate-limited "
                    f"(attempt {attempt + 1}/{max_attempts}), retrying in {wait:.1f}s"
                )
                await asyncio.sleep(wait)
                continue
            raise
    assert last_exc is not None
    raise last_exc


class _DailyQuotaExhausted(Exception):
    """Marker: free daily quota gone — further stages cannot succeed today."""


async def complete_json_stages(
    stages: list[JsonStage],
    parse_fn: Callable[[str], Optional[Any]],
) -> tuple[Optional[Any], str, str]:
    """
    Try each stage in order; return (parsed, raw_of_last_attempt, model_used).

    parse_fn maps raw text -> parsed object or None (use the shared
    json_repair utilities). Never raises — exhaustion returns (None, "", "").
    """
    from app.core.generation.llm_client import _openai_client

    if not stages:
        return None, "", ""

    client = _openai_client()
    last_raw, last_model = "", ""
    for st in stages:
        try:
            resp = await _create_with_retry(client, st)
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
        except _DailyQuotaExhausted as e:
            logger.error(
                f"LLM-JSON daily free quota exhausted at stage={st.name} "
                f"model={st.model} — aborting remaining stages. "
                f"Quota resets daily; or add OpenRouter credits. ({str(e)[:160]})"
            )
            return None, last_raw, last_model
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
