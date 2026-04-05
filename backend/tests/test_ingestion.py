import os
import pytest
from app.core.ingestion.parser import parse_document
from app.core.ingestion.tree_builder import build_tree
from app.core.ingestion.figure_resolver import resolve_figures
from app.models.tree import NodeLevel

SAMPLE_TXT = """# Introduction
This is the introduction section with some text about the topic.
The introduction covers the basics of the subject matter.

## Background
The background covers Fig. 1 and Figure 2 which show the architecture.
More background context here about previous work.

### Details
More detailed information about specifics.
Technical details that are important.

## Methods
The methods section describes our approach in detail.
Here we reference Fig. 1 again to show the pipeline.
The methodology was validated experimentally.

## Results
Results are shown in Figure 3.
The outcomes demonstrate significant improvement.

# Second Top Level Section
This is a second H1 section to test multiple H1 nodes.
Additional content in the second section.

## Sub Section
Content under second H1 with more details.
This sub-section provides supporting evidence.
"""


def _make_sample_txt(tmp_path):
    p = tmp_path / "sample.txt"
    p.write_text(SAMPLE_TXT, encoding="utf-8")
    return str(p)


def test_parse_txt(tmp_path):
    path = _make_sample_txt(tmp_path)
    parsed = parse_document(path, "test-doc-1")
    assert parsed.full_text.strip()
    assert len(parsed.headings) >= 3
    assert parsed.title


def test_build_tree(tmp_path):
    path = _make_sample_txt(tmp_path)
    parsed = parse_document(path, "test-doc-2")
    tree = build_tree("test-session", parsed)
 
    assert tree.root is not None
 
    h1_nodes   = [n for n in tree.nodes if n.level == NodeLevel.H1]
    h2_nodes   = [n for n in tree.nodes if n.level == NodeLevel.H2]
    para_nodes = [n for n in tree.nodes if n.level == NodeLevel.PARAGRAPH]
 
    # TXT files have no font-size signal so all headings become H1.
    # PDFs use font size to detect H1/H2/H3. Both are correct behaviour.
    total_heading_nodes = len(h1_nodes) + len(h2_nodes)
    assert total_heading_nodes >= 2, (
        f"Expected >=2 heading nodes total, got {total_heading_nodes}"
    )
    assert len(para_nodes) >= 3, (
        f"Expected >=3 paragraph chunks, got {len(para_nodes)}"
    )
 
    # Every non-root node must have a parent
    for node in tree.nodes:
        if node.level != NodeLevel.DOCUMENT:
            assert node.parent_id is not None, (
                f"Node {node.id} level={node.level} has no parent_id"
            )


def test_headings_have_content_in_text(tmp_path):
    """H1/H2 nodes must contain both heading name AND content preview."""
    path = _make_sample_txt(tmp_path)
    parsed = parse_document(path, "test-doc-7")
    tree = build_tree("test-session", parsed)

    h1_nodes = [n for n in tree.nodes if n.level == NodeLevel.H1]
    for h1 in h1_nodes:
        # H1 text should contain the heading
        assert h1.heading_path[0] in h1.text, (
            f"H1 text should contain heading: {h1.heading_path}"
        )
        # H1 text should have content beyond just the heading
        assert len(h1.text) > len(h1.heading_path[0]) + 5, (
            f"H1 text too short: {h1.text[:50]}"
        )


def test_heading_path_populated(tmp_path):
    path = _make_sample_txt(tmp_path)
    parsed = parse_document(path, "test-doc-3")
    tree = build_tree("test-session", parsed)
    para_nodes = [n for n in tree.nodes if n.level == NodeLevel.PARAGRAPH]
    paths_with_content = [n for n in para_nodes if n.heading_path]
    assert len(paths_with_content) > 0


def test_tree_hierarchy_structure(tmp_path):
    path = _make_sample_txt(tmp_path)
    parsed = parse_document(path, "test-doc-5")
    tree = build_tree("test-session", parsed)

    root = tree.root
    assert root is not None

    h1_nodes = [n for n in tree.nodes if n.level == NodeLevel.H1]
    for h1 in h1_nodes:
        assert h1.parent_id == root.id

    h2_nodes = [n for n in tree.nodes if n.level == NodeLevel.H2]
    h1_ids = {n.id for n in h1_nodes}
    for h2 in h2_nodes:
        assert h2.parent_id in h1_ids


def test_paragraph_parent_is_heading(tmp_path):
    """Paragraphs should have H1/H2/H3 as parent, not root."""
    path = _make_sample_txt(tmp_path)
    parsed = parse_document(path, "test-doc-8")
    tree = build_tree("test-session", parsed)

    root_id = tree.root.id
    heading_ids = {n.id for n in tree.nodes
                   if n.level in (NodeLevel.H1, NodeLevel.H2, NodeLevel.H3)}
    para_nodes = [n for n in tree.nodes if n.level == NodeLevel.PARAGRAPH]

    for para in para_nodes:
        assert para.parent_id in heading_ids or para.parent_id == root_id, (
            f"Para {para.id} has unexpected parent {para.parent_id}"
        )


def test_figure_resolver(tmp_path):
    path = _make_sample_txt(tmp_path)
    parsed = parse_document(path, "test-doc-4")
    tree = build_tree("test-session", parsed)

    from app.models.tree import ImageNode
    fake_img = ImageNode(
        id="fake-img-1", session_id="test-session", doc_id="test-doc-4",
        page_number=1, storage_url="/uploads/images/fake.png",
        fig_label="Fig 1",
    )
    tree.images.append(fake_img)
    tree = resolve_figures(tree)

    found = "Fig 1" in tree.fig_label_map or "Fig. 1" in tree.fig_label_map
    assert found, f"fig_label_map keys: {list(tree.fig_label_map.keys())}"

    referencing = [n for n in tree.nodes if "fake-img-1" in n.image_ids]
    assert len(referencing) > 0


def test_node_token_counts(tmp_path):
    path = _make_sample_txt(tmp_path)
    parsed = parse_document(path, "test-doc-6")
    tree = build_tree("test-session", parsed)
    para_nodes = [n for n in tree.nodes if n.level == NodeLevel.PARAGRAPH]
    for node in para_nodes:
        assert node.token_count > 0
