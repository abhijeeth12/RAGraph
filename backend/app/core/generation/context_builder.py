from __future__ import annotations
from dataclasses import dataclass, field
from typing import Optional
import tiktoken
from loguru import logger

from app.core.retrieval.tree_retriever import RetrievedChunk
from app.core.retrieval.image_retriever import RetrievedImage
from app.models.search import ConversationMessage

SYSTEM_PROMPT_TOKENS  = 400
CONTEXT_BUDGET_TOKENS = 8000
HISTORY_BUDGET_TOKENS = 1500
_enc = tiktoken.get_encoding("cl100k_base")

def _count(text: str) -> int:
    return len(_enc.encode(text))


@dataclass
class BuiltContext:
    system_prompt: str
    user_message: str
    citation_map: dict[int, RetrievedChunk]
    image_urls: list[str]
    total_tokens: int


SYSTEM_PROMPT = """You are RAGraph, an intelligent research assistant.
Answer questions based on the provided document context.

Rules:
1. MANDATORY CITATION FORMAT: You MUST cite your sources using the exact format `[Doc N]`, where N is the document number.
   Example: "The perceptron is a linear classifier [Doc 1]."
   NEVER use other formats like `[1]`, `(Doc 1)`, or `[Source 1]`. Only use `[Doc N]`.
2. Do not hallucinate. If the answer is not in the context, say "I couldn't find this in the provided documents."
3. Be precise and concise. Use markdown for structure.
4. When referencing figures or images, carefully mention their labels."""


def build_context(
    query: str,
    chunks: list[RetrievedChunk],
    images: list[RetrievedImage],
    conversation_history: list[ConversationMessage],
    image_base64: Optional[str] = None,
    doc_numbers: Optional[dict[str, int]] = None,
    doc_names: Optional[dict[str, str]] = None,
) -> BuiltContext:
    doc_numbers = doc_numbers or {}
    doc_names   = doc_names or {}
    citation_map: dict[int, RetrievedChunk] = {}
    context_parts: list[str] = []
    tokens_used = 0

    for i, chunk in enumerate(chunks, 1):
        doc_num  = doc_numbers.get(chunk.doc_id, 0)
        doc_name = doc_names.get(chunk.doc_id, "Unknown")
        heading  = " > ".join(chunk.heading_path) if chunk.heading_path else "Document"

        # Citation label uses Doc number
        label = f"[Doc {doc_num}]" if doc_num else f"[{doc_name}]"
        citation_text = (
            f"{label} **{heading}** (relevance: {chunk.score:.2f})\n"
            f"{chunk.text}\n"
        )
        chunk_tokens = _count(citation_text)
        if tokens_used + chunk_tokens > CONTEXT_BUDGET_TOKENS:
            break
        context_parts.append(citation_text)
        citation_map[i] = chunk
        tokens_used += chunk_tokens

    # Image context
    image_urls: list[str] = []
    img_parts: list[str] = []
    for img in images[:3]:
        label   = img.fig_label or "Image"
        heading = img.nearest_heading or " > ".join(img.heading_path)
        desc = f"[Image: {label}] Section: {heading}"
        if img.caption:
            desc += f" | Caption: {img.caption}"
        img_parts.append(desc)
        image_urls.append(img.storage_url)

    # Conversation history
    history_text = ""
    history_tokens = 0
    for msg in conversation_history[-6:]:
        line = f"{msg.role.upper()}: {msg.content}\n"
        t = _count(line)
        if history_tokens + t > HISTORY_BUDGET_TOKENS:
            break
        history_text += line
        history_tokens += t

    # Assemble user message
    parts = []
    if history_text:
        parts.append(f"Previous conversation:\n{history_text}")

    # Add doc number legend at top of context
    if doc_numbers:
        legend_lines = []
        seen = set()
        for chunk in chunks[:len(citation_map)]:
            if chunk.doc_id not in seen:
                seen.add(chunk.doc_id)
                num  = doc_numbers.get(chunk.doc_id, 0)
                name = doc_names.get(chunk.doc_id, "Unknown")
                if num:
                    legend_lines.append(f"[Doc {num}] = {name}")
        if legend_lines:
            parts.append("Document Legend:\n" + "\n".join(legend_lines))

    parts.append("Document context:\n" + "\n\n".join(context_parts))
    if img_parts:
        parts.append("Available images:\n" + "\n".join(img_parts))
    parts.append(f"Question: {query}")

    user_message = "\n\n".join(parts)
    total_tokens = _count(SYSTEM_PROMPT) + _count(user_message)

    logger.debug(f"Context built: {len(citation_map)} citations, "
                 f"{len(image_urls)} images, {total_tokens} tokens")

    return BuiltContext(
        system_prompt=SYSTEM_PROMPT,
        user_message=user_message,
        citation_map=citation_map,
        image_urls=image_urls,
        total_tokens=total_tokens,
    )
