"""
Integration tests for the LiteParse-backed ingestion path.

These generate real PDF fixtures with PyMuPDF and run the real parser (no
mocked parser results) to validate that structure survives all the way from
extraction into the document tree. Tests that require the native LiteParse
binding are skipped automatically when it is not installed.
"""
import os

import pytest

fitz = pytest.importorskip("fitz")  # PyMuPDF, used to build fixtures

from app.core.ingestion.parser import parse_document
from app.core.ingestion.tree_builder import build_tree
from app.config import settings
from app.models.tree import NodeLevel


# ─── Fixtures ────────────────────────────────────────────────────────────────

def _build_pdf(path: str) -> str:
    """Two-page PDF: 3 headings (H1 + 2×H2), one ruled table, one image."""
    doc = fitz.open()
    p1 = doc.new_page(width=612, height=792)
    p1.insert_text((72, 80), "Introduction to Retrieval", fontsize=22, fontname="hebo")
    p1.insert_text((72, 115), "This document describes a retrieval augmented pipeline.", fontsize=11, fontname="helv")
    p1.insert_text((72, 135), "It covers chunking, embeddings, and ranking strategies.", fontsize=11, fontname="helv")
    p1.insert_text((72, 180), "1. Methods", fontsize=16, fontname="hebo")
    p1.insert_text((72, 205), "We use hierarchical beam search over document sections.", fontsize=11, fontname="helv")
    p1.insert_text((72, 225), "Paragraph chunks are prefixed with their heading path.", fontsize=11, fontname="helv")

    x0, y0 = 72, 260
    cols = [0, 160, 340, 470]
    rows = [0, 24, 48, 72]
    for c in cols:
        p1.draw_line((x0 + c, y0 + rows[0]), (x0 + c, y0 + rows[-1]))
    for r in rows:
        p1.draw_line((x0 + cols[0], y0 + r), (x0 + cols[-1], y0 + r))
    p1.insert_text((x0 + 8, y0 + 16), "Territory", fontsize=10, fontname="hebo")
    p1.insert_text((x0 + 168, y0 + 16), "Factor", fontsize=10, fontname="hebo")
    p1.insert_text((x0 + 348, y0 + 16), "Notes", fontsize=10, fontname="hebo")
    p1.insert_text((x0 + 8, y0 + 40), "001", fontsize=10, fontname="helv")
    p1.insert_text((x0 + 168, y0 + 40), "1.25", fontsize=10, fontname="helv")
    p1.insert_text((x0 + 348, y0 + 40), "north", fontsize=10, fontname="helv")
    p1.insert_text((x0 + 8, y0 + 64), "002", fontsize=10, fontname="helv")
    p1.insert_text((x0 + 168, y0 + 64), "0.90", fontsize=10, fontname="helv")
    p1.insert_text((x0 + 348, y0 + 64), "south", fontsize=10, fontname="helv")

    png = fitz.Pixmap(fitz.csRGB, fitz.IRect(0, 0, 120, 80))
    png.set_rect(png.irect, (200, 30, 30))
    p1.insert_image(fitz.Rect(72, 370, 312, 530), stream=png.tobytes("png"))
    p1.insert_text((72, 550), "Figure 1: Sample red rectangle diagram.", fontsize=10, fontname="helv")

    p2 = doc.new_page(width=612, height=792)
    p2.insert_text((72, 80), "2. Results", fontsize=16, fontname="hebo")
    p2.insert_text((72, 110), "The hybrid approach improved recall by 12 percent.", fontsize=11, fontname="helv")
    doc.save(path)
    doc.close()
    return path


@pytest.fixture
def pdf_path(tmp_path):
    return _build_pdf(str(tmp_path / "sample.pdf"))


@pytest.fixture
def liteparse_on(monkeypatch, tmp_path):
    """Force the LiteParse path and isolate its media store."""
    pytest.importorskip("liteparse")
    monkeypatch.setattr(settings, "liteparse_enabled", True)
    monkeypatch.setattr(settings, "liteparse_ocr", "never")  # deterministic timing
    monkeypatch.setattr(settings, "liteparse_extract_images", True)
    monkeypatch.setattr(settings, "local_storage_path", str(tmp_path / "uploads"))
    yield


# ─── Extraction ──────────────────────────────────────────────────────────────

def test_liteparse_extracts_structure(liteparse_on, pdf_path):
    parsed = parse_document(pdf_path, "lp-doc-1")

    assert parsed.extraction_method == "liteparse"
    assert parsed.parser_version  # e.g. "2.16.0"
    assert parsed.total_pages == 2
    assert parsed.full_text.strip()
    assert parsed.markdown.strip()

    # Headings with real levels and page provenance.
    texts = [h[0] for h in parsed.headings]
    assert "Introduction to Retrieval" in texts
    assert "1. Methods" in texts
    assert "2. Results" in texts
    levels = {h[0]: h[1] for h in parsed.headings}
    assert levels["Introduction to Retrieval"] == 1
    assert levels["1. Methods"] == 2
    assert parsed.heading_pages and parsed.heading_pages[0] == 1

    # Table structure (header bound to rows).
    assert len(parsed.tables) == 1
    table = parsed.tables[0]
    assert table.header == ["Territory", "Factor", "Notes"]
    assert ["001", "1.25", "north"] in table.rows
    assert ["002", "0.90", "south"] in table.rows
    assert table.page_number == 1

    # Image with source metadata, caption and spatial heading.
    assert len(parsed.images) == 1
    img = parsed.images[0]
    assert img.page_number == 1
    assert img.image_ext in ("png", "jpg")
    assert img.width == 120 and img.height == 80
    assert img.caption and "Figure 1" in img.caption
    assert img.fig_label
    assert img.spatial_nearest_heading == "1. Methods"


def test_liteparse_image_saved_to_media_store(liteparse_on, pdf_path):
    parsed = parse_document(pdf_path, "lp-doc-2")
    assert parsed.images
    img = parsed.images[0]
    path = os.path.join(settings.local_storage_path, "images", f"{img.id}.{img.image_ext}")
    assert os.path.exists(path)
    assert os.path.getsize(path) >= settings.liteparse_min_image_bytes


def test_markdown_contains_table_and_heading(liteparse_on, pdf_path):
    parsed = parse_document(pdf_path, "lp-doc-3")
    assert "# Introduction to Retrieval" in parsed.markdown
    assert "| Territory | Factor | Notes |" in parsed.full_text


# ─── Tree construction (structure preserved for retrieval) ────────────────────

def test_tree_preserves_table_and_pages(liteparse_on, pdf_path):
    parsed = parse_document(pdf_path, "lp-doc-4")
    tree = build_tree("lp-session", parsed)

    assert tree.root is not None
    table_nodes = [n for n in tree.nodes if n.element_kind == "table"]
    assert table_nodes, "expected a dedicated table chunk"
    tn = table_nodes[0]
    assert "| Territory | Factor | Notes |" in tn.text
    assert "001" in tn.text and "002" in tn.text
    assert tn.heading_path, "table chunk should carry heading context"

    h1 = [n for n in tree.nodes if n.level == NodeLevel.H1]
    assert h1 and h1[0].element_kind == "heading"
    assert h1[0].page_number == 1
    assert len(tree.images) == 1


def test_heading_levels_reach_tree(liteparse_on, pdf_path):
    parsed = parse_document(pdf_path, "lp-doc-5")
    tree = build_tree("lp-session", parsed)
    h1 = [n for n in tree.nodes if n.level == NodeLevel.H1]
    h2 = [n for n in tree.nodes if n.level == NodeLevel.H2]
    assert len(h1) >= 1
    assert len(h2) >= 1
    # Every H2 sits under the H1.
    h1_ids = {n.id for n in h1}
    assert all(n.parent_id in h1_ids for n in h2)


# ─── Fallback / reliability ───────────────────────────────────────────────────

def test_falls_back_when_liteparse_disabled(monkeypatch, pdf_path):
    monkeypatch.setattr(settings, "liteparse_enabled", False)
    parsed = parse_document(pdf_path, "lp-doc-6")
    assert parsed.extraction_method in ("pymupdf", "pdfplumber", "pypdf2")
    # Legacy parser still surfaces heading/table text (as flowing text).
    assert parsed.full_text.strip()


def test_corrupt_pdf_does_not_crash(liteparse_on, tmp_path):
    bad = tmp_path / "broken.pdf"
    bad.write_bytes(b"%PDF-1.7\nthis is not a real pdf\n%%EOF")
    parsed = parse_document(str(bad), "lp-doc-7")
    # Must return a ParsedDocument (possibly empty) rather than raising.
    assert parsed is not None
    assert parsed.doc_id == "lp-doc-7"


def test_empty_pdf_falls_back_gracefully(liteparse_on, tmp_path):
    blank = fitz.open()
    blank.new_page(width=612, height=792)
    path = str(tmp_path / "blank.pdf")
    blank.save(path)
    blank.close()
    parsed = parse_document(path, "lp-doc-8")
    # No text and no raster images -> legacy fallback, but no exception.
    assert parsed is not None
    assert parsed.doc_id == "lp-doc-8"


# ─── OCR routing ─────────────────────────────────────────────────────────────

def test_ocr_mode_always_and_never(monkeypatch, pdf_path):
    pytest.importorskip("liteparse")
    from app.core.ingestion.liteparse_parser import _decide_ocr

    monkeypatch.setattr(settings, "liteparse_ocr", "never")
    assert _decide_ocr(pdf_path) is False
    monkeypatch.setattr(settings, "liteparse_ocr", "always")
    assert _decide_ocr(pdf_path) is True


def test_ocr_auto_skips_digital_pdf(monkeypatch, pdf_path):
    pytest.importorskip("liteparse")
    from app.core.ingestion.liteparse_parser import _decide_ocr

    monkeypatch.setattr(settings, "liteparse_ocr", "auto")
    # A digital PDF with a figure must NOT be OCR'd just because it has an image.
    assert _decide_ocr(pdf_path) is False


# ─── Bounded OCR (timeout) ───────────────────────────────────────────────────

def test_parse_defaults_bound_ocr():
    """Shipped defaults must enable a hard OCR parse timeout."""
    from app.config import Settings

    fields = Settings.model_fields
    assert fields["liteparse_pool_size"].default >= 1
    assert fields["liteparse_parse_timeout"].default > 0


def test_ocr_parser_gets_pool_timeout(monkeypatch):
    """Pool + timeout apply to the OCR parser only (native stays in-process)."""
    import app.core.ingestion.liteparse_parser as lp_mod

    liteparse = pytest.importorskip("liteparse")

    class FakeParser:
        def __init__(self, **kwargs):
            self.kwargs = kwargs
            self.warmed = False

        def warm_up(self):
            self.warmed = True

        def close(self):
            pass

    class FakeLP:
        ParseTimeoutError = liteparse.ParseTimeoutError

        def LiteParse(self, **kwargs):
            return FakeParser(**kwargs)

    monkeypatch.setattr(lp_mod, "_liteparse", lambda: FakeLP())
    monkeypatch.setattr(settings, "liteparse_pool_size", 2)
    monkeypatch.setattr(settings, "liteparse_parse_timeout", 180.0)
    lp_mod._PARSERS.clear()
    try:
        ocr_parser = lp_mod._get_parser(True)
        assert ocr_parser.kwargs["pool_size"] == 2
        assert ocr_parser.kwargs["parse_timeout"] == 180.0
        assert ocr_parser.warmed is True

        native_parser = lp_mod._get_parser(False)
        assert "pool_size" not in native_parser.kwargs
        assert "parse_timeout" not in native_parser.kwargs
        assert native_parser.warmed is False
    finally:
        lp_mod._PARSERS.clear()


def test_run_parse_reports_timeout():
    import app.core.ingestion.liteparse_parser as lp_mod

    liteparse = pytest.importorskip("liteparse")

    class P:
        def parse(self, path):
            raise liteparse.ParseTimeoutError("boom", source="scan.pdf", timeout=180.0)

    res, timed_out = lp_mod._run_parse(P(), "scan.pdf")
    assert res is None
    assert timed_out is True


def test_run_parse_reports_generic_failure():
    import app.core.ingestion.liteparse_parser as lp_mod

    class P:
        def parse(self, path):
            raise ValueError("boom")

    res, timed_out = lp_mod._run_parse(P(), "scan.pdf")
    assert res is None
    assert timed_out is False


def test_is_timeout_error_by_name():
    import app.core.ingestion.liteparse_parser as lp_mod

    class ParseTimeoutError(Exception):
        pass

    assert lp_mod._is_timeout_error(ParseTimeoutError()) is True
    assert lp_mod._is_timeout_error(ValueError()) is False


def test_ocr_timeout_retries_without_ocr(monkeypatch, tmp_path):
    """On OCR timeout, parse retries native-only and reports degraded success."""
    import app.core.ingestion.liteparse_parser as lp_mod

    pytest.importorskip("liteparse")

    scan = tmp_path / "scan.pdf"
    scan.write_bytes(b"%PDF-1.4\n% not really parseable\n%%EOF")

    class _Page:
        page_num = 1
        text = "native layer text"
        blocks = []

    class _Res:
        pages = [_Page()]
        text = "native layer text"
        total_pages = 1
        images = []

    calls = {"n": 0}

    def fake_run_parse(parser, path):
        calls["n"] += 1
        if calls["n"] == 1:
            return None, True          # OCR pass timed out
        return _Res(), False           # native retry succeeds

    monkeypatch.setattr(lp_mod, "_liteparse", lambda: object())
    monkeypatch.setattr(lp_mod, "_decide_ocr", lambda p: True)
    monkeypatch.setattr(lp_mod, "_get_parser", lambda ocr: f"parser(ocr={ocr})")
    monkeypatch.setattr(lp_mod, "_run_parse", fake_run_parse)
    monkeypatch.setattr(settings, "liteparse_extract_images", False)

    doc = lp_mod.parse_pdf_with_liteparse(str(scan), "doc-timeout")

    assert doc is not None
    assert calls["n"] == 2
    assert doc.ocr_used is False
    assert doc.ocr_timed_out is True
    assert "native layer text" in doc.full_text
