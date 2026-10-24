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
import asyncio
import threading
import importlib.util
from typing import Optional
from loguru import logger
from app.config import settings
from app.utils.memory import trim_memory

_local_model = None
_model_lock = threading.Lock()


def get_remote_embedding_model() -> str:
    """
    Resolve remote embedding model name, ensuring proper namespace prefix
    when routing through OpenRouter vs direct OpenAI.
    """
    model = (settings.remote_embedding_model or "openai/text-embedding-3-small").strip()
    if settings.using_openrouter:
        if not model.startswith("openai/") and model in ("text-embedding-3-small", "text-embedding-3-large"):
            return f"openai/{model}"
        return model
    else:
        # Direct OpenAI or other OpenAI-compatible provider
        if model.startswith("openai/"):
            return model.replace("openai/", "", 1)
        return model


def warmup_embedding_model() -> None:
    """Pre-warm the embedding model singleton at application startup."""
    try:
        if _use_local():
            logger.info("Pre-warming fastembed embedding model singleton...")
            _get_local_model()
            logger.info("Fastembed embedding model pre-warmed successfully.")
        else:
            model = get_remote_embedding_model()
            logger.info(
                f"Using remote embedding model '{model}' via {settings.openai_base_url} "
                f"(dim={settings.embedding_dim}). Skipping local FastEmbed pre-warm."
            )
    except Exception as e:
        logger.warning(f"Embedding model pre-warm skipped or failed: {e}")


def _get_local_model():
    """
    Thread-safe model singleton with optimal memory footprint.
    Reused across all ingestion and search requests regardless of cache_enabled.
    Configured with multi-thread CPU execution and memory arena disabled to keep peak RSS < 300MB.
    """
    global _local_model
    if _local_model is None:
        with _model_lock:
            if _local_model is None:
                from fastembed import TextEmbedding
                name = f"sentence-transformers/{settings.local_embedding_model}"
                logger.info(f"Loading fastembed embedding model singleton: {name}")
                threads = min(4, max(1, _os.cpu_count() or 1))
                _local_model = TextEmbedding(
                    name,
                    threads=threads,
                    providers=["CPUExecutionProvider"],
                    extra_session_options={"enable_cpu_mem_arena": False},
                )
                dim = settings.embedding_dim  # default 384
                logger.info(f"Embedding model ready (threads={threads}, dim={dim})")
    return _local_model


def _use_local() -> bool:
    """
    Use local FastEmbed model when:
      - explicitly configured as 'local'
      - OR no API key is provided (e.g. offline testing/local dev without keys).
    When embedding_model != 'local' and an API key (OpenAI or OpenRouter) is present,
    use the remote embedding API.
    """
    if settings.embedding_model.lower() == "local":
        return True
    if not settings.openai_api_key or not settings.openai_api_key.strip():
        return True
    return False


async def embed_text(text: str) -> list[float]:
    text = text.replace("\n", " ").strip() or " "
    if _use_local():
        return await _embed_local_single(text)
    return await _embed_openai(text)


async def embed_query(text: str) -> list[float]:
    """Same as embed_text for MiniLM — no prefix needed unlike e5 models."""
    return await embed_text(text)


async def embed_batch(texts: list[str], batch_size: int = 16) -> list[list[float]]:
    """
    Embed a list of strings in batches with text deduplication to eliminate redundant computations.
    Uses batch_size=16 and chunk_size=64 to maximize ONNX throughput while keeping memory flat.
    """
    if not texts:
        return []

    if _use_local():
        cleaned = [t.replace("\n", " ").strip() or " " for t in texts]

        def _do_embed():
            from app.utils.memory import MemoryStageTracker, log_memory_checkpoint
            trim_memory()
            model = _get_local_model()

            # Deduplicate texts while preserving original indices
            unique_texts = []
            text_to_idx = {}
            for t in cleaned:
                if t not in text_to_idx:
                    text_to_idx[t] = len(unique_texts)
                    unique_texts.append(t)

            unique_embs = []
            chunk_size = 64
            total_chunks = (len(unique_texts) + chunk_size - 1) // chunk_size if unique_texts else 1

            with MemoryStageTracker(
                "embed_batch:local",
                details={
                    "total_texts": len(cleaned),
                    "unique_texts": len(unique_texts),
                    "chunks": total_chunks,
                    "batch_size": batch_size,
                },
                profile_allocations=(len(cleaned) >= 50),
            ) as t_emb:
                with _model_lock:
                    for i in range(0, len(unique_texts), chunk_size):
                        chunk = unique_texts[i:i + chunk_size]
                        embeddings = model.embed(
                            chunk,
                            batch_size=batch_size,
                        )
                        unique_embs.extend([e.tolist() for e in embeddings])
                        if total_chunks > 1:
                            t_emb.checkpoint(
                                "chunk_done",
                                details={"chunk_idx": (i // chunk_size) + 1, "total_chunks": total_chunks},
                            )

                all_embs = [unique_embs[text_to_idx[t]] for t in cleaned]

            trim_memory()
            return all_embs

        return await asyncio.to_thread(_do_embed)

    from openai import AsyncOpenAI
    from app.utils.memory import MemoryStageTracker, log_memory_checkpoint

    client = _get_openai_client()
    model = get_remote_embedding_model()
    all_embs: list[list[float]] = []

    cleaned = [t.replace("\n", " ").strip() or " " for t in texts]
    remote_batch_size = min(batch_size, 64)
    total_batches = (len(cleaned) + remote_batch_size - 1) // remote_batch_size if cleaned else 1

    kwargs: dict = {"model": model}
    if settings.embedding_dim and ("text-embedding-3" in model):
        kwargs["dimensions"] = settings.embedding_dim

    with MemoryStageTracker(
        "embed_batch:remote",
        details={
            "model": model,
            "dimensions": kwargs.get("dimensions", "default"),
            "total_texts": len(cleaned),
            "batches": total_batches,
            "batch_size": remote_batch_size,
        },
    ) as t_emb:
        for i in range(0, len(cleaned), remote_batch_size):
            batch = cleaned[i:i + remote_batch_size]
            resp = await client.embeddings.create(
                input=batch,
                **kwargs,
            )
            all_embs.extend([d.embedding for d in resp.data])
            if total_batches > 1:
                t_emb.checkpoint(
                    "batch_done",
                    details={"batch_idx": (i // remote_batch_size) + 1, "total_batches": total_batches},
                )

    trim_memory()
    return all_embs


async def _embed_local_single(text: str) -> list[float]:
    def _do_embed():
        model = _get_local_model()
        with _model_lock:
            emb = list(model.embed([text], batch_size=1))
        return emb[0].tolist()
    return await asyncio.to_thread(_do_embed)


_openai_client_instance: Optional[object] = None


def _get_openai_client():
    global _openai_client_instance
    base_url = settings.openai_base_url or "https://api.openai.com/v1"
    # Caching disabled: fresh client per call (no shared session/pool reuse).
    if not settings.cache_enabled:
        from openai import AsyncOpenAI
        return AsyncOpenAI(
            api_key=settings.openai_api_key,
            base_url=base_url,
        )
    if _openai_client_instance is None:
        from openai import AsyncOpenAI
        _openai_client_instance = AsyncOpenAI(
            api_key=settings.openai_api_key,
            base_url=base_url,
        )
    return _openai_client_instance


async def _embed_openai(text: str) -> list[float]:
    client = _get_openai_client()
    model = get_remote_embedding_model()
    kwargs: dict = {"model": model, "input": text}
    if settings.embedding_dim and ("text-embedding-3" in model):
        kwargs["dimensions"] = settings.embedding_dim
    resp = await client.embeddings.create(**kwargs)
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
    if not settings.enable_images:
        raise RuntimeError("Image functionality is currently disabled (settings.enable_images=False)")
    global _clip_model, _clip_preprocess, _clip_device
    if importlib.util.find_spec("clip") is None:
        raise RuntimeError("CLIP unavailable: 'clip' package is not installed")
    if _clip_model is not None:
        return _clip_model, _clip_preprocess
    try:
        import torch
        import clip as openai_clip
        _clip_device = "cuda" if torch.cuda.is_available() else "cpu"
        _clip_model, _clip_preprocess = openai_clip.load("ViT-B/32", device=_clip_device)
        logger.info(f"CLIP loaded on {_clip_device}")
        return _clip_model, _clip_preprocess
    except Exception as e:
        logger.debug(f"CLIP not available: {e}")
        raise RuntimeError(f"CLIP unavailable: {e}")


def embed_image_clip(image_path: str) -> list[float]:
    if not settings.enable_images:
        raise RuntimeError("Image functionality is currently disabled (settings.enable_images=False)")
    try:
        import torch
        from PIL import Image
        model, preprocess = load_clip()
        img = preprocess(Image.open(image_path).convert("RGB")).unsqueeze(0).to(_clip_device)
        with torch.no_grad():
            features = model.encode_image(img)
            features /= features.norm(dim=-1, keepdim=True)
        return features.squeeze().cpu().tolist()
    except Exception as e:
        logger.debug(f"embed_image_clip failed: {e}")
        raise


async def embed_text_clip(text: str) -> list[float]:
    if not settings.enable_images:
        raise RuntimeError("Image functionality is currently disabled (settings.enable_images=False)")
    try:
        import torch
        import clip as openai_clip
        model, _ = load_clip()
        tokens = openai_clip.tokenize([text[:77]]).to(_clip_device)
        with torch.no_grad():
            features = model.encode_text(tokens)
            features /= features.norm(dim=-1, keepdim=True)
        return features.squeeze().cpu().tolist()
    except Exception as e:
        logger.debug(f"embed_text_clip failed: {e}")
        raise