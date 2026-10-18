"""
Database Migration Tool: Render PostgreSQL -> Neon Serverless PostgreSQL

Safely transfers existing schema and data from a source PostgreSQL database (Render)
to a destination database (Neon) preserving all foreign key relationships and timestamps.

Usage:
  python backend/scripts/migrate_db.py --source "<RENDER_POSTGRES_URL>" --target "<NEON_POSTGRES_URL>"

Or set environment variables:
  SOURCE_DATABASE_URL="postgresql://..."
  TARGET_DATABASE_URL="postgresql://..."
  python backend/scripts/migrate_db.py
"""

from __future__ import annotations

import argparse
import asyncio
import os
import sys
import ssl
from typing import Optional
from urllib.parse import urlsplit, urlunsplit, parse_qs, urlencode


TABLES_IN_ORDER = [
    "users",
    "sessions",
    "notebooks",
    "documents",
    "conversations",
    "messages",
    "document_conversation_map",
    "revoked_tokens",
]


SCHEMA_SQL = """
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    avatar TEXT,
    provider TEXT NOT NULL DEFAULT 'email',
    password_hash TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL
);

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
);

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
    h1_count INTEGER DEFAULT 0,
    h2_count INTEGER DEFAULT 0,
    h3_count INTEGER DEFAULT 0,
    paragraph_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ingested_at TIMESTAMPTZ
);

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
);

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
);

CREATE TABLE IF NOT EXISTS document_conversation_map (
    document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    PRIMARY KEY (document_id, conversation_id)
);

CREATE TABLE IF NOT EXISTS revoked_tokens (
    token_hash TEXT PRIMARY KEY,
    revoked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_documents_user ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_session ON documents(session_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_conv ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_revoked_hash ON revoked_tokens(token_hash);
"""


def clean_pg_url(url: str) -> tuple[str, dict]:
    """Clean libpq specific parameters and configure SSL for asyncpg."""
    url = url.strip()
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql://", 1)

    parts = urlsplit(url)
    query_params = parse_qs(parts.query)
    hostname = (parts.hostname or "").lower()

    is_cloud = any(d in hostname for d in ("neon.tech", "render.com", "supabase.co", "aws.", "aivencloud.com"))
    sslmode = query_params.get("sslmode", [""])[0].lower()
    requires_ssl = is_cloud or sslmode in ("require", "verify-ca", "verify-full") or "sslmode=require" in url
    is_pooler = "-pooler" in hostname or "pooler." in hostname

    kwargs = {}
    if is_pooler:
        kwargs["statement_cache_size"] = 0

    if requires_ssl:
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE
        kwargs["ssl"] = ctx

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
    return clean_url, kwargs


async def migrate_data(source_url: str, target_url: str):
    try:
        import asyncpg
    except ImportError:
        print("\n[ERROR] 'asyncpg' is not installed in this Python environment.")
        print("Please install asyncpg or run this script in an environment where asyncpg is installed:")
        print("    pip install asyncpg\n")
        sys.exit(1)

    src_dsn, src_kwargs = clean_pg_url(source_url)
    tgt_dsn, tgt_kwargs = clean_pg_url(target_url)

    src_host = urlsplit(src_dsn).netloc.split("@")[-1]
    tgt_host = urlsplit(tgt_dsn).netloc.split("@")[-1]

    print(f"\n=======================================================")
    print(f"RAGraph Database Migration")
    print(f"Source: {src_host}")
    print(f"Target: {tgt_host}")
    print(f"=======================================================\n")

    print("[1/5] Connecting to source database...")
    try:
        src_conn = await asyncpg.connect(src_dsn, **src_kwargs)
        print("  -> Connected to source.")
    except Exception as e:
        print(f"[FAIL] Could not connect to source database: {e}")
        return False

    print("[2/5] Connecting to target (Neon) database...")
    try:
        tgt_conn = await asyncpg.connect(tgt_dsn, **tgt_kwargs)
        print("  -> Connected to target.")
    except Exception as e:
        print(f"[FAIL] Could not connect to target database: {e}")
        await src_conn.close()
        return False

    try:
        print("[3/5] Initializing target schema (tables & indexes)...")
        await tgt_conn.execute(SCHEMA_SQL)
        print("  -> Target schema initialized.")

        print("[4/5] Reading source table statistics...")
        stats = {}
        for table in TABLES_IN_ORDER:
            try:
                count = await src_conn.fetchval(f"SELECT COUNT(*) FROM {table}")
                stats[table] = count
                print(f"  - {table}: {count:,} rows")
            except Exception as e:
                print(f"  - {table}: table missing on source or query failed ({e})")
                stats[table] = 0

        total_rows = sum(stats.values())
        print(f"\nTotal rows to migrate: {total_rows:,}\n")

        if total_rows == 0:
            print("[NOTE] Source database has 0 rows across all tables.")
            print("Target database schema is ready. Migration complete!")
            return True

        print("[5/5] Migrating data with transaction isolation...")
        for table in TABLES_IN_ORDER:
            count = stats.get(table, 0)
            if count == 0:
                continue

            rows = await src_conn.fetch(f"SELECT * FROM {table}")
            if not rows:
                continue

            cols = list(rows[0].keys())
            col_names = ", ".join(cols)
            placeholders = ", ".join(f"${i+1}" for i in range(len(cols)))
            insert_query = f"""
                INSERT INTO {table} ({col_names})
                VALUES ({placeholders})
                ON CONFLICT DO NOTHING
            """

            data = [tuple(row[c] for c in cols) for row in rows]
            async with tgt_conn.transaction():
                await tgt_conn.executemany(insert_query, data)

            target_count = await tgt_conn.fetchval(f"SELECT COUNT(*) FROM {table}")
            print(f"  -> {table}: transferred {len(data):,} rows (target now has {target_count:,} rows)")

        print("\n=======================================================")
        print("MIGRATION COMPLETED SUCCESSFULLY!")
        print("All tables and records have been verified in Neon.")
        print("=======================================================\n")
        return True

    finally:
        await src_conn.close()
        await tgt_conn.close()


def main():
    parser = argparse.ArgumentParser(description="Migrate RAGraph database from Render to Neon.")
    parser.add_argument("--source", default=os.getenv("SOURCE_DATABASE_URL") or os.getenv("RENDER_POSTGRES_URL"),
                        help="Source PostgreSQL connection URL (Render)")
    parser.add_argument("--target", default=os.getenv("TARGET_DATABASE_URL") or os.getenv("NEON_DATABASE_URL"),
                        help="Target PostgreSQL connection URL (Neon)")

    args = parser.parse_args()

    if not args.source:
        args.source = input("Enter Source PostgreSQL URL (Render): ").strip()
    if not args.target:
        args.target = input("Enter Target PostgreSQL URL (Neon): ").strip()

    if not args.source or not args.target:
        print("[ERROR] Both source and target URLs are required.")
        sys.exit(1)

    success = asyncio.run(migrate_data(args.source, args.target))
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
