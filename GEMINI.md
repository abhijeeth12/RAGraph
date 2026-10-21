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
- **Frontend**: Vite SPA in `src/`. Run: `npm run dev`. Verify: `npx tsc --noEmit`.
- **Backend**: FastAPI in `backend/app/`. Run from root:
  `python -m uvicorn app.main:app --app-dir backend --reload --port 8000`
  Verify: `pytest -q backend/tests`.
