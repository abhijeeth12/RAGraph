from pydantic import BaseModel, Field, ConfigDict, field_serializer
from typing import Optional
from datetime import datetime
import uuid


class DocumentStatus:
    QUEUED    = "queued"
    PARSING   = "parsing"
    EMBEDDING = "embedding"
    INDEXING  = "indexing"
    DONE      = "done"
    ERROR     = "error"


class DocumentMetadata(BaseModel):
    model_config = ConfigDict(use_enum_values=True)

    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    filename: str
    original_filename: str
    mime_type: str
    storage_path: str
    status: str = DocumentStatus.QUEUED
    error_message: Optional[str] = None
    page_count: int = 0
    node_count: int = 0
    image_count: int = 0
    token_count: int = 0
    h1_count: int = 0
    h2_count: int = 0
    h3_count: int = 0
    paragraph_count: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    ingested_at: Optional[datetime] = None

    @field_serializer("created_at", "updated_at", "ingested_at")
    def serialize_dt(self, dt: Optional[datetime]) -> Optional[str]:
        return dt.isoformat() if dt else None
