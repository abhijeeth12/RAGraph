# Agent Instructions — RAGraph

## ⚡ MANDATORY REQUIREMENT: Gravitas for Every Task

**For all tasks in this repository (backend, frontend, debugging, testing, architecture, or design), you MUST use Gravitas MCP and follow the authoritative workflow in [GRAVITAS_WORKFLOW.md](GRAVITAS_WORKFLOW.md).**

### Gravitas Invariants (Always Enforced):
1. **Ground before mutating:** Read target files, tests, and callers before editing.
2. **Stay in declared scope:** Restrict changes strictly to `allowed_write_scope`.
3. **Completion needs evidence:** A task is done only when an owned validator passes *after* the last edit.
4. **Never exact-retry a failure:** Change diagnosis or strategy before retrying.
5. **Satisfy the contract:** Acceptance criteria and validators gate completion.
6. **Say what you cannot verify:** Explicitly state any unverified assertions.

### Execution Protocol:
- **Inspect Gravitas tools first:** Call `gravitas_doctor` or `python Gravitas/gravitas_cli.py doctor`.
- **Policy Decision:** Call `gravitas_decide` (direct / compact / deep) based on task scope.
- **Validators:** Run `gravitas_validators` or direct test suites (`pytest` for backend, `npx tsc --noEmit` for frontend).

---

## 🏗 Repository Structure & Development Commands

- **Frontend (Vite + React 19)**: Root directory (`package.json`, `src/`).
  - Run frontend dev server: `npm run dev` (starts on `http://localhost:3000`)
  - Run frontend typecheck: `npx tsc --noEmit`
- **Backend (FastAPI)**: In `backend/` directory (`backend/app/`).
  - **Correct backend command from repository root:**
    ```powershell
    python -m uvicorn app.main:app --app-dir backend --reload --port 8000
    ```
  - **Or from `backend/` directory:**
    ```powershell
    cd backend
    python -m uvicorn app.main:app --reload --port 8000
    ```
  - **Run backend tests:**
    ```powershell
    pytest -q backend/tests
    ```
- **Gravitas Framework**: In `Gravitas/` directory (`Gravitas/gravitas_cli.py`, `Gravitas/gravitas_mcp_server.py`).
