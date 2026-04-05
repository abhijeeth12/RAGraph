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


class DBService:
    def __init__(self):
        self._pool: Optional[asyncpg.Pool] = None

    # ─── Connection ───────────────────────────────────────────────────────

    async def connect(self) -> None:
        self._pool = await asyncpg.create_pool(
            settings.postgres_url,
            min_size=2,
            max_size=10,
            command_timeout=30,
        )
        await self._create_tables()
        logger.info(f"PostgreSQL connected -> {settings.postgres_url.split('@')[-1]}")

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
                CREATE TABLE IF NOT EXISTS documents (
                    id TEXT PRIMARY KEY,
                    user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
                    session_id TEXT,
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
                    h1_count INTEGER DEFAULT 0,
                    h2_count INTEGER DEFAULT 0,
                    h3_count INTEGER DEFAULT 0,
                    paragraph_count INTEGER DEFAULT 0,
                    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                    ingested_at TIMESTAMPTZ
                )
            """)
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS conversations (
                    id TEXT PRIMARY KEY,
                    user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
                    session_id TEXT,
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
        async with self._pool.acquire() as conn:
            await conn.execute(
                """INSERT INTO users (id, email, password_hash, name, avatar, provider)
                   VALUES ($1, $2, $3, $4, $5, $6)
                   ON CONFLICT (email) DO NOTHING""",
                user_id, email.lower().strip(), password_hash, name, avatar, provider,
            )
        return await self.get_user_by_id(user_id)

    async def get_user_by_email(self, email: str) -> Optional[dict]:
        async with self._pool.acquire() as conn:
            row = await conn.fetchrow(
                "SELECT * FROM users WHERE email = $1",
                email.lower().strip(),
            )
        return self._row_to_dict(row)

    async def get_user_by_id(self, user_id: str) -> Optional[dict]:
        async with self._pool.acquire() as conn:
            row = await conn.fetchrow(
                "SELECT * FROM users WHERE id = $1", user_id,
            )
        return self._row_to_dict(row)

    async def update_user(self, user_id: str, **fields) -> Optional[dict]:
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
        async with self._pool.acquire() as conn:
            row = await conn.fetchrow(
                "SELECT * FROM sessions WHERE token = $1 AND expires_at > NOW()",
                token,
            )
        return self._row_to_dict(row)

    async def get_session_by_id(self, session_id: str) -> Optional[dict]:
        async with self._pool.acquire() as conn:
            row = await conn.fetchrow(
                "SELECT * FROM sessions WHERE id = $1 AND expires_at > NOW()",
                session_id,
            )
        return self._row_to_dict(row)

    async def delete_session(self, token: str) -> None:
        async with self._pool.acquire() as conn:
            await conn.execute("DELETE FROM sessions WHERE token = $1", token)

    async def delete_user_sessions(self, user_id: str) -> None:
        async with self._pool.acquire() as conn:
            await conn.execute("DELETE FROM sessions WHERE user_id = $1", user_id)

    async def delete_expired_sessions(self) -> int:
        async with self._pool.acquire() as conn:
            result = await conn.execute(
                "DELETE FROM sessions WHERE expires_at <= NOW()"
            )
        count = int(result.split()[-1]) if result else 0
        if count:
            logger.info(f"Cleaned up {count} expired sessions")
        return count

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
    ) -> Optional[dict]:
        async with self._pool.acquire() as conn:
            await conn.execute(
                """INSERT INTO documents
                   (id, user_id, session_id, filename, original_filename,
                    mime_type, storage_path, file_size)
                   VALUES ($1, $2, $3, $4, $5, $6, $7, $8)""",
                doc_id, user_id, session_id, filename, original_filename,
                mime_type, storage_path, file_size,
            )
        return await self.get_document(doc_id)

    async def get_document(self, doc_id: str) -> Optional[dict]:
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
                "page_count", "node_count", "image_count",
                "h1_count", "h2_count", "h3_count", "paragraph_count",
            ):
                set_parts.append(f"{k} = ${idx}")
                values.append(v)
                idx += 1

        values.append(doc_id)
        query = f"UPDATE documents SET {', '.join(set_parts)} WHERE id = ${idx}"
        async with self._pool.acquire() as conn:
            await conn.execute(query, *values)

    async def list_documents_by_user(self, user_id: str) -> list[dict]:
        async with self._pool.acquire() as conn:
            rows = await conn.fetch(
                "SELECT * FROM documents WHERE user_id = $1 ORDER BY created_at DESC",
                user_id,
            )
        return [self._row_to_dict(r) for r in rows]

    async def list_documents_by_session(self, session_id: str) -> list[dict]:
        async with self._pool.acquire() as conn:
            rows = await conn.fetch(
                "SELECT * FROM documents WHERE session_id = $1 AND user_id IS NULL ORDER BY created_at DESC",
                session_id,
            )
        return [self._row_to_dict(r) for r in rows]

    async def list_documents_by_owner(self, user_id: Optional[str], session_id: Optional[str]) -> list[dict]:
        """Get documents for owner — user_id takes precedence over session_id."""
        if user_id:
            return await self.list_documents_by_user(user_id)
        if session_id:
            return await self.list_documents_by_session(session_id)
        return []

    async def delete_document(self, doc_id: str) -> None:
        async with self._pool.acquire() as conn:
            await conn.execute("DELETE FROM documents WHERE id = $1", doc_id)

    async def delete_session_documents(self, session_id: str) -> int:
        async with self._pool.acquire() as conn:
            result = await conn.execute(
                "DELETE FROM documents WHERE session_id = $1 AND user_id IS NULL",
                session_id,
            )
        return int(result.split()[-1]) if result else 0

    async def get_document_count(self, user_id: Optional[str], session_id: Optional[str]) -> int:
        """Get total document count for numbering."""
        async with self._pool.acquire() as conn:
            if user_id:
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
    # CONVERSATIONS (authenticated users only)
    # ═══════════════════════════════════════════════════════════════════════

    async def create_conversation(
        self,
        user_id: str,
        title: str,
        model: Optional[str] = None,
        focus: str = "all",
        conv_id: Optional[str] = None,
    ) -> dict:
        conv_id = conv_id or str(uuid.uuid4())
        now = datetime.now(UTC)
        async with self._pool.acquire() as conn:
            await conn.execute(
                """INSERT INTO conversations (id, user_id, title, model, focus, created_at, updated_at)
                   VALUES ($1, $2, $3, $4, $5, $6, $6)""",
                conv_id, user_id, title, model, focus, now,
            )
        return {
            "id": conv_id,
            "user_id": user_id,
            "title": title,
            "model": model,
            "focus": focus,
            "created_at": now.isoformat(),
            "updated_at": now.isoformat(),
        }

    async def get_conversation(self, conv_id: str) -> Optional[dict]:
        async with self._pool.acquire() as conn:
            row = await conn.fetchrow(
                "SELECT * FROM conversations WHERE id = $1", conv_id,
            )
        return self._row_to_dict(row)

    async def list_conversations_by_user(self, user_id: str) -> list[dict]:
        async with self._pool.acquire() as conn:
            rows = await conn.fetch(
                "SELECT * FROM conversations WHERE user_id = $1 ORDER BY updated_at DESC",
                user_id,
            )
        return [self._row_to_dict(r) for r in rows]

    async def update_conversation(self, conv_id: str, **fields) -> None:
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
        async with self._pool.acquire() as conn:
            await conn.execute("DELETE FROM conversations WHERE id = $1", conv_id)

    async def delete_user_conversations(self, user_id: str) -> None:
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
        async with self._pool.acquire() as conn:
            await conn.execute(
                """INSERT INTO document_conversation_map (document_id, conversation_id)
                   VALUES ($1, $2) ON CONFLICT DO NOTHING""",
                document_id, conversation_id,
            )

    async def get_conversation_documents(self, conversation_id: str) -> list[dict]:
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
        token_hash = hashlib.sha256(token.encode()).hexdigest()
        async with self._pool.acquire() as conn:
            await conn.execute(
                """INSERT INTO revoked_tokens (token_hash, expires_at)
                   VALUES ($1, $2) ON CONFLICT DO NOTHING""",
                token_hash, expires_at,
            )

    async def is_token_revoked(self, token: str) -> bool:
        token_hash = hashlib.sha256(token.encode()).hexdigest()
        async with self._pool.acquire() as conn:
            row = await conn.fetchrow(
                "SELECT 1 FROM revoked_tokens WHERE token_hash = $1",
                token_hash,
            )
        return row is not None

    async def cleanup_expired_tokens(self) -> int:
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
        self, user_id: Optional[str], session_id: Optional[str],
    ) -> dict[str, int]:
        """Returns {doc_id: sequential_number} for citation mapping."""
        docs = await self.list_documents_by_owner(user_id, session_id)
        # Sort by created_at ascending for stable numbering
        docs.sort(key=lambda d: d.get("created_at", ""))
        return {doc["id"]: i + 1 for i, doc in enumerate(docs)}

    async def get_doc_name_map(
        self, user_id: Optional[str], session_id: Optional[str],
    ) -> dict[str, str]:
        """Returns {doc_id: original_filename} for citation display."""
        docs = await self.list_documents_by_owner(user_id, session_id)
        return {doc["id"]: doc["original_filename"] for doc in docs}


db_service = DBService()
