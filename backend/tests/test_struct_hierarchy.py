"""
Unit tests for Document Structure extraction, hierarchy building, and APIs.
"""
import pytest
from app.models.tree import DocumentTree, TreeNode, ImageNode, NodeLevel
from app.core.ingestion.structure_builder import (
    tree_to_document_structure,
    combine_document_structures,
    clean_node_preview,
)


def test_clean_node_preview():
    assert clean_node_preview("") == ""
    assert clean_node_preview("[Heading > Subheading] This is the text.", max_chars=30) == "This is the text."
    long_txt = "A" * 100
    res = clean_node_preview(long_txt, max_chars=20)
    assert len(res) <= 22
    assert res.endswith("…")


def test_tree_to_document_structure_full_hierarchy():
    """Verify H1 -> H2 -> H3 -> Paragraphs / Tables / Images structure."""
    doc_id = "test-doc-123"
    owner_id = "user-1"
    
    root_node = TreeNode(
        id="root-node",
        owner_id=owner_id,
        doc_id=doc_id,
        level=NodeLevel.DOCUMENT,
        text="Document Summary",
        page_number=1,
    )
    
    h1_node = TreeNode(
        id="h1-node",
        owner_id=owner_id,
        doc_id=doc_id,
        level=NodeLevel.H1,
        parent_id="root-node",
        heading_path=["Introduction"],
        text="Introduction\nSection overview",
        page_number=1,
        element_kind="heading",
    )
    
    h2_node = TreeNode(
        id="h2-node",
        owner_id=owner_id,
        doc_id=doc_id,
        level=NodeLevel.H2,
        parent_id="h1-node",
        heading_path=["Introduction", "Background"],
        text="Background\nDetailed history",
        page_number=2,
        element_kind="heading",
    )
    
    para_node = TreeNode(
        id="para-node",
        owner_id=owner_id,
        doc_id=doc_id,
        level=NodeLevel.PARAGRAPH,
        parent_id="h2-node",
        heading_path=["Introduction", "Background"],
        text="[Introduction > Background] This is paragraph content.",
        page_number=2,
        element_kind="paragraph",
    )
    
    table_node = TreeNode(
        id="table-node",
        owner_id=owner_id,
        doc_id=doc_id,
        level=NodeLevel.PARAGRAPH,
        parent_id="h2-node",
        heading_path=["Introduction", "Background"],
        text="| Col 1 | Col 2 |\n|---|---|\n| Val 1 | Val 2 |",
        page_number=3,
        element_kind="table",
    )
    
    img_node = ImageNode(
        id="img-node",
        owner_id=owner_id,
        doc_id=doc_id,
        page_number=2,
        storage_url="https://storage/img1.png",
        fig_label="Figure 1",
        caption="Architecture Diagram",
        heading_path=["Introduction", "Background"],
    )

    tree = DocumentTree(
        owner_id=owner_id,
        doc_id=doc_id,
        title="Research Paper",
        source_filename="paper.pdf",
        total_pages=5,
        nodes=[root_node, h1_node, h2_node, para_node, table_node],
        images=[img_node],
    )

    struct = tree_to_document_structure(tree)

    assert struct["name"] == "Research Paper"
    assert struct["level"] == "document"
    assert struct["element_kind"] == "document"
    assert len(struct["children"]) == 1

    h1_child = struct["children"][0]
    assert h1_child["name"] == "Introduction"
    assert h1_child["level"] == "h1"
    assert h1_child["element_kind"] == "heading"
    assert len(h1_child["children"]) == 1

    h2_child = h1_child["children"][0]
    assert h2_child["name"] == "Background"
    assert h2_child["level"] == "h2"
    assert h2_child["element_kind"] == "heading"
    assert len(h2_child["children"]) == 3  # paragraph, table, image

    child_kinds = {c["element_kind"] for c in h2_child["children"]}
    assert "paragraph" in child_kinds
    assert "table" in child_kinds
    assert "image" in child_kinds

    # Verify paragraph content stripped heading prefix
    p_child = next(c for c in h2_child["children"] if c["element_kind"] == "paragraph")
    assert "Introduction >" not in p_child["text"]
    assert "This is paragraph content." in p_child["text"]

    # Verify table element
    t_child = next(c for c in h2_child["children"] if c["element_kind"] == "table")
    assert "Table" in t_child["name"]
    assert t_child["page_number"] == 3


def test_combine_document_structures():
    doc1 = {"id": "d1", "name": "Document 1", "level": "document", "children": []}
    doc2 = {"id": "d2", "name": "Document 2", "level": "document", "children": []}

    # Empty
    empty = combine_document_structures([], "My Notebook")
    assert empty["name"] == "My Notebook"
    assert len(empty["children"]) == 0

    # Single doc -> preserved directly
    single = combine_document_structures([doc1], "My Notebook")
    assert single["name"] == "Document 1"
    assert single["id"] == "d1"

    # Multi doc -> nested under notebook root
    multi = combine_document_structures([doc1, doc2], "Multi Notebook")
    assert multi["name"] == "Notebook: Multi Notebook"
    assert len(multi["children"]) == 2
    assert multi["children"][0]["name"] == "Document 1"
    assert multi["children"][1]["name"] == "Document 2"


def test_tree_without_headings_flat_structure():
    """Verify graceful handling when document has no headings."""
    doc_id = "flat-doc"
    owner_id = "user-1"
    
    root_node = TreeNode(
        id="root-node",
        owner_id=owner_id,
        doc_id=doc_id,
        level=NodeLevel.DOCUMENT,
        text="Flat Document Summary",
        page_number=1,
    )
    para1 = TreeNode(
        id="p1",
        owner_id=owner_id,
        doc_id=doc_id,
        level=NodeLevel.PARAGRAPH,
        parent_id="root-node",
        text="First paragraph of plain document.",
        page_number=1,
    )
    para2 = TreeNode(
        id="p2",
        owner_id=owner_id,
        doc_id=doc_id,
        level=NodeLevel.PARAGRAPH,
        parent_id="root-node",
        text="Second paragraph of plain document.",
        page_number=2,
    )

    tree = DocumentTree(
        owner_id=owner_id,
        doc_id=doc_id,
        title="Notes.txt",
        source_filename="Notes.txt",
        total_pages=2,
        nodes=[root_node, para1, para2],
    )

    struct = tree_to_document_structure(tree)
    assert struct["name"] == "Notes"
    assert len(struct["children"]) == 2
    assert struct["children"][0]["level"] == "paragraph"
    assert struct["children"][1]["level"] == "paragraph"
