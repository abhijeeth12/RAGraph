"""
LiteParse-backed PDF extractor.

LiteParse (Rust/PDFium) does one fast, structural pass over a PDF and returns
positioned text, classified layout blocks (headings, paragraphs, lists, code,
tables, figures), reconstructed Markdown, and extracted image bytes. This
module converts a single LiteParse parse into RAGraph's canonical
``ParsedDocument`` so every downstream consumer (tree builder, chunker,
embedder, Qdrant indexer, BM25, retrieval) keeps working unchanged while
gaining real document structure.

Design notes
------------
* One parse yields both Markdown (``result.text``) and structured blocks
  (``result.pages[].blocks``) — we never parse the same file twice.
* OCR is routed through the cheap ``is_complex`` probe: digital documents keep
  the fast native path; only genuinely scanned / text-less pages trigger OCR.
* Parser instances are persistent and reused across documents (PDFium is not
  thread-safe; a per-OCR-mode instance also avoids re-initialising workers).
* Any failure (missing native wheel, corrupt file, timeout) returns ``None`` so
  ``parser.parse_document`` falls back to the legacy chain and upload never
  breaks.
"""
from __future__ import annotations

import os
import threading
import uuid
from pathlib import Path
from typing import Optional

from loguru import logger

from app.config import settings
from app.core.ingestion.parser import (
    ParsedDocument,
    RawImage,
    RawTable,
    FIG_LABEL_RE,
    CAPTION_RE,
    _extract_fig_label,
)

# Reasons that genuinely require OCR. "sparse-text" / "embedded-images" /
# "vector-text" / "annotation-text" are deliberately excluded: digital pages
# that merely contain a figure must not trigger a slow OCR pass.
_OCR_REASONS = {"scanned", "no-text", "garbled"}

_PARSERS: dict[bool, object] = {}
_PARSE_LOCK = threading.Lock()
_VERSION: Optional[str] = None


def _liteparse():
    """Import the LiteParse binding, or return None when unavailable."""
    try:
        import liteparse  # type: ignore
        return liteparse
    except Exception:  # pragma: no cover - exercised only without the wheel
        return None


def liteparse_available() -> bool:
    return _liteparse() is not None


def _parser_version() -> str:
    global _VERSION
    if _VERSION is None:
        try:
            from importlib.metadata import version
            _VERSION = version("liteparse")
        except Exception:
            _VERSION = getattr(_liteparse(), "__version__", "") or ""
    return _VERSION


def _get_parser(ocr_enabled: bool = False):
    """Return a cached, reusable LiteParse instance (OCR disabled system-wide)."""
    # Force OCR off system-wide
    ocr_enabled = False
    cached = _PARSERS.get(False)
    if cached is not None:
        return cached
    with _PARSE_LOCK:
        cached = _PARSERS.get(False)
        if cached is not None:
            return cached
        lp = _liteparse()
        if lp is None:
            raise RuntimeError("liteparse binding not importable")
        kwargs = dict(
            ocr_enabled=False,
            output_format="markdown",
            extract_blocks=True,
            extract_links=True,
            extract_images=settings.liteparse_extract_images,
            max_pages=settings.liteparse_max_pages,
            dpi=settings.liteparse_dpi,
            quiet=settings.liteparse_quiet,
        )
        parser = lp.LiteParse(**kwargs)
        _PARSERS[False] = parser
        logger.info(
            f"LiteParse initialised (ocr=False, "
            f"extract_images={settings.liteparse_extract_images}, "
            f"pool=0, v{_parser_version()})"
        )
        return parser


def _decide_ocr(filepath: str) -> bool:
    """OCR functionality is completely disabled across the system."""
    return False


def _is_timeout_error(exc: BaseException) -> bool:
    """True when ``exc`` is LiteParse's pool-mode parse timeout."""
    lp = _liteparse()
    timeout_cls = getattr(lp, "ParseTimeoutError", None) if lp is not None else None
    if isinstance(timeout_cls, type) and isinstance(exc, timeout_cls):
        return True
    return type(exc).__name__ == "ParseTimeoutError"


def _run_parse(parser, filepath: str) -> tuple[Optional[object], bool]:
    """Run one parse, returning ``(result_or_None, timed_out)``.

    A timeout is reported separately so the caller can retry without OCR
    instead of falling straight through to the legacy parser.
    """
    try:
        return parser.parse(filepath), False
    except Exception as e:
        name = Path(filepath).name
        if _is_timeout_error(e):
            logger.warning(f"LiteParse parse timed out for {name}: {e!r}")
            return None, True
        # Any other failure bubbles up as None so the caller falls back to the
        # legacy parser.
        logger.warning(f"LiteParse parse failed for {name}: {e!r}")
        return None, False


# ─── Layout helpers ──────────────────────────────────────────────────────────

def _block_dicts(page) -> list[dict]:
    """Flatten a page's classified blocks into plain dicts with coords."""
    out: list[dict] = []
    for b in (getattr(page, "blocks", None) or []):
        bbox = getattr(b, "bbox", None)
        out.append({
            "kind": getattr(b, "kind", "") or "",
            "text": getattr(b, "text", None),
            "level": getattr(b, "level", None),
            "header": getattr(b, "header", None),
            "rows": getattr(b, "rows", None),
            "y0": float(getattr(bbox, "y", 0.0) or 0.0) if bbox else 0.0,
            "y1": (float(getattr(bbox, "y", 0.0) or 0.0)
                   + float(getattr(bbox, "height", 0.0) or 0.0)) if bbox else 0.0,
        })
    return out


def _nearest_heading(blocks: list[dict], y: float) -> tuple[Optional[str], float]:
    best: Optional[str] = None
    best_dist = float("inf")
    for b in blocks:
        if b["kind"] != "heading" or not (b.get("text") or "").strip():
            continue
        dist = abs(b["y0"] - y)
        if dist < best_dist:
            best_dist = dist
            best = b["text"].strip()
    return best, best_dist


def _detect_caption(blocks: list[dict], y0: float, y1: float) -> tuple[Optional[str], Optional[str]]:
    """Find a 'Figure N: ...' caption near the image, preferring the block below."""
    candidates: list[tuple[float, str]] = []
    for b in blocks:
        text = (b.get("text") or "").strip()
        if not text:
            continue
        if not (CAPTION_RE.match(text) or FIG_LABEL_RE.search(text)):
            continue
        if b["y0"] >= y1 - 5:            # below the image
            dist = b["y0"] - y1
        elif b["y1"] <= y0 + 5:          # above the image
            dist = y0 - b["y1"]
        else:
            dist = 0.0
        candidates.append((dist, text))
    if not candidates:
        return None, None
    candidates.sort(key=lambda c: c[0])
    caption = candidates[0][1][:160]
    return caption, _extract_fig_label(caption)


def _clean_title_line(line: str) -> str:
    line = line.strip()
    line = line.lstrip("#").strip()
    line = line.strip("*_` ").strip()
    return line[:120]


def _derive_title(res, filename: str) -> str:
    for page in getattr(res, "pages", None) or []:
        for b in (getattr(page, "blocks", None) or []):
            if getattr(b, "kind", "") == "heading" and (getattr(b, "text", "") or "").strip():
                return _clean_title_line(b.text)
    for line in (getattr(res, "text", "") or "").splitlines():
        clean = _clean_title_line(line)
        if clean and len(clean) > 3:
            return clean
    return Path(filename).stem


# ─── Public entry point ──────────────────────────────────────────────────────

def parse_pdf_with_liteparse(filepath: str, doc_id: str) -> Optional[ParsedDocument]:
    """
    Parse a PDF with LiteParse and normalise it into ``ParsedDocument``.

    Returns ``None`` (so the caller falls back to the legacy parser) when
    LiteParse is disabled/unavailable, the parse fails, or the result carries
    neither extractable text nor images.
    """
    if not settings.liteparse_enabled:
        return None
    lp = _liteparse()
    if lp is None:
        return None

    ocr_timed_out = False
    from app.utils.memory import MemoryStageTracker, log_memory_checkpoint

    try:
        with MemoryStageTracker(
            "liteparse:probe_and_parse",
            context=Path(filepath).name,
            details={"file_size": os.path.getsize(filepath) if os.path.exists(filepath) else 0},
            profile_allocations=True,
        ) as t_lp:
            ocr_enabled = _decide_ocr(filepath)
            t_lp.checkpoint("ocr_decided", details={"ocr_enabled": ocr_enabled})

            parser = _get_parser(ocr_enabled)
            t_lp.checkpoint("parser_ready")

            res, timed_out = _run_parse(parser, filepath)
            t_lp.checkpoint("parse_call_returned", details={"timed_out": timed_out, "has_res": res is not None})
    except Exception as e:
        logger.warning(f"LiteParse integration error for {Path(filepath).name}: {e!r}")
        return None

    if res is None and timed_out and ocr_enabled:
        logger.warning(
            f"OCR parse exceeded {settings.liteparse_parse_timeout:.0f}s for "
            f"{Path(filepath).name}; retrying with OCR disabled (native text only)"
        )
        try:
            res, _ = _run_parse(_get_parser(False), filepath)
        except Exception as e:
            logger.warning(f"LiteParse no-OCR retry failed for {Path(filepath).name}: {e!r}")
            res = None
        if res is not None:
            ocr_enabled = False
            ocr_timed_out = True

    if res is None:
        return None

    filename = Path(filepath).name
    doc = ParsedDocument(doc_id=doc_id, filename=filename, mime_type="application/pdf")
    doc.extraction_method = "liteparse"
    doc.parser_version = _parser_version()
    doc.ocr_used = ocr_enabled
    doc.ocr_timed_out = ocr_timed_out

    pages = getattr(res, "pages", None) or []
    doc.pages = [(getattr(p, "text", "") or "") for p in pages]
    plain_full = "\n".join(doc.pages)
    markdown = getattr(res, "text", "") or ""
    doc.markdown = markdown
    # Prefer reconstructed Markdown (headings/tables/lists preserved); fall back
    # to layout text when Markdown rendering produced nothing.
    doc.full_text = markdown if markdown.strip() else plain_full
    doc.total_pages = int(getattr(res, "total_pages", 0) or len(pages))

    # ── Headings + tables from classified blocks ─────────────────────────
    search_from = 0
    for page in pages:
        page_num = int(getattr(page, "page_num", 0) or 0)
        for b in (getattr(page, "blocks", None) or []):
            kind = getattr(b, "kind", "") or ""
            if kind == "heading":
                text = (getattr(b, "text", "") or "").strip()
                if not text:
                    continue
                level = getattr(b, "level", None)
                level = int(level) if isinstance(level, int) and 1 <= level <= 6 else 1
                idx = doc.full_text.lower().find(text.lower(), search_from)
                if idx == -1:
                    idx = search_from
                else:
                    search_from = idx + len(text)
                doc.headings.append((text, level, idx))
                doc.heading_pages.append(page_num)
            elif kind == "table":
                header = [getattr(c, "text", "") or "" for c in (getattr(b, "header", None) or [])]
                rows = [
                    [getattr(c, "text", "") or "" for c in row]
                    for row in (getattr(b, "rows", None) or [])
                ]
                if not header and not rows:
                    continue
                bbox = getattr(b, "bbox", None)
                doc.tables.append(RawTable(
                    page_number=page_num,
                    index=len(doc.tables),
                    header=header,
                    rows=rows,
                    bbox=(
                        float(bbox.x), float(bbox.y),
                        float(bbox.x + bbox.width), float(bbox.y + bbox.height),
                    ) if bbox else None,
                ))

    # ── Images ───────────────────────────────────────────────────────────
    _extract_images(res, doc)

    if not doc.full_text.strip() and not doc.images:
        logger.info("LiteParse produced no text and no images — falling back")
        return None

    doc.title = _derive_title(res, filename)
    logger.info(
        f"PDF parsed via LiteParse ({doc.extraction_method} v{doc.parser_version}, "
        f"ocr={doc.ocr_used}, ocr_timed_out={doc.ocr_timed_out}): "
        f"{doc.total_pages} pages, "
        f"{len(doc.headings)} headings, {len(doc.tables)} tables, "
        f"{len(doc.images)} images"
    )
    return doc


def _extract_images(res, doc: ParsedDocument) -> None:
    if not settings.liteparse_extract_images:
        return
    # Per-page block dicts for caption / heading association.
    page_blocks: dict[int, list[dict]] = {
        int(getattr(p, "page_num", 0) or 0): _block_dicts(p)
        for p in (getattr(res, "pages", None) or [])
    }
    img_dir = os.path.join(settings.local_storage_path, "images")
    os.makedirs(img_dir, exist_ok=True)

    for img in (getattr(res, "images", None) or []):
        if getattr(img, "duplicate_of", None):
            continue  # identical resource already extracted
        data = getattr(img, "bytes", b"") or b""
        if len(data) < settings.liteparse_min_image_bytes:
            continue
        ext = (getattr(img, "format", "") or "png").lower()
        if ext == "jpeg":
            ext = "jpg"
        img_id = str(uuid.uuid4())
        img_path = os.path.join(img_dir, f"{img_id}.{ext}")
        try:
            with open(img_path, "wb") as f:
                f.write(data)
        except Exception as e:
            logger.warning(f"Failed to persist extracted image: {e}")
            continue

        page_num = int(getattr(img, "page", 0) or 0)
        bbox = getattr(img, "bbox", None)
        x0 = float(getattr(bbox, "x", 0.0) or 0.0) if bbox else 0.0
        y0 = float(getattr(bbox, "y", 0.0) or 0.0) if bbox else 0.0
        x1 = x0 + (float(getattr(bbox, "width", 0.0) or 0.0) if bbox else 0.0)
        y1 = y0 + (float(getattr(bbox, "height", 0.0) or 0.0) if bbox else 0.0)

        blocks = page_blocks.get(page_num, [])
        caption, fig_label = _detect_caption(blocks, y0, y1)
        nearest, distance = _nearest_heading(blocks, y0)

        doc.images.append(RawImage(
            id=img_id,
            page_number=page_num,
            image_bytes=b"",  # already written to the media store
            image_ext=ext,
            width=int(getattr(img, "width", 0) or 0),
            height=int(getattr(img, "height", 0) or 0),
            bbox_x0=x0, bbox_y0=y0, bbox_x1=x1, bbox_y1=y1,
            rotation=float(getattr(img, "rotation", 0.0) or 0.0),
            spatial_nearest_heading=nearest,
            spatial_distance=distance,
            caption=caption,
            fig_label=fig_label,
        ))


def shutdown() -> None:
    """Release persistent parsers (called on app shutdown / tests)."""
    with _PARSE_LOCK:
        for parser in _PARSERS.values():
            try:
                close = getattr(parser, "close", None)
                if callable(close):
                    close()
            except Exception:
                pass
        _PARSERS.clear()
