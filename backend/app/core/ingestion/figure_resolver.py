"""
Figure Resolver — maps 'Fig 1', 'Figure A' references in text
to their corresponding ImageNode IDs.

Innovation: goes beyond simple spatial association.
Builds a bidirectional map:
  fig_label → image_node_id
  paragraph_node_id → [image_node_ids referenced in that paragraph]

This lets the retriever surface images when a retrieved paragraph
says 'as shown in Fig 3' even if the image isn't spatially nearby.
"""
from __future__ import annotations
import re
from loguru import logger
from app.models.tree import DocumentTree, NodeLevel
from app.utils.text import extract_fig_references


def resolve_figures(tree: DocumentTree) -> DocumentTree:
    """
    Pass over all paragraph nodes and resolve figure references.
    Updates tree.fig_label_map and node.image_ids in place.
    Returns the updated tree.
    """
    # Build reverse map: fig_label -> image_node
    label_to_img = {img.fig_label: img for img in tree.images if img.fig_label}

    resolved_count = 0

    for node in tree.nodes:
        if node.level != NodeLevel.PARAGRAPH:
            continue

        refs = extract_fig_references(node.text)
        for ref in refs:
            # Normalise: 'Fig. 3' -> 'Fig 3', 'figure 3' -> 'Fig 3'
            normalised = _normalise_ref(ref)

            # Try exact match first
            img = label_to_img.get(ref) or label_to_img.get(normalised)

            # Try fuzzy: match just the number/letter part
            if not img:
                img = _fuzzy_match(ref, label_to_img)

            if img:
                if img.id not in node.image_ids:
                    node.image_ids.append(img.id)
                # Update surrounding text on image if empty
                if not img.surrounding_text:
                    img.surrounding_text = node.text[:400]
                    img.nearest_heading = node.heading_path[-1] if node.heading_path else None
                    img.heading_path = node.heading_path
                # Update global map
                tree.fig_label_map[ref] = img.id
                tree.fig_label_map[normalised] = img.id
                resolved_count += 1

    logger.info(f"Figure resolver: {resolved_count} references resolved "
                f"across {len(tree.images)} images")
    return tree


def _normalise_ref(ref: str) -> str:
    """Normalise fig reference: 'Figure 3a' -> 'Fig 3a'"""
    ref = re.sub(r"(?i)figure", "Fig", ref)
    ref = re.sub(r"\s*\.\s*", " ", ref)
    return ref.strip()


def _fuzzy_match(ref: str, label_map: dict) -> object:
    """Match by the numeric/letter part only."""
    num_part = re.search(r"[\d]+[a-zA-Z]?|[A-Z]$", ref)
    if not num_part:
        return None
    target = num_part.group()
    for label, img in label_map.items():
        if label and target in label:
            return img
    return None
