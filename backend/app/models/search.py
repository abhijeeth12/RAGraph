from pydantic import BaseModel, Field
from typing import Optional, Literal
from enum import Enum
import json


class FocusMode(str, Enum):
    ALL      = "all"
    ACADEMIC = "academic"
    CODE     = "code"
    NEWS     = "news"
    IMAGES   = "images"


class ModelChoice(str, Enum):
    GPT4O         = "gpt-4o"
    CLAUDE_SONNET = "claude-3-5-sonnet"


class ConversationMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class SearchRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=2000)
    model: ModelChoice = ModelChoice.GPT4O
    focus: FocusMode = FocusMode.ALL
    thread_id: Optional[str] = None
    conversation_history: list[ConversationMessage] = []
    image: Optional[str] = None
    use_hyde: bool = True
    use_dual_path: bool = True


class SourceItem(BaseModel):
    id: str
    title: str
    url: str
    domain: str
    snippet: str
    relevance_score: float
    heading_path: list[str] = []
    doc_id: Optional[str] = None


class ImageItem(BaseModel):
    id: str
    url: str
    caption: Optional[str] = None
    alt: Optional[str] = None
    source_title: str
    source_url: str
    heading_path: list[str] = []
    relevance_score: float
    width: Optional[int] = None
    height: Optional[int] = None


class StreamChunkType(str, Enum):
    TEXT    = "text"
    SOURCES = "sources"
    IMAGES  = "images"
    RELATED = "related"
    DONE    = "done"
    ERROR   = "error"


class StreamChunk(BaseModel):
    type: StreamChunkType
    content: str

    def to_sse(self) -> str:
        return f"data: {json.dumps(self.model_dump())}\n\n"


class SearchResponse(BaseModel):
    query: str
    answer: str
    sources: list[SourceItem] = []
    images: list[ImageItem] = []
    related_questions: list[str] = []
    model_used: str
    tokens_used: int = 0
    time_ms: int = 0
    hyde_used: bool = False
    dual_path_fallback_used: bool = False


class UploadResponse(BaseModel):
    doc_id: str
    filename: str
    status: Literal["queued", "processing", "done", "error"]
    message: str
    page_count: Optional[int] = None
    node_count: Optional[int] = None
    image_count: Optional[int] = None
