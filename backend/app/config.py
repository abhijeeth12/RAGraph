import os

from pydantic_settings import BaseSettings, SettingsConfigDict
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
        """Free model slugs verified live against https://openrouter.ai/api/v1/models on Oct 15, 2026.
        Free slugs churn often — re-check that endpoint when a :free model 404s."""
        return {
            # Paid
            "gpt-4o":            "openai/gpt-4o",
            "gpt-4o-mini":       "openai/gpt-4o-mini",
            "claude-3-5-sonnet": "anthropic/claude-3.5-sonnet",
            # Free, live as of Oct 15 2026 (old llama-3.3/mistral-small/gemma-3/hermes-3
            # :free slugs are dead — they now 404 with 'use the paid slug instead')
            "google/gemma-4-26b-a4b-it:free":  "google/gemma-4-26b-a4b-it:free",
            "google/gemma-4-31b-it:free":      "google/gemma-4-31b-it:free",
            "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free": "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
            "thinkingmachines/inkling-small:free": "thinkingmachines/inkling-small:free",
            "liquid/lfm-2.5-2.6b:free":        "liquid/lfm-2.5-2.6b:free",
            "openrouter/free":                  "openrouter/free",
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
            return self.default_llm or "openrouter/free"
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

    # ─── Caching master switch ──────────────────────────────────────────
    # False = every result/vector/file/model cache in the system is bypassed.
    # Each request hits Qdrant + Postgres + fresh BM25 directly (slower but
    # always fresh). Set CACHE_ENABLED=true to re-enable. Postgres remains
    # the durable source of truth (database, not a cache) and is untouched.
    cache_enabled: bool = False

    # ─── In-Memory Hierarchical Retrieval Engine ────────────────────────
    # True = Paragraph vectors and section hierarchy are retained in bounded
    # in-memory numpy matrices for sub-millisecond (~0.05ms) retrieval.
    # Automatically invalidated on document mutations.
    in_memory_retrieval_enabled: bool = True

    # ─── PostgreSQL (Neon / Render / Self-Hosted) ─────────────────────────
    postgres_url: str = "postgresql://ragraph:ragraph_dev@127.0.0.1:5433/ragraph"
    database_url: str = ""        # standard alias used by Neon, Render, Prisma, Vercel
    neon_database_url: str = ""   # explicit Neon connection string

    @property
    def effective_postgres_url(self) -> str:
        """Resolve postgres URL supporting POSTGRES_URL, DATABASE_URL, and NEON_DATABASE_URL.
        Prioritizes environment variables over defaults and normalizes postgres:// to postgresql://.
        """
        raw_default = "postgresql://ragraph:ragraph_dev@127.0.0.1:5433/ragraph"

        # Check explicit environment variables first
        for key in ("NEON_DATABASE_URL", "DATABASE_URL", "POSTGRES_URL"):
            val = os.getenv(key)
            if val and val.strip() and val.strip() != raw_default:
                return self._normalize_pg_url(val.strip())

        # Check pydantic model fields next
        for val in (self.neon_database_url, self.database_url, self.postgres_url):
            if val and val.strip() and val.strip() != raw_default:
                return self._normalize_pg_url(val.strip())

        return self._normalize_pg_url(self.postgres_url)

    @staticmethod
    def _normalize_pg_url(url: str) -> str:
        url = url.strip()
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql://", 1)
        return url


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

    # ─── In-Memory Vector Cache (Render 512MB budget) ─────────────────────
    # Maximum number of distinct owners cached simultaneously.
    # Each owner holds up to in_memory_max_paras paragraph vectors.
    # Reduce for memory-constrained deployments (e.g. Render free 512MB).
    in_memory_max_owners: int = 2
    # Maximum paragraphs cached per owner. 500 × 384 dims × 4B ≈ 0.8MB vectors per owner.
    in_memory_max_paras: int = 500

    # ─── Dual-path fallback ───────────────────────────────────────────────
    dual_path_fallback_threshold: float = 0.50
    heading_similarity_threshold: float = 0.65

    # ─── Chunking ─────────────────────────────────────────────────────────
    chunk_size_tokens: int = 400
    chunk_overlap_tokens: int = 80
    max_image_context_tokens: int = 150
    h1_summary_chars: int = 800             # chars of content included in H1 embeddings
    h2_summary_chars: int = 500             # chars of content included in H2 embeddings
    # Keep markdown table blocks (header + rows) intact as single chunks instead
    # of letting the token splitter cut the header away from its rows.
    table_aware_chunking: bool = True

    # ─── LiteParse (document extraction engine) ────────────────────────────
    # LiteParse (Rust/PDFium) replaces the legacy PyMuPDF chain for PDFs. It is
    # always used when importable; the legacy parser remains the fallback and
    # still handles DOCX/PPTX/TXT/MD.
    liteparse_enabled: bool = True
    # OCR policy:
    #   "auto"   -> run the cheap is_complex probe and only OCR documents whose
    #               text layer is missing/garbled (scanned, no-text, garbled).
    #               Digital PDFs with embedded figures are NOT OCR'd.
    #   "always" -> always enable OCR (slowest, most accurate for scans).
    #   "never"  -> native text layer only (fastest; matches legacy behaviour).
    liteparse_ocr: Literal["auto", "always", "never"] = "auto"
    liteparse_ocr_language: str = "eng"
    liteparse_extract_images: bool = True
    liteparse_min_image_bytes: int = 500    # skip tiny decorative images (matches legacy)
    liteparse_max_pages: int = 500          # bound per-document work / memory
    liteparse_dpi: float = 150.0
    liteparse_quiet: bool = True
    # Persistent worker-pool parsing (Python binding). pool_size=0 keeps parsing
    # in-process (lowest memory). pool_size>0 spawns worker processes so a hard
    # per-parse timeout (liteparse_parse_timeout) can kill a stuck worker.
    # The pool is applied to the OCR parser only — the cheap complexity probe
    # and the native (OCR-off) path stay in-process, so a scanned document that
    # would otherwise OCR forever can never run unbounded.
    liteparse_pool_size: int = 1
    liteparse_parse_timeout: float = 60.0  # seconds; max timeout for Step 1 document parsing

    @property
    def is_dev(self) -> bool:
        return self.app_env == "development"


def get_settings() -> Settings:
    # NOTE: intentionally no @lru_cache — part of the no-caching mandate.
    # Callers holding the module-level `settings` object are unaffected.
    return Settings()


settings = get_settings()