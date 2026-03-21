"""
Context Builder — assembles the LLM prompt from retrieved chunks.

Responsibilities:
  1. Token budget management (stay within context window)
  2. Citation mapping: [1], [2], [3] → source items
  3. Conversation history injection (multi-turn)
  4. Image context injection (for vision queries)
  5. System prompt construction
"""
from __future__ import annotations
from dataclasses import dataclass, field
from typing import Optional
import tiktoken
from loguru import logger

from app.core.retrieval.tree_retriever import RetrievedChunk
from app.core.retrieval.image_retriever import RetrievedImage
from app.models.search import ConversationMessage

# Token budgets
SYSTEM_PROMPT_TOKENS   = 400
CONTEXT_BUDGET_TOKENS  = 8000   # chunks + images
HISTORY_BUDGET_TOKENS  = 1500   # conversation history
ANSWER_RESERVE_TOKENS  = 3000   # reserved for LLM answer
MAX_CONTEXT_TOKENS     = SYSTEM_PROMPT_TOKENS + CONTEXT_BUDGET_TOKENS + HISTORY_BUDGET_TOKENS

_enc = tiktoken.get_encoding("cl100k_base")

def _count(text: str) -> int:
    return len(_enc.encode(text))


@dataclass
class BuiltContext:
    system_prompt: str
    user_message: str
    citation_map: dict[int, RetrievedChunk]   # citation number -> chunk
    image_urls: list[str]                      # for vision pass-through
    total_tokens: int


SYSTEM_PROMPT = """You are RAGraph, an intelligent research assistant powered by hierarchical RAG.
You answer questions based strictly on the provided document context.

Rules:
1. Cite sources inline using [1], [2], [3] notation matching the context numbers.
2. If the answer is not in the context, say "I couldn't find this in the provided documents."
3. Be precise and concise. Use markdown formatting for clarity.
4. When referencing figures or images, mention them explicitly (e.g., "as shown in Fig 3").
5. Never fabricate information not present in the context."""


def build_context(
    query: str,
    chunks: list[RetrievedChunk],
    images: list[RetrievedImage],
    conversation_history: list[ConversationMessage],
    image_base64: Optional[str] = None,
) -> BuiltContext:
    """
    Assemble the full prompt context respecting token budgets.
    Returns BuiltContext with system prompt, user message, and citation map.
    """
    citation_map: dict[int, RetrievedChunk] = {}
    context_parts: list[str] = []
    tokens_used = 0

    # ── Add chunks with citation numbers ─────────────────────────────────
    for i, chunk in enumerate(chunks, 1):
        heading = " > ".join(chunk.heading_path) if chunk.heading_path else "Document"
        citation_text = (
            f"[{i}] **{heading}** (relevance: {chunk.score:.2f})\n"
            f"{chunk.text}\n"
        )
        chunk_tokens = _count(citation_text)
        if tokens_used + chunk_tokens > CONTEXT_BUDGET_TOKENS:
            logger.debug(f"Token budget reached at chunk {i} — stopping")
            break
        context_parts.append(citation_text)
        citation_map[i] = chunk
        tokens_used += chunk_tokens

    # ── Add image context ─────────────────────────────────────────────────
    image_urls: list[str] = []
    img_context_parts: list[str] = []
    for img in images[:3]:  # max 3 images in context
        if not img.storage_url or not img.storage_url.strip():
            continue
        label = img.fig_label or "Image"
        heading = img.nearest_heading or " > ".join(img.heading_path)
        img_desc = f"[Image: {label}] From section: {heading}"
        if img.caption:
            img_desc += f" | Caption: {img.caption}"
        if img.surrounding_text:
            img_desc += f"\nContext: {img.surrounding_text[:200]}"
        img_context_parts.append(img_desc)
        if img.storage_url and img.storage_url.strip():
            image_urls.append(img.storage_url)

    # ── Build conversation history ────────────────────────────────────────
    history_text = ""
    history_tokens = 0
    for msg in conversation_history[-6:]:  # last 6 turns
        line = f"{msg.role.upper()}: {msg.content}\n"
        t = _count(line)
        if history_tokens + t > HISTORY_BUDGET_TOKENS:
            break
        history_text += line
        history_tokens += t

    # ── Assemble user message ─────────────────────────────────────────────
    context_block = "\n\n".join(context_parts)
    img_block = "\n".join(img_context_parts)

    user_message_parts = []
    if history_text:
        user_message_parts.append(f"Previous conversation:\n{history_text}")
    user_message_parts.append(
        f"Document context:\n{context_block}"
    )
    if img_block:
        user_message_parts.append(f"Available images:\n{img_block}")
    user_message_parts.append(f"Question: {query}")

    user_message = "\n\n".join(user_message_parts)
    total_tokens = _count(SYSTEM_PROMPT) + _count(user_message)

    logger.debug(
        f"Context built: {len(citation_map)} citations, "
        f"{len(image_urls)} images, {total_tokens} tokens"
    )

    return BuiltContext(
        system_prompt=SYSTEM_PROMPT,
        user_message=user_message,
        citation_map=citation_map,
        image_urls=image_urls,
        total_tokens=total_tokens,
    )
