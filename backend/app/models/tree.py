from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from enum import Enum
import uuid


class NodeLevel(str, Enum):
    DOCUMENT  = "document"
    H1        = "h1"
    H2        = "h2"
    H3        = "h3"
    PARAGRAPH = "paragraph"


class TreeNode(BaseModel):
    model_config = ConfigDict(use_enum_values=True)

    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    doc_id: str
    level: NodeLevel
    parent_id: Optional[str] = None
    heading_path: list[str] = []
    text: str
    summary: Optional[str] = None
    token_count: int = 0
    char_start: int = 0
    char_end: int = 0
    page_number: Optional[int] = None
    image_ids: list[str] = []
    embedding: Optional[list[float]] = None


class ImageNode(BaseModel):
    """
    Image node with spatial + semantic context fusion.

    Spatial Y-coord association (from prev project) +
    CLIP + caption + heading embedding fusion.

    Composite embedding = clip*0.40 + caption*0.25
                        + heading*0.20 + paragraph*0.15
    """
    model_config = ConfigDict(use_enum_values=True)

    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    doc_id: str
    page_number: int
    storage_url: str

    # Caption / label
    caption: Optional[str] = None
    fig_label: Optional[str] = None

    # Spatial association (Y-coord from prev project — preserved)
    spatial_nearest_heading: Optional[str] = None
    spatial_y_coord: Optional[float] = None
    spatial_distance_to_heading: Optional[float] = None

    # Semantic context
    nearest_heading: Optional[str] = None
    heading_path: list[str] = []
    surrounding_text: str = ""
    alt_text: Optional[str] = None
    width: Optional[int] = None
    height: Optional[int] = None
    image_ext: str = "png"

    # Composite embedding weights
    clip_weight: float = 0.40
    caption_weight: float = 0.25
    heading_weight: float = 0.20
    paragraph_weight: float = 0.15

    # Populated during ingestion
    clip_embedding: Optional[list[float]] = None
    composite_embedding: Optional[list[float]] = None


class FigureLabelMap(BaseModel):
    doc_id: str
    mapping: dict[str, str] = {}
    reference_map: dict[str, list[str]] = {}


class DocumentTree(BaseModel):
    doc_id: str
    title: str
    source_filename: str
    total_pages: int
    nodes: list[TreeNode] = []
    images: list[ImageNode] = []
    fig_label_map: dict[str, str] = {}

    @property
    def root(self) -> Optional[TreeNode]:
        return next(
            (n for n in self.nodes if n.level == NodeLevel.DOCUMENT),
            None,
        )

    def children_of(self, node_id: str) -> list[TreeNode]:
        return [n for n in self.nodes if n.parent_id == node_id]

    def leaves(self) -> list[TreeNode]:
        return [n for n in self.nodes if n.level == NodeLevel.PARAGRAPH]
