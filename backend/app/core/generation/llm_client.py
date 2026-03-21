from __future__ import annotations
import asyncio
import json
from typing import AsyncGenerator, Optional
from loguru import logger

from app.core.generation.context_builder import BuiltContext
from app.config import settings


def _openai_client():
    from openai import AsyncOpenAI
    return AsyncOpenAI(
        api_key=settings.openai_api_key,
        base_url=settings.openai_base_url,
    )


def _openrouter_headers() -> dict:
    if settings.using_openrouter:
        return {
            "HTTP-Referer": "https://ragraph.dev",
            "X-Title": "RAGraph",
        }
    return {}


async def stream_answer(
    context: BuiltContext,
    model: str,
    image_base64: Optional[str] = None,
) -> AsyncGenerator[str, None]:
    if settings.openai_api_key:
        # Always use the configured generation model (free or paid)
        resolved = settings.resolve_generation_model()
        async for delta in _stream_openai(context, resolved, image_base64):
            yield delta
    elif settings.anthropic_api_key and "claude" in model:
        async for delta in _stream_anthropic(context, model, image_base64):
            yield delta
    else:
        for word in _fallback_answer(context).split(" "):
            await asyncio.sleep(0.015)
            yield word + " "


async def _stream_openai(
    context: BuiltContext,
    model: str,
    image_base64: Optional[str] = None,
) -> AsyncGenerator[str, None]:
    client = _openai_client()

    # Vision only works with paid models, not free tier
    if image_base64 and not settings.using_openrouter:
        user_content = [
            {"type": "image_url", "image_url": {
                "url": "data:image/jpeg;base64," + image_base64,
                "detail": "high",
            }},
            {"type": "text", "text": context.user_message},
        ]
    else:
        user_content = context.user_message

    # Free models on OpenRouter have lower context limits
    # Use smaller max_tokens to stay within limits
    is_free = ":free" in model
    max_tok = 1500 if is_free else 3000

    logger.debug(f"LLM: model={model} max_tokens={max_tok} free={is_free}")

    try:
        stream = await client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": context.system_prompt},
                {"role": "user",   "content": user_content},
            ],
            max_tokens=max_tok,
            temperature=0.3,
            stream=True,
            extra_headers=_openrouter_headers(),
        )
        async for chunk in stream:
            delta = chunk.choices[0].delta.content
            if delta:
                yield delta
    except Exception as e:
        err_str = str(e)
        if "402" in err_str or "credits" in err_str.lower():
            logger.error("OpenRouter credits exhausted — switching to fallback")
            yield ("\n\n**Note**: OpenRouter credits exhausted. "
                   "Using fallback response from retrieved context.\n\n")
            for word in _fallback_answer(context).split(" "):
                await asyncio.sleep(0.01)
                yield word + " "
        else:
            logger.error("OpenAI/OpenRouter stream error: {}", repr(e))
            yield "\n\n[Error generating answer: " + repr(e) + "]"


async def _stream_anthropic(
    context: BuiltContext,
    model: str,
    image_base64: Optional[str] = None,
) -> AsyncGenerator[str, None]:
    import anthropic
    client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)
    user_content = context.user_message
    if image_base64:
        user_content = [
            {"type": "image", "source": {
                "type": "base64", "media_type": "image/jpeg",
                "data": image_base64,
            }},
            {"type": "text", "text": context.user_message},
        ]
    try:
        async with client.messages.stream(
            model="claude-3-5-sonnet-20241022",
            max_tokens=2000,
            system=context.system_prompt,
            messages=[{"role": "user", "content": user_content}],
        ) as stream:
            async for delta in stream.text_stream:
                yield delta
    except Exception as e:
        logger.error("Anthropic stream error: {}", repr(e))
        yield "\n\n[Error: " + repr(e) + "]"


async def generate_related_questions(
    query: str,
    answer: str,
    headings: list[str],
) -> list[str]:
    if not settings.openai_api_key and not settings.anthropic_api_key:
        return _heading_based_questions(headings)

    prompt = (
        "Generate exactly 3 short follow-up questions for:\n"
        "Question: " + query + "\n"
        "Answer summary: " + answer[:200] + "\n\n"
        "Return a JSON array of 3 strings only. No explanation."
    )
    try:
        client = _openai_client()
        response = await client.chat.completions.create(
            model=settings.resolve_cheap_model(),
            messages=[{"role": "user", "content": prompt}],
            max_tokens=150,
            temperature=0.7,
            extra_headers=_openrouter_headers(),
        )
        raw = response.choices[0].message.content.strip()
        raw = raw.replace("```json", "").replace("```", "").strip()
        questions = json.loads(raw)
        if isinstance(questions, list):
            return [str(q) for q in questions[:3]]
    except Exception as e:
        logger.warning("Related questions failed: {}", repr(e))
    return _heading_based_questions(headings)


def _heading_based_questions(headings: list[str]) -> list[str]:
    questions = [f"Tell me more about {h}" for h in headings[:3]]
    if not questions:
        questions = [
            "What are the main findings?",
            "Can you summarize the key points?",
            "What methods were used?",
        ]
    return questions


def _fallback_answer(context: BuiltContext) -> str:
    if not context.citation_map:
        return (
            "No relevant content found. "
            "Please upload documents and ensure your API key is configured."
        )
    parts = []
    for i, chunk in context.citation_map.items():
        heading = chunk.heading_path[-1] if chunk.heading_path else "Section"
        parts.append(f"**[{i}] {heading}**\n{chunk.text[:400]}")
    return (
        "Based on the retrieved document content:\n\n"
        + "\n\n".join(parts)
        + "\n\n*AI generation unavailable — showing raw retrieved content.*"
    )
