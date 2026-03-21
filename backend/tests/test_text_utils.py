from app.utils.text import (
    detect_heading, extract_heading_sections,
    chunk_document, extract_fig_references,
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
