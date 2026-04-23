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

    # ─── JWT ──────────────────────────────────────────────────────────────
    jwt_access_expire_minutes: int = 15
    jwt_refresh_expire_days: int = 7

    # ─── Google OAuth2 ────────────────────────────────────────────────────
    google_client_id: str = ""
    google_client_secret: str = ""
    google_redirect_uri: str = "http://localhost:3000/auth/callback"

    # ─── Rate Limiting ────────────────────────────────────────────────────
    rate_limit_auth: int = 5        # per minute per IP
    rate_limit_upload: int = 10     # per minute per owner
    rate_limit_search: int = 30     # per minute per owner

    # ─── Security ─────────────────────────────────────────────────────────
    csrf_enabled: bool = True
    secure_cookies: bool = False    # True in production (HTTPS)

    # ─── LLM ──────────────────────────────────────────────────────────────
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
        """Verified working free models on OpenRouter as of March 2026."""
        return {
            # Paid
            "gpt-4o":            "openai/gpt-4o",
            "gpt-4o-mini":       "openai/gpt-4o-mini",
            "claude-3-5-sonnet": "anthropic/claude-3.5-sonnet",
            # Free verified March 2026 (openrouter.ai/models?q=free)
            "meta-llama/llama-3.3-70b-instruct:free":         "meta-llama/llama-3.3-70b-instruct:free",
            "mistralai/mistral-small-3.1-24b-instruct:free":  "mistralai/mistral-small-3.1-24b-instruct:free",
            "google/gemma-3-27b-it:free":                     "google/gemma-3-27b-it:free",
            "nousresearch/hermes-3-llama-3.1-405b:free":      "nousresearch/hermes-3-llama-3.1-405b:free",
            "openrouter/free":                                 "openrouter/free",
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
            return "meta-llama/llama-3.3-70b-instruct:free"
        return "gpt-4o-mini"

    def resolve_generation_model(self) -> str:
        if self.using_openrouter:
            return self.resolve_model(self.default_llm)
        return self.default_llm

    # ─── Embeddings ───────────────────────────────────────────────────────
    embedding_model: str = "local"
    embedding_dim: int = 384
    local_embedding_model: str = "all-MiniLM-L6-v2"

    # ─── Qdrant ───────────────────────────────────────────────────────────
    qdrant_url: str = "http://localhost:6333"
    qdrant_api_key: str = ""
    qdrant_text_collection: str = "ragraph_text"
    qdrant_image_collection: str = "ragraph_images"

    # ─── Redis ────────────────────────────────────────────────────────────
    redis_url: str = "redis://localhost:6379/0"
    cache_ttl_seconds: int = 3600

    # ─── PostgreSQL ───────────────────────────────────────────────────────
    postgres_url: str = "postgresql://ragraph:ragraph_dev@127.0.0.1:5433/ragraph"

    # ─── Cohere ───────────────────────────────────────────────────────────
    cohere_api_key: str = ""

    # ─── Storage ──────────────────────────────────────────────────────────
    storage_backend: Literal["local", "s3"] = "local"
    local_storage_path: str = "./uploads"
    aws_bucket_name: str = ""
    aws_region: str = "us-east-1"
    aws_access_key_id: str = ""
    aws_secret_access_key: str = ""

    # ─── LangSmith ────────────────────────────────────────────────────────
    langchain_tracing_v2: bool = False
    langchain_api_key: str = ""
    langchain_project: str = "ragraph"

    # ─── Retrieval tuning ─────────────────────────────────────────────────
    tree_similarity_threshold_l1: float = 0.20
    tree_similarity_threshold_l2: float = 0.15
    tree_similarity_threshold_l3: float = 0.10
    beam_width: int = 5
    top_k_final: int = 10
    rerank_top_n: int = 30
    beam_adaptive_ratio: float = 0.85       # include H1s within 85% of top score
    structure_bonus: float = 0.05           # score bonus for beam-path paragraphs
    sibling_expansion_enabled: bool = True  # fetch sibling chunks after retrieval
    sibling_score_floor: float = 0.15       # min score to include a sibling

    # ─── HyDE ─────────────────────────────────────────────────────────────
    hyde_enabled: bool = False

    # ─── Dual-path fallback ───────────────────────────────────────────────
    dual_path_fallback_threshold: float = 0.50
    heading_similarity_threshold: float = 0.65

    # ─── Chunking ─────────────────────────────────────────────────────────
    chunk_size_tokens: int = 400
    chunk_overlap_tokens: int = 80
    max_image_context_tokens: int = 150
    h1_summary_chars: int = 800             # chars of content included in H1 embeddings
    h2_summary_chars: int = 500             # chars of content included in H2 embeddings

    @property
    def is_dev(self) -> bool:
        return self.app_env == "development"


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()