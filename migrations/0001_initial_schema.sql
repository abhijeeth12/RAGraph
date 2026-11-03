-- Migration: 0001_initial_schema
-- Created: 2026-11-03
-- Purpose: Initialize full relational schema for RAGraph

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
    table_count INTEGER DEFAULT 0,
    h1_count INTEGER DEFAULT 0,
    h2_count INTEGER DEFAULT 0,
    h3_count INTEGER DEFAULT 0,
    paragraph_count INTEGER DEFAULT 0,
    extraction_method TEXT,
    outline_json TEXT,
    graph_json TEXT,
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

CREATE TABLE IF NOT EXISTS knowledge_maps (
    notebook_id TEXT PRIMARY KEY REFERENCES notebooks(id) ON DELETE CASCADE,
    scope_key TEXT,
    owner_key TEXT NOT NULL DEFAULT '',
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    session_id TEXT,
    doc_ids_json TEXT NOT NULL DEFAULT '[]',
    doc_count INTEGER NOT NULL DEFAULT 0,
    outline_json TEXT,
    graph_json TEXT,
    status TEXT NOT NULL DEFAULT 'empty',
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS schema_migrations (
    version INT PRIMARY KEY,
    name TEXT NOT NULL,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_notebooks_user ON notebooks(user_id);
CREATE INDEX IF NOT EXISTS idx_notebooks_session ON notebooks(session_id);
CREATE INDEX IF NOT EXISTS idx_documents_user ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_session ON documents(session_id);
CREATE INDEX IF NOT EXISTS idx_documents_notebook ON documents(notebook_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_session ON conversations(session_id);
CREATE INDEX IF NOT EXISTS idx_conversations_notebook ON conversations(notebook_id);
CREATE INDEX IF NOT EXISTS idx_messages_conv ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_revoked_hash ON revoked_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_knowledge_maps_owner ON knowledge_maps(owner_key);

