from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache
from typing import Literal


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # App
    app_name: str = "RAGraph"
    app_env: Literal["development", "production"] = "development"
    app_port: int = 8000
    secret_key: str = "change-me"
    cors_origins: str = "http://localhost:3000"

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",")]

    # LLM
    openai_api_key: str = ""
    openai_base_url: str = "https://openrouter.ai/api/v1"
    anthropic_api_key: str = ""
    default_llm: str = "openrouter/free"

    @property
    def using_openrouter(self) -> bool:
        return bool(self.openai_base_url) and "openrouter" in self.openai_base_url.lower()

    # Model map
    @property
    def openrouter_model_map(self) -> dict[str, str]:
        return {
            # Paid
            "gpt-4o":            "openai/gpt-4o",
            "gpt-4o-mini":       "openai/gpt-4o-mini",
            "claude-3-5-sonnet": "anthropic/claude-3.5-sonnet",

            # Free
            "llama-3.1-8b": "mistralai/mistral-7b-instruct:free",
            "gemma-2-9b":   "mistralai/mistral-7b-instruct:free",
            "phi-3-mini":   "microsoft/phi-3-mini-128k-instruct:free",

            # Normalization
            "google/gemma-2-9b-it:free": "mistralai/mistral-7b-instruct:free",
            "mistralai/mistral-7b-instruct:free": "mistralai/mistral-7b-instruct:free",
            "microsoft/phi-3-mini-128k-instruct:free": "microsoft/phi-3-mini-128k-instruct:free",
        }

    def resolve_model(self, model: str) -> str:
        if not model:
            return self.default_llm

        model = model.strip()

        if self.using_openrouter:
            return self.openrouter_model_map.get(model, model)

        return model

    def resolve_cheap_model(self) -> str:
        if self.using_openrouter:
            return "openrouter/free"
        return "gpt-4o-mini"

    def resolve_generation_model(self) -> str:
        if self.using_openrouter:
            return self.resolve_model(self.default_llm)
        return self.default_llm

    # Embeddings
    embedding_model: str = "local"
    embedding_dim: int = 384
    local_embedding_model: str = "all-MiniLM-L6-v2"

    # Qdrant
    qdrant_url: str = "http://localhost:6333"
    qdrant_api_key: str = ""
    qdrant_text_collection: str = "ragraph_text"
    qdrant_image_collection: str = "ragraph_images"

    # Redis
    redis_url: str = "redis://localhost:6379/0"
    cache_ttl_seconds: int = 3600

    # MongoDB
    mongodb_url: str = "mongodb://localhost:27017"
    mongodb_db: str = "ragraph"

    # Cohere
    cohere_api_key: str = ""

    # Storage
    storage_backend: Literal["local", "s3"] = "local"
    local_storage_path: str = "./uploads"
    aws_bucket_name: str = ""
    aws_region: str = "us-east-1"
    aws_access_key_id: str = ""
    aws_secret_access_key: str = ""

    # LangSmith
    langchain_tracing_v2: bool = False
    langchain_api_key: str = ""
    langchain_project: str = "ragraph"

    # Retrieval tuning
    tree_similarity_threshold_l1: float = 0.30
    tree_similarity_threshold_l2: float = 0.25
    tree_similarity_threshold_l3: float = 0.20
    beam_width: int = 3
    top_k_final: int = 8
    rerank_top_n: int = 20

    # HyDE
    hyde_enabled: bool = True

    # Dual-path fallback
    dual_path_fallback_threshold: float = 0.50
    heading_similarity_threshold: float = 0.65

    # Chunking
    chunk_size_tokens: int = 300
    chunk_overlap_tokens: int = 40
    max_image_context_tokens: int = 150

    @property
    def is_dev(self) -> bool:
        return self.app_env == "development"


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()