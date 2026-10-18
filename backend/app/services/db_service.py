"""
PostgreSQL database service — full persistence layer.

Tables: users, sessions, documents, conversations, messages,
        document_conversation_map, revoked_tokens
"""
import asyncpg
import uuid
import hashlib
from typing import Optional
from datetime import datetime, timedelta, UTC
from loguru import logger

from app.config import settings


class NotebookNotFoundError(Exception):
    """Raised when a referenced notebook does not exist (FK would be violated)."""

    def __init__(self, notebook_id: Optional[str] = None):
        self.notebook_id = notebook_id
        super().__init__(f"Notebook not found: {notebook_id}")


class NotebookConflictError(Exception):
    """Raised when creating a notebook whose id already belongs to another owner."""

    def __init__(self, notebook_id: Optional[str] = None):
        self.notebook_id = notebook_id
        super().__init__(f"Notebook id already in use: {notebook_id}")


class DBService:
    def __init__(self):
        self._pool: Optional[asyncpg.Pool] = None

    # ─── Connection ───────────────────────────────────────────────────────

    @property
    def is_connected(self) -> bool:
        return self._pool is not None

    def _require_pool(self):
        if self._pool is None:
            from fastapi import HTTPException
            raise HTTPException(status_code=503, detail="Database unavailable — PostgreSQL not connected")

    async def connect(self) -> bool:
        import ssl
        import asyncio
        from urllib.parse import urlsplit, urlunsplit, parse_qs, urlencode

        # Support POSTGRES_URL, DATABASE_URL, and NEON_DATABASE_URL
        url = settings.effective_postgres_url if hasattr(settings, "effective_postgres_url") else settings.postgres_url

        if not url:
            logger.warning("POSTGRES_URL/DATABASE_URL not set — running without database (degraded mode)")
            return False

        # Parse DSN components
        parts = urlsplit(url)
        query_params = parse_qs(parts.query)
        hostname = (parts.hostname or "").lower()

        # Determine SSL requirement
        is_cloud_db = any(domain in hostname for domain in ("neon.tech", "render.com", "supabase.co", "aws.", "aivencloud.com"))
        sslmode = query_params.get("sslmode", [""])[0].lower()
        requires_ssl = is_cloud_db or sslmode in ("require", "verify-ca", "verify-full") or "sslmode=require" in url

        # Detect Neon / PgBouncer connection pooler (transaction pooling mode)
        # Neon pooler hostnames typically contain '-pooler'
        is_neon_pooler = "-pooler" in hostname or "pooler." in hostname

        kwargs = {
            "min_size": 2,
            "max_size": 10,
            "command_timeout": 30,
            # Serverless optimization: refresh connections before Neon's 5-minute auto-suspend
            "max_inactive_connection_lifetime": 180.0,
        }

        # For PgBouncer / Neon pooled connections, prepared statement caching must be disabled
        if is_neon_pooler:
            logger.info("Neon/PgBouncer pooler endpoint detected: disabling prepared statement cache (statement_cache_size=0)")
            kwargs["statement_cache_size"] = 0

        if requires_ssl:
            ctx = ssl.create_default_context()
            ctx.check_hostname = False
            ctx.verify_mode = ssl.CERT_NONE
            kwargs["ssl"] = ctx

        # Strip libpq-specific query parameters unsupported by asyncpg DSN parser
        cleaned_query_params = {
            k: v for k, v in query_params.items()
            if k.lower() not in ("sslmode", "channel_binding", "endpoint")
        }
        cleaned_query = urlencode(cleaned_query_params, doseq=True)
        clean_url = urlunsplit((
            parts.scheme,
            parts.netloc,
            parts.path,
            cleaned_query,
            parts.fragment,
        ))

        retries = 5
        for attempt in range(retries):
            try:
                self._pool = await asyncpg.create_pool(clean_url, **kwargs)
                await self._create_tables()
                safe_host = parts.netloc.split('@')[-1] if '@' in parts.netloc else parts.netloc
                logger.info(f"PostgreSQL connected -> {safe_host} (pooler={is_neon_pooler}, ssl={requires_ssl})")
                return True
            except Exception as e:
                if attempt < retries - 1:
                    logger.warning(f"Database connection failed (attempt {attempt+1}/{retries}): {e}. Retrying in 5s...")
                    await asyncio.sleep(5)
                else:
                    logger.error(f"Failed to connect to database after {retries} attempts: {e}")
                    logger.warning("Starting without database — health endpoint will report degraded; DB operations will return 503 until connected.")
                    return False
        return False

    async def close(self) -> None:
        if self._pool:
            await self._pool.close()
            logger.info("PostgreSQL pool closed")

    # ─── Schema ───────────────────────────────────────────────────────────

    async def _create_tables(self) -> None:
        async with self._pool.acquire() as conn:
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id TEXT PRIMARY KEY,
                    email TEXT UNIQUE NOT NULL,
                    name TEXT,
                    avatar TEXT,
                    provider TEXT NOT NULL DEFAULT 'email',
                    password_hash TEXT,
                    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                )
            """)
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS sessions (
                    id TEXT PRIMARY KEY,
                    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
                    token TEXT UNIQUE NOT NULL,
                    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                    expires_at TIMESTAMPTZ NOT NULL
                )
            """)
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS notebooks (
                    id TEXT PRIMARY KEY,
                    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
                    session_id TEXT,
                    title TEXT NOT NULL,
                    description TEXT,
                    model TEXT DEFAULT 'openrouter/free',
                    focus TEXT DEFAULT 'all',
                    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                )
            """)
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS documents (
                    id TEXT PRIMARY KEY,
                    user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
                    session_id TEXT,
                    notebook_id TEXT REFERENCES notebooks(id) ON DELETE CASCADE,
                    filename TEXT NOT NULL,
                    original_filename TEXT NOT NULL,
                    mime_type TEXT NOT NULL,
                    storage_path TEXT NOT NULL,
                    file_size INTEGER DEFAULT 0,
                    status TEXT NOT NULL DEFAULT 'queued',
                    error_message TEXT,
                    page_count INTEGER DEFAULT 0,
                    node_count INTEGER DEFAULT 0,
                    image_count INTEGER DEFAULT 0,
                    table_count INTEGER DEFAULT 0,
                    h1_count INTEGER DEFAULT 0,
                    h2_count INTEGER DEFAULT 0,
                    h3_count INTEGER DEFAULT 0,
                    paragraph_count INTEGER DEFAULT 0,
                    extraction_method TEXT,
                    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                    ingested_at TIMESTAMPTZ
                )
            """)
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS conversations (
                    id TEXT PRIMARY KEY,
                    user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
                    session_id TEXT,
                    notebook_id TEXT REFERENCES notebooks(id) ON DELETE CASCADE,
                    title TEXT NOT NULL,
                    model TEXT,
                    focus TEXT DEFAULT 'all',
                    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                )
            """)
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS messages (
                    id TEXT PRIMARY KEY,
                    conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
                    role TEXT NOT NULL,
                    content TEXT NOT NULL,
                    sources_json TEXT,
                    images_json TEXT,
                    citations_json TEXT,
                    related_json TEXT,
                    meta_json TEXT,
                    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                )
            """)
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS document_conversation_map (
                    document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
                    conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
                    PRIMARY KEY (document_id, conversation_id)
                )
            """)
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS revoked_tokens (
                    token_hash TEXT PRIMARY KEY,
                    revoked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                    expires_at TIMESTAMPTZ NOT NULL
                )
            """)
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS knowledge_maps (
                    scope_key TEXT PRIMARY KEY,
                    owner_key TEXT NOT NULL,
                    doc_ids_json TEXT NOT NULL DEFAULT '[]',
                    doc_count INTEGER NOT NULL DEFAULT 0,
                    outline_json TEXT,
                    graph_json TEXT,
                    status TEXT NOT NULL DEFAULT 'empty',
                    error_message TEXT,
                    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                )
            """)
            await conn.execute(
                "CREATE INDEX IF NOT EXISTS idx_notebooks_user ON notebooks(user_id)"
            )
            await conn.execute(
                "CREATE INDEX IF NOT EXISTS idx_notebooks_session ON notebooks(session_id)"
            )
            await conn.execute(
                "CREATE INDEX IF NOT EXISTS idx_knowledge_maps_owner ON knowledge_maps(owner_key)"
            )
            # Indexes
            await conn.execute(
                "CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id)"
            )
            await conn.execute(
                "CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token)"
            )
            await conn.execute(
                "CREATE INDEX IF NOT EXISTS idx_documents_user ON documents(user_id)"
            )
            await conn.execute(
                "CREATE INDEX IF NOT EXISTS idx_documents_session ON documents(session_id)"
            )
            await conn.execute(
                "CREATE INDEX IF NOT EXISTS idx_conversations_user ON conversations(user_id)"
            )
            await conn.execute(
                "CREATE INDEX IF NOT EXISTS idx_messages_conv ON messages(conversation_id)"
            )
            await conn.execute(
                "CREATE INDEX IF NOT EXISTS idx_revoked_hash ON revoked_tokens(token_hash)"
            )
            # Migrations: ensure notebook_id exists on documents and conversations
            await conn.execute("""
                DO $$ BEGIN
                    ALTER TABLE documents ADD COLUMN notebook_id TEXT REFERENCES notebooks(id) ON DELETE CASCADE;
                EXCEPTION WHEN duplicate_column THEN NULL;
                END $$;
            """)
            await conn.execute(
                "CREATE INDEX IF NOT EXISTS idx_documents_notebook ON documents(notebook_id)"
            )
            await conn.execute("""
                DO $$ BEGIN
                    ALTER TABLE conversations ADD COLUMN notebook_id TEXT REFERENCES notebooks(id) ON DELETE CASCADE;
                EXCEPTION WHEN duplicate_column THEN NULL;
                END $$;
            """)
            await conn.execute(
                "CREATE INDEX IF NOT EXISTS idx_conversations_notebook ON conversations(notebook_id)"
            )
            # Migrate: add outline_json and graph_json columns if they don't exist yet.
            await conn.execute("""
                DO $$ BEGIN
                    ALTER TABLE documents ADD COLUMN outline_json TEXT;
                EXCEPTION WHEN duplicate_column THEN NULL;
                END $$;
            """)
            await conn.execute("""
                DO $$ BEGIN
                    ALTER TABLE documents ADD COLUMN graph_json TEXT;
                EXCEPTION WHEN duplicate_column THEN NULL;
                END $$;
            """)
            # Migrate: structural extraction metadata (LiteParse integration).
            await conn.execute("""
                DO $$ BEGIN
                    ALTER TABLE documents ADD COLUMN table_count INTEGER DEFAULT 0;
                EXCEPTION WHEN duplicate_column THEN NULL;
                END $$;
            """)
            await conn.execute("""
                DO $$ BEGIN
                    ALTER TABLE documents ADD COLUMN extraction_method TEXT;
                EXCEPTION WHEN duplicate_column THEN NULL;
                END $$;
            """)
        logger.info("Database tables and indexes verified")

    # ─── Helpers ──────────────────────────────────────────────────────────

    def _row_to_dict(self, row: asyncpg.Record) -> dict:
        return dict(row) if row else None

    # ═══════════════════════════════════════════════════════════════════════
    # USERS
    # ═══════════════════════════════════════════════════════════════════════

    async def create_user(
        self,
        user_id: str,
        email: str,
        password_hash: Optional[str] = None,
        name: Optional[str] = None,
        avatar: Optional[str] = None,
        provider: str = "email",
    ) -> Optional[dict]:
        self._require_pool()
        async with self._pool.acquire() as conn:
            await conn.execute(
                """INSERT INTO users (id, email, password_hash, name, avatar, provider)
                   VALUES ($1, $2, $3, $4, $5, $6)
                   ON CONFLICT (email) DO NOTHING""",
                user_id, email.lower().strip(), password_hash, name, avatar, provider,
            )
        return await self.get_user_by_id(user_id)

    async def get_user_by_email(self, email: str) -> Optional[dict]:
        self._require_pool()
        async with self._pool.acquire() as conn:
            row = await conn.fetchrow(
                "SELECT * FROM users WHERE email = $1",
                email.lower().strip(),
            )
        return self._row_to_dict(row)

    async def get_user_by_id(self, user_id: str) -> Optional[dict]:
        self._require_pool()
        async with self._pool.acquire() as conn:
            row = await conn.fetchrow(
                "SELECT * FROM users WHERE id = $1", user_id,
            )
        return self._row_to_dict(row)

    async def update_user(self, user_id: str, **fields) -> Optional[dict]:
        self._require_pool()
        if not fields:
            return await self.get_user_by_id(user_id)
        set_parts = []
        values = []
        for i, (k, v) in enumerate(fields.items(), 1):
            set_parts.append(f"{k} = ${i}")
            values.append(v)
        values.append(user_id)
        query = f"UPDATE users SET {', '.join(set_parts)} WHERE id = ${len(values)}"
        async with self._pool.acquire() as conn:
            await conn.execute(query, *values)
        return await self.get_user_by_id(user_id)

    # ═══════════════════════════════════════════════════════════════════════
    # SESSIONS
    # ═══════════════════════════════════════════════════════════════════════

    async def create_session(
        self,
        user_id: Optional[str] = None,
        expire_hours: int = 24,
    ) -> dict:
        self._require_pool()
        session_id = str(uuid.uuid4())
        token = str(uuid.uuid4())
        expires_at = datetime.now(UTC) + timedelta(hours=expire_hours)
        async with self._pool.acquire() as conn:
            await conn.execute(
                """INSERT INTO sessions (id, user_id, token, expires_at)
                   VALUES ($1, $2, $3, $4)""",
                session_id, user_id, token, expires_at,
            )
        return {
            "id": session_id,
            "user_id": user_id,
            "token": token,
            "expires_at": expires_at.isoformat(),
        }

    async def get_session(self, token: str) -> Optional[dict]:
        self._require_pool()
        async with self._pool.acquire() as conn:
            row = await conn.fetchrow(
                "SELECT * FROM sessions WHERE token = $1 AND expires_at > NOW()",
                token,
            )
        return self._row_to_dict(row)

    async def get_session_by_id(self, session_id: str) -> Optional[dict]:
        self._require_pool()
        async with self._pool.acquire() as conn:
            row = await conn.fetchrow(
                "SELECT * FROM sessions WHERE id = $1 AND expires_at > NOW()",
                session_id,
            )
        return self._row_to_dict(row)

    async def delete_session(self, token: str) -> None:
        self._require_pool()
        async with self._pool.acquire() as conn:
            await conn.execute("DELETE FROM sessions WHERE token = $1", token)

    async def delete_user_sessions(self, user_id: str) -> None:
        self._require_pool()
        async with self._pool.acquire() as conn:
            await conn.execute("DELETE FROM sessions WHERE user_id = $1", user_id)

    async def delete_expired_sessions(self) -> int:
        self._require_pool()
        async with self._pool.acquire() as conn:
            result = await conn.execute(
                "DELETE FROM sessions WHERE expires_at <= NOW()"
            )
        count = int(result.split()[-1]) if result else 0
        if count:
            logger.info(f"Cleaned up {count} expired sessions")
        return count

    # ═══════════════════════════════════════════════════════════════════════
    # NOTEBOOKS
    # ═══════════════════════════════════════════════════════════════════════

    async def create_notebook(
        self,
        notebook_id: str,
        user_id: Optional[str],
        session_id: Optional[str],
        title: str,
        description: Optional[str] = None,
        model: str = "openrouter/free",
        focus: str = "all",
    ) -> Optional[dict]:
        """Idempotently create a notebook.

        Safe under concurrency and retries: a repeated request for the same id
        returns the existing row instead of raising a duplicate-key error, as
        long as the caller is the same owner. If the id is already owned by a
        *different* owner, ``NotebookConflictError`` is raised so callers never
        silently hijack another tenant's notebook.
        """
        self._require_pool()
        now = datetime.now(UTC)
        async with self._pool.acquire() as conn:
            inserted = await conn.fetchrow(
                """INSERT INTO notebooks (id, user_id, session_id, title, description, model, focus, created_at, updated_at)
                   VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8)
                   ON CONFLICT (id) DO NOTHING
                   RETURNING id""",
                notebook_id, user_id, session_id, title, description, model, focus, now,
            )
            if inserted is None:
                # Id already exists — enforce ownership before returning it.
                existing = await conn.fetchrow(
                    "SELECT user_id, session_id FROM notebooks WHERE id = $1",
                    notebook_id,
                )
                if existing is None:  # pragma: no cover - transient race
                    raise NotebookNotFoundError(notebook_id)
                same_user = user_id is not None and existing["user_id"] == user_id
                same_session = (
                    user_id is None
                    and session_id is not None
                    and existing["session_id"] == session_id
                    and existing["user_id"] is None
                )
                if not (same_user or same_session):
                    raise NotebookConflictError(notebook_id)
        return await self.get_notebook(notebook_id)

    async def get_notebook(self, notebook_id: str) -> Optional[dict]:
        self._require_pool()
        async with self._pool.acquire() as conn:
            row = await conn.fetchrow(
                """SELECT n.*,
                          COALESCE((SELECT COUNT(*) FROM documents d WHERE d.notebook_id = n.id), 0) AS document_count,
                          COALESCE((SELECT COUNT(*) FROM conversations c WHERE c.notebook_id = n.id), 0) AS conversation_count
                   FROM notebooks n WHERE n.id = $1""",
                notebook_id,
            )
        return self._row_to_dict(row)

    async def list_notebooks(
        self, user_id: Optional[str], session_id: Optional[str]
    ) -> list[dict]:
        self._require_pool()
        async with self._pool.acquire() as conn:
            if user_id:
                rows = await conn.fetch(
                    """SELECT n.*,
                              COALESCE((SELECT COUNT(*) FROM documents d WHERE d.notebook_id = n.id), 0) AS document_count,
                              COALESCE((SELECT COUNT(*) FROM conversations c WHERE c.notebook_id = n.id), 0) AS conversation_count
                       FROM notebooks n
                       WHERE n.user_id = $1
                       ORDER BY n.updated_at DESC""",
                    user_id,
                )
            elif session_id:
                rows = await conn.fetch(
                    """SELECT n.*,
                              COALESCE((SELECT COUNT(*) FROM documents d WHERE d.notebook_id = n.id), 0) AS document_count,
                              COALESCE((SELECT COUNT(*) FROM conversations c WHERE c.notebook_id = n.id), 0) AS conversation_count
                       FROM notebooks n
                       WHERE n.session_id = $1 AND n.user_id IS NULL
                       ORDER BY n.updated_at DESC""",
                    session_id,
                )
            else:
                return []
        return [self._row_to_dict(r) for r in rows]

    async def update_notebook(self, notebook_id: str, **fields) -> Optional[dict]:
        self._require_pool()
        if not fields:
            return await self.get_notebook(notebook_id)
        fields["updated_at"] = datetime.now(UTC)
        set_parts = []
        values = []
        for i, (k, v) in enumerate(fields.items(), 1):
            set_parts.append(f"{k} = ${i}")
            values.append(v)
        values.append(notebook_id)
        query = f"UPDATE notebooks SET {', '.join(set_parts)} WHERE id = ${len(values)}"
        async with self._pool.acquire() as conn:
            await conn.execute(query, *values)
        return await self.get_notebook(notebook_id)

    async def delete_notebook(self, notebook_id: str) -> None:
        self._require_pool()
        async with self._pool.acquire() as conn:
            await conn.execute("DELETE FROM notebooks WHERE id = $1", notebook_id)

    async def verify_notebook_ownership(
        self, notebook_id: str, user_id: Optional[str], session_id: Optional[str]
    ) -> bool:
        nb = await self.get_notebook(notebook_id)
        if not nb:
            return False
        if user_id and nb.get("user_id") == user_id:
            return True
        if session_id and nb.get("session_id") == session_id and nb.get("user_id") is None:
            return True
        return False

    # ═══════════════════════════════════════════════════════════════════════
    # DOCUMENTS
    # ═══════════════════════════════════════════════════════════════════════

    async def create_document(
        self,
        doc_id: str,
        user_id: Optional[str],
        session_id: Optional[str],
        filename: str,
        original_filename: str,
        mime_type: str,
        storage_path: str,
        file_size: int = 0,
        notebook_id: Optional[str] = None,
    ) -> Optional[dict]:
        self._require_pool()
        async with self._pool.acquire() as conn:
            try:
                await conn.execute(
                    """INSERT INTO documents
                       (id, user_id, session_id, notebook_id, filename, original_filename,
                        mime_type, storage_path, file_size)
                       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)""",
                    doc_id, user_id, session_id, notebook_id, filename, original_filename,
                    mime_type, storage_path, file_size,
                )
            except asyncpg.ForeignKeyViolationError as e:
                # The notebook was deleted/replaced between validation and insert,
                # or an unknown notebook id was supplied. Surface as a typed error
                # so the API can return a structured 404 instead of a raw 500.
                raise NotebookNotFoundError(notebook_id) from e
            if notebook_id:
                await conn.execute(
                    "UPDATE notebooks SET updated_at = NOW() WHERE id = $1", notebook_id
                )
        return await self.get_document(doc_id)

    async def get_document(self, doc_id: str) -> Optional[dict]:
        self._require_pool()
        async with self._pool.acquire() as conn:
            row = await conn.fetchrow(
                "SELECT * FROM documents WHERE id = $1", doc_id,
            )
        return self._row_to_dict(row)

    async def update_document_status(
        self,
        doc_id: str,
        status: str,
        error_message: Optional[str] = None,
        **counts,
    ) -> None:
        self._require_pool()
        set_parts = ["status = $1"]
        values = [status]
        idx = 2

        if error_message is not None:
            set_parts.append(f"error_message = ${idx}")
            values.append(error_message)
            idx += 1

        if status == "done":
            set_parts.append(f"ingested_at = ${idx}")
            values.append(datetime.now(UTC))
            idx += 1

        for k, v in counts.items():
            if k in (
                "page_count", "node_count", "image_count", "table_count",
                "h1_count", "h2_count", "h3_count", "paragraph_count",
                "extraction_method",
            ):
                set_parts.append(f"{k} = ${idx}")
                values.append(v)
                idx += 1

        values.append(doc_id)
        query = f"UPDATE documents SET {', '.join(set_parts)} WHERE id = ${idx}"
        async with self._pool.acquire() as conn:
            await conn.execute(query, *values)

    async def list_documents_by_notebook(self, notebook_id: str) -> list[dict]:
        self._require_pool()
        async with self._pool.acquire() as conn:
            rows = await conn.fetch(
                "SELECT * FROM documents WHERE notebook_id = $1 ORDER BY created_at ASC",
                notebook_id,
            )
        return [self._row_to_dict(r) for r in rows]

    async def list_documents_by_user(self, user_id: str, notebook_id: Optional[str] = None) -> list[dict]:
        self._require_pool()
        async with self._pool.acquire() as conn:
            if notebook_id:
                rows = await conn.fetch(
                    "SELECT * FROM documents WHERE user_id = $1 AND notebook_id = $2 ORDER BY created_at ASC",
                    user_id, notebook_id,
                )
            else:
                rows = await conn.fetch(
                    "SELECT * FROM documents WHERE user_id = $1 ORDER BY created_at DESC",
                    user_id,
                )
        return [self._row_to_dict(r) for r in rows]

    async def list_documents_by_session(self, session_id: str, notebook_id: Optional[str] = None) -> list[dict]:
        self._require_pool()
        async with self._pool.acquire() as conn:
            if notebook_id:
                rows = await conn.fetch(
                    "SELECT * FROM documents WHERE session_id = $1 AND user_id IS NULL AND notebook_id = $2 ORDER BY created_at ASC",
                    session_id, notebook_id,
                )
            else:
                rows = await conn.fetch(
                    "SELECT * FROM documents WHERE session_id = $1 AND user_id IS NULL ORDER BY created_at DESC",
                    session_id,
                )
        return [self._row_to_dict(r) for r in rows]

    async def list_documents_by_owner(
        self,
        user_id: Optional[str],
        session_id: Optional[str],
        notebook_id: Optional[str] = None,
    ) -> list[dict]:
        """Get documents for owner — strictly scoped to notebook_id if provided."""
        if notebook_id:
            return await self.list_documents_by_notebook(notebook_id)
        if user_id:
            return await self.list_documents_by_user(user_id)
        if session_id:
            return await self.list_documents_by_session(session_id)
        return []

    async def delete_document(self, doc_id: str) -> None:
        self._require_pool()
        async with self._pool.acquire() as conn:
            await conn.execute("DELETE FROM documents WHERE id = $1", doc_id)

    async def delete_session_documents(self, session_id: str) -> int:
        self._require_pool()
        async with self._pool.acquire() as conn:
            result = await conn.execute(
                "DELETE FROM documents WHERE session_id = $1 AND user_id IS NULL",
                session_id,
            )
        return int(result.split()[-1]) if result else 0

    async def get_document_count(
        self,
        user_id: Optional[str],
        session_id: Optional[str],
        notebook_id: Optional[str] = None,
    ) -> int:
        self._require_pool()
        """Get document count for numbering."""
        async with self._pool.acquire() as conn:
            if notebook_id:
                row = await conn.fetchrow(
                    "SELECT COUNT(*) as cnt FROM documents WHERE notebook_id = $1", notebook_id,
                )
            elif user_id:
                row = await conn.fetchrow(
                    "SELECT COUNT(*) as cnt FROM documents WHERE user_id = $1", user_id,
                )
            elif session_id:
                row = await conn.fetchrow(
                    "SELECT COUNT(*) as cnt FROM documents WHERE session_id = $1 AND user_id IS NULL",
                    session_id,
                )
            else:
                return 0
        return row["cnt"] if row else 0

    async def verify_document_ownership(
        self, doc_id: str, user_id: Optional[str], session_id: Optional[str],
    ) -> bool:
        """Verify that doc belongs to this user or session."""
        doc = await self.get_document(doc_id)
        if not doc:
            return False
        if user_id and doc["user_id"] == user_id:
            return True
        if session_id and doc["session_id"] == session_id and doc["user_id"] is None:
            return True
        return False

    # ═══════════════════════════════════════════════════════════════════════
    # CONVERSATIONS
    # ═══════════════════════════════════════════════════════════════════════

    async def create_conversation(
        self,
        user_id: Optional[str],
        title: str,
        model: Optional[str] = None,
        focus: str = "all",
        conv_id: Optional[str] = None,
        notebook_id: Optional[str] = None,
        session_id: Optional[str] = None,
    ) -> dict:
        self._require_pool()
        conv_id = conv_id or str(uuid.uuid4())
        now = datetime.now(UTC)
        async with self._pool.acquire() as conn:
            try:
                await conn.execute(
                    """INSERT INTO conversations (id, user_id, session_id, notebook_id, title, model, focus, created_at, updated_at)
                       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8)""",
                    conv_id, user_id, session_id, notebook_id, title, model, focus, now,
                )
            except asyncpg.ForeignKeyViolationError as e:
                raise NotebookNotFoundError(notebook_id) from e
            if notebook_id:
                await conn.execute(
                    "UPDATE notebooks SET updated_at = NOW() WHERE id = $1", notebook_id
                )
        return {
            "id": conv_id,
            "user_id": user_id,
            "session_id": session_id,
            "notebook_id": notebook_id,
            "title": title,
            "model": model,
            "focus": focus,
            "created_at": now.isoformat(),
            "updated_at": now.isoformat(),
        }

    async def get_conversation(self, conv_id: str) -> Optional[dict]:
        self._require_pool()
        async with self._pool.acquire() as conn:
            row = await conn.fetchrow(
                "SELECT * FROM conversations WHERE id = $1", conv_id,
            )
        return self._row_to_dict(row)

    async def list_conversations_by_notebook(self, notebook_id: str) -> list[dict]:
        self._require_pool()
        async with self._pool.acquire() as conn:
            rows = await conn.fetch(
                "SELECT * FROM conversations WHERE notebook_id = $1 ORDER BY updated_at DESC",
                notebook_id,
            )
        return [self._row_to_dict(r) for r in rows]

    async def list_conversations_by_user(self, user_id: str, notebook_id: Optional[str] = None) -> list[dict]:
        self._require_pool()
        async with self._pool.acquire() as conn:
            if notebook_id:
                rows = await conn.fetch(
                    "SELECT * FROM conversations WHERE user_id = $1 AND notebook_id = $2 ORDER BY updated_at DESC",
                    user_id, notebook_id,
                )
            else:
                rows = await conn.fetch(
                    "SELECT * FROM conversations WHERE user_id = $1 ORDER BY updated_at DESC",
                    user_id,
                )
        return [self._row_to_dict(r) for r in rows]

    async def list_conversations_by_owner(
        self, user_id: Optional[str], session_id: Optional[str], notebook_id: Optional[str] = None
    ) -> list[dict]:
        if notebook_id:
            return await self.list_conversations_by_notebook(notebook_id)
        if user_id:
            return await self.list_conversations_by_user(user_id)
        if session_id:
            self._require_pool()
            async with self._pool.acquire() as conn:
                rows = await conn.fetch(
                    "SELECT * FROM conversations WHERE session_id = $1 AND user_id IS NULL ORDER BY updated_at DESC",
                    session_id,
                )
            return [self._row_to_dict(r) for r in rows]
        return []

    async def update_conversation(self, conv_id: str, **fields) -> None:
        self._require_pool()
        fields["updated_at"] = datetime.now(UTC)
        set_parts = []
        values = []
        for i, (k, v) in enumerate(fields.items(), 1):
            set_parts.append(f"{k} = ${i}")
            values.append(v)
        values.append(conv_id)
        query = f"UPDATE conversations SET {', '.join(set_parts)} WHERE id = ${len(values)}"
        async with self._pool.acquire() as conn:
            await conn.execute(query, *values)

    async def delete_conversation(self, conv_id: str) -> None:
        self._require_pool()
        async with self._pool.acquire() as conn:
            await conn.execute("DELETE FROM conversations WHERE id = $1", conv_id)

    async def delete_user_conversations(self, user_id: str) -> None:
        self._require_pool()
        async with self._pool.acquire() as conn:
            await conn.execute("DELETE FROM conversations WHERE user_id = $1", user_id)

    # ═══════════════════════════════════════════════════════════════════════
    # MESSAGES
    # ═══════════════════════════════════════════════════════════════════════

    async def create_message(
        self,
        conversation_id: str,
        role: str,
        content: str,
        sources_json: Optional[str] = None,
        images_json: Optional[str] = None,
        citations_json: Optional[str] = None,
        related_json: Optional[str] = None,
        meta_json: Optional[str] = None,
    ) -> dict:
        self._require_pool()
        msg_id = str(uuid.uuid4())
        now = datetime.now(UTC)
        async with self._pool.acquire() as conn:
            await conn.execute(
                """INSERT INTO messages
                   (id, conversation_id, role, content,
                    sources_json, images_json, citations_json,
                    related_json, meta_json, created_at)
                   VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)""",
                msg_id, conversation_id, role, content,
                sources_json, images_json, citations_json,
                related_json, meta_json, now,
            )
        # Update conversation.updated_at
        await self.update_conversation(conversation_id)
        return {
            "id": msg_id,
            "conversation_id": conversation_id,
            "role": role,
            "content": content,
            "created_at": now.isoformat(),
        }

    async def list_messages(self, conversation_id: str) -> list[dict]:
        self._require_pool()
        async with self._pool.acquire() as conn:
            rows = await conn.fetch(
                "SELECT * FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC",
                conversation_id,
            )
        return [self._row_to_dict(r) for r in rows]

    # ═══════════════════════════════════════════════════════════════════════
    # DOCUMENT ↔ CONVERSATION MAP
    # ═══════════════════════════════════════════════════════════════════════

    async def link_document_to_conversation(
        self, document_id: str, conversation_id: str,
    ) -> None:
        self._require_pool()
        async with self._pool.acquire() as conn:
            await conn.execute(
                """INSERT INTO document_conversation_map (document_id, conversation_id)
                   VALUES ($1, $2) ON CONFLICT DO NOTHING""",
                document_id, conversation_id,
            )

    async def get_conversation_documents(self, conversation_id: str) -> list[dict]:
        self._require_pool()
        async with self._pool.acquire() as conn:
            rows = await conn.fetch(
                """SELECT d.* FROM documents d
                   JOIN document_conversation_map m ON d.id = m.document_id
                   WHERE m.conversation_id = $1""",
                conversation_id,
            )
        return [self._row_to_dict(r) for r in rows]

    # ═══════════════════════════════════════════════════════════════════════
    # TOKEN BLACKLIST (for refresh token rotation)
    # ═══════════════════════════════════════════════════════════════════════

    async def revoke_token(self, token: str, expires_at: datetime) -> None:
        self._require_pool()
        token_hash = hashlib.sha256(token.encode()).hexdigest()
        async with self._pool.acquire() as conn:
            await conn.execute(
                """INSERT INTO revoked_tokens (token_hash, expires_at)
                   VALUES ($1, $2) ON CONFLICT DO NOTHING""",
                token_hash, expires_at,
            )

    async def is_token_revoked(self, token: str) -> bool:
        self._require_pool()
        token_hash = hashlib.sha256(token.encode()).hexdigest()
        async with self._pool.acquire() as conn:
            row = await conn.fetchrow(
                "SELECT 1 FROM revoked_tokens WHERE token_hash = $1",
                token_hash,
            )
        return row is not None

    async def cleanup_expired_tokens(self) -> int:
        self._require_pool()
        async with self._pool.acquire() as conn:
            result = await conn.execute(
                "DELETE FROM revoked_tokens WHERE expires_at <= NOW()"
            )
        count = int(result.split()[-1]) if result else 0
        if count:
            logger.info(f"Cleaned up {count} expired revoked tokens")
        return count

    # ═══════════════════════════════════════════════════════════════════════
    # DOC NUMBER + NAME MAPS (used by search for citation building)
    # ═══════════════════════════════════════════════════════════════════════

    async def get_doc_number_map(
        self, user_id: Optional[str], session_id: Optional[str], notebook_id: Optional[str] = None,
    ) -> dict[str, int]:
        """Returns {doc_id: sequential_number} for citation mapping."""
        docs = await self.list_documents_by_owner(user_id, session_id, notebook_id=notebook_id)
        # Sort by created_at ascending for stable numbering
        docs.sort(key=lambda d: d.get("created_at", ""))
        return {doc["id"]: i + 1 for i, doc in enumerate(docs)}

    async def get_doc_name_map(
        self, user_id: Optional[str], session_id: Optional[str], notebook_id: Optional[str] = None,
    ) -> dict[str, str]:
        """Returns {doc_id: original_filename} for citation display."""
        docs = await self.list_documents_by_owner(user_id, session_id, notebook_id=notebook_id)
        return {doc["id"]: doc["original_filename"] for doc in docs}

    # ═══════════════════════════════════════════════════════════════════════
    # OUTLINE + KNOWLEDGE GRAPH (stored in PostgreSQL to survive Render restarts)
    # ═══════════════════════════════════════════════════════════════════════

    async def update_document_kg(
        self,
        doc_id: str,
        outline_json: Optional[str] = None,
        graph_json: Optional[str] = None,
    ) -> None:
        """Persist serialised outline and/or graph JSON into the documents row."""
        self._require_pool()
        if outline_json is None and graph_json is None:
            return
        set_parts: list[str] = []
        values: list = []
        if outline_json is not None:
            set_parts.append(f"outline_json = ${len(values)+1}")
            values.append(outline_json)
        if graph_json is not None:
            set_parts.append(f"graph_json = ${len(values)+1}")
            values.append(graph_json)
        values.append(doc_id)
        query = f"UPDATE documents SET {', '.join(set_parts)} WHERE id = ${len(values)}"
        async with self._pool.acquire() as conn:
            await conn.execute(query, *values)

    async def get_document_outline_data(self, doc_id: str) -> Optional[str]:
        """Return the stored outline_json TEXT for a document, or None."""
        self._require_pool()
        async with self._pool.acquire() as conn:
            row = await conn.fetchrow(
                "SELECT outline_json FROM documents WHERE id = $1", doc_id
            )
        return row["outline_json"] if row else None

    async def get_document_graph_data(self, doc_id: str) -> Optional[str]:
        """Return the stored graph_json TEXT for a document, or None."""
        self._require_pool()
        async with self._pool.acquire() as conn:
            row = await conn.fetchrow(
                "SELECT graph_json FROM documents WHERE id = $1", doc_id
            )
        return row["graph_json"] if row else None

    async def get_documents_with_kg(
        self,
        user_id: Optional[str],
        session_id: Optional[str],
    ) -> list[dict]:
        """Return documents list including outline_json and graph_json columns."""
        self._require_pool()
        async with self._pool.acquire() as conn:
            if user_id:
                rows = await conn.fetch(
                    "SELECT * FROM documents WHERE user_id = $1 ORDER BY created_at DESC",
                    user_id,
                )
            elif session_id:
                rows = await conn.fetch(
                    "SELECT * FROM documents WHERE session_id = $1 AND user_id IS NULL ORDER BY created_at DESC",
                    session_id,
                )
            else:
                return []
        return [self._row_to_dict(r) for r in rows]

    async def cleanup_old_guest_documents(self, hours: int = 24) -> int:
        """Find guest documents older than X hours and clean them up."""
        if self._pool is None:
            return 0
        from datetime import datetime, timedelta, UTC
        cutoff = datetime.now(UTC) - timedelta(hours=hours)
        
        async with self._pool.acquire() as conn:
            # Find distinct guest sessions with old documents
            rows = await conn.fetch(
                """SELECT DISTINCT session_id FROM documents 
                   WHERE user_id IS NULL AND created_at < $1""",
                cutoff
            )
            
        sessions_to_clean = [row["session_id"] for row in rows if row["session_id"]]
        
        cleaned_count = 0
        if sessions_to_clean:
            # We import the route handler logic to avoid code duplication
            from app.api.documents import cleanup_session
            for session_id in sessions_to_clean:
                try:
                    logger.info(f"Background cleanup: removing old guest session {session_id[:8]}")
                    await cleanup_session(session_id)
                    cleaned_count += 1
                except Exception as e:
                    logger.error(f"Failed to cleanup guest session {session_id}: {e}")
                    
        return cleaned_count

    # ═══════════════════════════════════════════════════════════════════════
    # KNOWLEDGE MAPS (one unified, on-demand map per notebook scope)
    # Scope = owner + exact document set. Data columns are written ONLY on
    # success, so a failed regeneration never destroys the previous map.
    # ═══════════════════════════════════════════════════════════════════════

    async def get_knowledge_map(self, scope_key: str) -> Optional[dict]:
        self._require_pool()
        async with self._pool.acquire() as conn:
            row = await conn.fetchrow(
                "SELECT * FROM knowledge_maps WHERE scope_key = $1", scope_key,
            )
        return self._row_to_dict(row)

    async def claim_knowledge_map_generation(
        self,
        scope_key: str,
        owner_key: str,
        doc_ids_json: str,
        doc_count: int,
        stale_seconds: int = 900,
    ) -> bool:
        """Claim the generation slot. Returns False when another generation
        for this scope is already running (fresh 'generating' status)."""
        self._require_pool()
        async with self._pool.acquire() as conn:
            row = await conn.fetchrow(
                "SELECT status, updated_at FROM knowledge_maps WHERE scope_key = $1",
                scope_key,
            )
            if row and row["status"] == "generating":
                age = (datetime.now(UTC) - row["updated_at"]).total_seconds()
                if age < stale_seconds:
                    return False
            await conn.execute(
                """INSERT INTO knowledge_maps
                   (scope_key, owner_key, doc_ids_json, doc_count, status, error_message, updated_at)
                   VALUES ($1, $2, $3, $4, 'generating', NULL, NOW())
                   ON CONFLICT (scope_key) DO UPDATE SET
                     owner_key = EXCLUDED.owner_key,
                     doc_ids_json = EXCLUDED.doc_ids_json,
                     doc_count = EXCLUDED.doc_count,
                     status = 'generating',
                     error_message = NULL,
                     updated_at = NOW()""",
                scope_key, owner_key, doc_ids_json, doc_count,
            )
        return True

    async def save_knowledge_map(
        self,
        scope_key: str,
        outline_json: str,
        graph_json: str,
    ) -> None:
        """Persist a successfully generated map (status -> done)."""
        self._require_pool()
        async with self._pool.acquire() as conn:
            await conn.execute(
                """UPDATE knowledge_maps
                   SET outline_json = $1, graph_json = $2,
                       status = 'done', error_message = NULL, updated_at = NOW()
                   WHERE scope_key = $3""",
                outline_json, graph_json, scope_key,
            )

    async def fail_knowledge_map(self, scope_key: str, error_message: str) -> None:
        """Mark generation failed WITHOUT touching stored map data."""
        self._require_pool()
        async with self._pool.acquire() as conn:
            await conn.execute(
                """UPDATE knowledge_maps
                   SET status = 'failed', error_message = $1, updated_at = NOW()
                   WHERE scope_key = $2""",
                (error_message or "")[:2000], scope_key,
            )

    async def latest_knowledge_map_for_owner(self, owner_key: str) -> Optional[dict]:
        """Newest successfully generated map for this owner, any doc set."""
        self._require_pool()
        async with self._pool.acquire() as conn:
            row = await conn.fetchrow(
                """SELECT * FROM knowledge_maps
                   WHERE owner_key = $1 AND status = 'done'
                     AND outline_json IS NOT NULL
                   ORDER BY updated_at DESC LIMIT 1""",
                owner_key,
            )
        return self._row_to_dict(row)

db_service = DBService()
