# Gemini Instructions — RAGraph

## Repository Architecture & Commands
- **Frontend Dual-Architecture**:
  - Local Dev: Vite SPA in `src/` (`npm run dev` on port 3000, `npx tsc --noEmit`).
  - Production: Next.js App Router in `frontend/` (deployed to Vercel at `https://ra-graph.vercel.app`).
  - **MANDATORY**: Run `npm run sync` (or `python scripts/sync_frontend.py`) and verify `npm --prefix frontend run build` before pushing any frontend changes.
- **Backend**: FastAPI in `backend/app/`. Run from root:
  `python -m uvicorn app.main:app --app-dir backend --reload --port 8000`
  Verify: `pytest -q backend/tests`. Render host: `https://ragraph-backend.onrender.com`.
