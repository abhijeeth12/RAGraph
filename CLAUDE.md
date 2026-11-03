# Claude Instructions — RAGraph

## Repository Architecture & Commands
- **Frontend**: Vite SPA in `src/`. Run: `npm run dev`. Verify: `npx tsc --noEmit`.
- **Backend**: FastAPI in `backend/app/`. Run from root:
  `python -m uvicorn app.main:app --app-dir backend --reload --port 8000`
  Verify: `pytest -q backend/tests`.
