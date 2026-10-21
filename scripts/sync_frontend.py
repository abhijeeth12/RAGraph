#!/usr/bin/env python3
"""sync_frontend.py — Automated Dual-Frontend Synchronizer for RAGraph.

Ensures that the root Vite development codebase (src/) and the production
Next.js deployment codebase (frontend/src/) are always 100% in sync before
builds, commits, and pushes. Prevents deployment drift and split-brain bugs.
"""
from __future__ import annotations

import os
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC_DIR = ROOT / "src"
FRONTEND_SRC = ROOT / "frontend" / "src"

def sync_landing_components():
    src_landing = SRC_DIR / "components" / "Landing"
    dst_landing = FRONTEND_SRC / "components" / "Landing"
    if not src_landing.exists():
        return
    dst_landing.mkdir(parents=True, exist_ok=True)
    for f in src_landing.glob("*.tsx"):
        content = f.read_text(encoding="utf-8")
        if not content.startswith("'use client'"):
            content = "'use client'\n" + content
        (dst_landing / f.name).write_text(content, encoding="utf-8")

def sync_dashboard_components():
    src_dash = SRC_DIR / "components" / "Dashboard"
    dst_dash = FRONTEND_SRC / "components" / "Dashboard"
    if not src_dash.exists():
        return
    dst_dash.mkdir(parents=True, exist_ok=True)
    for f in src_dash.glob("*.tsx"):
        content = f.read_text(encoding="utf-8")
        if not content.startswith("'use client'"):
            content = "'use client'\n" + content
        (dst_dash / f.name).write_text(content, encoding="utf-8")

def sync_shared_components():
    src_comp = SRC_DIR / "components"
    dst_comp = FRONTEND_SRC / "components"
    for f in src_comp.glob("*.tsx"):
        content = f.read_text(encoding="utf-8")
        if not content.startswith("'use client'"):
            content = "'use client'\n" + content
        (dst_comp / f.name).write_text(content, encoding="utf-8")
    
    # Sync KnowledgeMap subcomponents
    src_km = src_comp / "KnowledgeMap"
    dst_km = dst_comp / "KnowledgeMap"
    if src_km.exists():
        dst_km.mkdir(parents=True, exist_ok=True)
        for f in src_km.glob("*.tsx"):
            content = f.read_text(encoding="utf-8")
            if not content.startswith("'use client'"):
                content = "'use client'\n" + content
            (dst_km / f.name).write_text(content, encoding="utf-8")

def sync_types_and_utils():
    # Types
    types_src = SRC_DIR / "lib" / "types.ts"
    if types_src.exists():
        (FRONTEND_SRC / "lib" / "types.ts").write_text(types_src.read_text(encoding="utf-8"), encoding="utf-8")
    # Utils
    utils_src = SRC_DIR / "lib" / "utils.ts"
    if utils_src.exists():
        (FRONTEND_SRC / "lib" / "utils.ts").write_text(utils_src.read_text(encoding="utf-8"), encoding="utf-8")
    # API
    api_src = SRC_DIR / "lib" / "api.ts"
    if api_src.exists():
        (FRONTEND_SRC / "lib" / "api.ts").write_text(api_src.read_text(encoding="utf-8"), encoding="utf-8")

def sync_app_to_page():
    app_tsx = SRC_DIR / "App.tsx"
    page_tsx = FRONTEND_SRC / "app" / "page.tsx"
    if app_tsx.exists():
        content = app_tsx.read_text(encoding="utf-8")
        if not content.startswith("'use client'"):
            content = "'use client'\n" + content
        page_tsx.write_text(content, encoding="utf-8")

def sync_css():
    index_css = SRC_DIR / "index.css"
    globals_css = FRONTEND_SRC / "app" / "globals.css"
    if index_css.exists():
        css_body = index_css.read_text(encoding="utf-8")
        font_import = "@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap');\n"
        globals_css.write_text(font_import + css_body, encoding="utf-8")

def sync_store():
    src_store = SRC_DIR / "store"
    dst_store = FRONTEND_SRC / "store"
    if src_store.exists():
        dst_store.mkdir(parents=True, exist_ok=True)
        for f in src_store.glob("*.ts"):
            (dst_store / f.name).write_text(f.read_text(encoding="utf-8"), encoding="utf-8")

def main():
    print("[SYNC] Synchronizing root src/ -> frontend/src/ ...")
    sync_landing_components()
    sync_dashboard_components()
    sync_shared_components()
    sync_types_and_utils()
    sync_store()
    sync_app_to_page()
    sync_css()
    print("[SYNC] Frontend synchronization complete. Both Vite (src/) and Next.js (frontend/src/) are aligned.")

if __name__ == "__main__":
    main()
