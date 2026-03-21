"""
Embeddings — uses all-MiniLM-L6-v2 by default.

Model comparison:
  all-MiniLM-L6-v2  :  90MB,  384-dim, ~14k tokens/sec on CPU  ← DEFAULT
  all-mpnet-base-v2 : 420MB,  768-dim, ~2k tokens/sec on CPU
  e5-large-v2       : 1.3GB,  1024-dim — overkill for local use

The model is downloaded ONCE and cached in ~/.cache/huggingface/
All subsequent runs load from cache in ~1 second.
"""

from __future__ import annotations

import os as _os
_os.environ.setdefault("HF_HUB_DISABLE_IMPLICIT_TOKEN", "1")
_os.environ.setdefault("HF_HUB_DISABLE_TELEMETRY", "1")
_os.environ.setdefault("TRANSFORMERS_OFFLINE", "0")
import numpy as np
from typing import Optional
from loguru import logger
from app.config import settings

_local_model = None


def _get_local_model():
    global _local_model
    if _local_model is None:
        from sentence_transformers import SentenceTransformer
        name = settings.local_embedding_model  # all-MiniLM-L6-v2
        logger.info(f"Loading embedding model: {name}")
        _local_model = SentenceTransformer(name)
        dim = _local_model.get_sentence_embedding_dimension()
        logger.info(f"Embedding model ready. dim={dim}")
    return _local_model


def _use_local() -> bool:
    """Use local model when: no key, OpenRouter key, or explicitly set to local."""
    return (
        settings.embedding_model == "local"
        or not settings.openai_api_key
        or settings.openai_api_key.startswith("sk-or-")
    )


async def embed_text(text: str) -> list[float]:
    text = text.replace("\n", " ").strip() or " "
    if _use_local():
        return _embed_local_single(text)
    return await _embed_openai(text)


async def embed_query(text: str) -> list[float]:
    """Same as embed_text for MiniLM — no prefix needed unlike e5 models."""
    return await embed_text(text)


async def embed_batch(texts: list[str], batch_size: int = 64) -> list[list[float]]:
    if _use_local():
        cleaned = [t.replace("\n", " ").strip() or " " for t in texts]
        model = _get_local_model()
        logger.debug(f"Embedding {len(cleaned)} texts locally...")
        embeddings = model.encode(
            cleaned,
            batch_size=batch_size,
            show_progress_bar=len(cleaned) > 100,
            normalize_embeddings=True,
        )
        return embeddings.tolist()

    from openai import AsyncOpenAI
    client = _get_openai_client()
    all_embs: list[list[float]] = []

    cleaned = [t.replace("\n", " ").strip() or " " for t in texts]
    for i in range(0, len(cleaned), batch_size):
        batch = cleaned[i:i + batch_size]
        resp = await client.embeddings.create(
            model="text-embedding-3-large", input=batch
        )
        all_embs.extend([d.embedding for d in resp.data])

    return all_embs


def _embed_local_single(text: str) -> list[float]:
    model = _get_local_model()
    emb = model.encode([text], normalize_embeddings=True)
    return emb[0].tolist()


_openai_client_instance: Optional[object] = None


def _get_openai_client():
    global _openai_client_instance
    if _openai_client_instance is None:
        from openai import AsyncOpenAI
        _openai_client_instance = AsyncOpenAI(
            api_key=settings.openai_api_key,
            base_url="https://api.openai.com/v1",
        )
    return _openai_client_instance


async def _embed_openai(text: str) -> list[float]:
    client = _get_openai_client()
    resp = await client.embeddings.create(
        model="text-embedding-3-large", input=text
    )
    return resp.data[0].embedding


def cosine_similarity(a: list[float], b: list[float]) -> float:
    va, vb = np.array(a), np.array(b)
    denom = np.linalg.norm(va) * np.linalg.norm(vb)
    return float(np.dot(va, vb) / denom) if denom > 0 else 0.0


def fuse_embeddings(vectors: list[list[float]], weights: list[float]) -> list[float]:
    assert len(vectors) == len(weights)
    result = np.zeros(len(vectors[0]), dtype=np.float64)
    for vec, w in zip(vectors, weights):
        result += w * np.array(vec)
    norm = np.linalg.norm(result)
    if norm > 0:
        result /= norm
    return result.tolist()


# ── CLIP (optional, for image embeddings) ────────────────────────────────
_clip_model = None
_clip_preprocess = None
_clip_device = "cpu"


def load_clip():
    global _clip_model, _clip_preprocess, _clip_device
    if _clip_model is not None:
        return _clip_model, _clip_preprocess
    import torch
    import clip as openai_clip
    _clip_device = "cuda" if torch.cuda.is_available() else "cpu"
    _clip_model, _clip_preprocess = openai_clip.load("ViT-L/14", device=_clip_device)
    logger.info(f"CLIP loaded on {_clip_device}")
    return _clip_model, _clip_preprocess


def embed_image_clip(image_path: str) -> list[float]:
    import torch
    from PIL import Image
    model, preprocess = load_clip()
    img = preprocess(Image.open(image_path).convert("RGB")).unsqueeze(0).to(_clip_device)
    with torch.no_grad():
        features = model.encode_image(img)
        features /= features.norm(dim=-1, keepdim=True)
    return features.squeeze().cpu().tolist()


async def embed_text_clip(text: str) -> list[float]:
    import torch
    import clip as openai_clip
    model, _ = load_clip()
    tokens = openai_clip.tokenize([text[:77]]).to(_clip_device)
    with torch.no_grad():
        features = model.encode_text(tokens)
        features /= features.norm(dim=-1, keepdim=True)
    return features.squeeze().cpu().tolist()