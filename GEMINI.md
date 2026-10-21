# Gemini Instructions — RAGraph

## Mandatory: Gravitas Engineering Runtime
All tasks must follow [GRAVITAS_WORKFLOW.md](GRAVITAS_WORKFLOW.md) and the 6 Invariants:
1. Ground before mutating (read before writing).
2. Stay in declared scope.
3. Completion requires fresh executed evidence.
4. Never exact-retry a failure.
5. Satisfy acceptance criteria with actual validators.
6. Report unverified items explicitly.

Use Gravitas MCP or `python Gravitas/gravitas_cli.py [doctor|decide|validators|context]`.

## Repository Architecture & Commands
- **Frontend Dual-Architecture**:
  - Local Dev: Vite SPA in `src/` (`npm run dev` on port 3000, `npx tsc --noEmit`).
  - Production: Next.js App Router in `frontend/` (deployed to Vercel at `https://ra-graph.vercel.app`).
  - **MANDATORY**: Run `npm run sync` (or `python scripts/sync_frontend.py`) and verify `npm --prefix frontend run build` before pushing any frontend changes.
- **Backend**: FastAPI in `backend/app/`. Run from root:
  `python -m uvicorn app.main:app --app-dir backend --reload --port 8000`
  Verify: `pytest -q backend/tests`. Render host: `https://ragraph-backend.onrender.com`.
