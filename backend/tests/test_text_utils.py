from app.utils.text import (
    detect_heading, extract_heading_sections,
    chunk_document, extract_fig_references,
    chunk_with_tables, chunk_by_tokens,
)


def test_detect_markdown_heading():
    assert detect_heading("## Introduction") == "Introduction"


def test_detect_numbered_heading():
    assert detect_heading("1. Overview") == "1. Overview"


def test_no_heading_for_sentence():
    assert detect_heading("this is just a normal sentence.") is None


def test_extract_fig_references():
    text = "As shown in Fig. 3 and Figure A, the results confirm..."
    refs = extract_fig_references(text)
    assert len(refs) >= 1


def test_chunk_document_produces_chunks():
    text = "## Overview\nThis is the overview section.\n\n## Methods\nThese are the methods."
    chunks = chunk_document(text)
    assert len(chunks) >= 2


def _big_table(nrows: int) -> str:
    lines = ["| Territory | Factor | Notes |", "|---|---|---|"]
    for i in range(nrows):
        lines.append(f"| {i:03d} | {1.0 + i/100:.2f} | region-{i} |")
    return "\n".join(lines)


def test_chunk_with_tables_keeps_table_intact():
    # A table far larger than chunk_size must remain a single chunk with its
    # header and every row together.
    table = _big_table(120)
    before = "Intro paragraph. " * 40
    after = "Outro paragraph. " * 40
    text = f"{before}\n{table}\n{after}"
    chunks = chunk_with_tables(text, chunk_size=100, overlap=20)
    table_chunks = [c for c in chunks if c.lstrip().startswith("|")]
    assert len(table_chunks) == 1, [c[:40] for c in table_chunks]
    tc = table_chunks[0]
    assert "| Territory | Factor | Notes |" in tc
    assert "| 119 |" in tc          # last row present in the same chunk
    # No table row leaked into a non-table chunk.
    for c in chunks:
        if c is not table_chunks[0]:
            assert "| Territory | Factor | Notes |" not in c


def test_chunk_with_tables_matches_plain_chunking_without_tables():
    text = "Sentence one. " * 200
    assert chunk_with_tables(text, 100, 20) == chunk_by_tokens(text, 100, 20)
