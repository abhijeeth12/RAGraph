# Agent Instructions — RAGraph

## 🏗 Repository Structure & Development Commands

### ⚠️ Dual-Frontend Architecture & Deployment Synchronization
The repository maintains two aligned frontend targets:
1. **Local Development SPA (Vite + React 19)**: Root directory (`package.json`, `src/`).
   - Dev server: `npm run dev` (starts on `http://localhost:3000`)
   - Typecheck: `npx tsc --noEmit`
   - Build: `npm run build`
2. **Production Deployment App (Next.js 16 App Router)**: `frontend/` directory (`frontend/package.json`, `frontend/src/`).
   - **Vercel deploys from this directory (`frontend/`)**: Any change in `src/` **MUST** be synced to `frontend/` before pushing!
   - Automated sync command: `npm run sync` (or `python scripts/sync_frontend.py`).
   - Production Next.js build verification: `npm --prefix frontend run build`.
   - Full dual build verification: `npm run build:all`.

### 🚀 Deployment Architecture
- **Frontend**: Hosted on Vercel at `https://ra-graph.vercel.app`. Deploys automatically from the `frontend/` directory on push to `origin/main`.
- **Backend (FastAPI)**: Hosted on Render at `https://ragraph-backend.onrender.com` (`render.yaml`). Deploys automatically from `./backend/Dockerfile` on push to `origin/main`.
  - **Local backend command from root:**
    ```powershell
    python -m uvicorn app.main:app --app-dir backend --reload --port 8000
    ```
  - **Run backend tests:**
    ```powershell
    pytest -q backend/tests
    ```
