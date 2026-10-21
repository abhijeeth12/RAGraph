# GRAVITAS Workflow Specification & Mandatory Standard

**Status:** Authoritative Repository Standard  
**Scope:** Universal across all conversations, agents, and task types (Backend, Frontend, Architecture, Bugfixing, Refactoring, Testing, Design, Infrastructure).

---

## 1. Mandatory Policy: Gravitas for Every Task

From this point forward, **Gravitas MCP and the Gravitas Engineering Runtime are mandatory starting points for every user-requested task in this repository**.

Gravitas is not restricted to UI/UX design or front-end work. It governs all software engineering operations in this repository:
- Bug fixing, debugging, and root-cause analysis
- Backend and API engineering
- Frontend architecture, state management, and component design
- Database, vector storage, and caching operations
- Performance profiling, testing, and evidence verification
- Implementation planning, architectural decisions, and code reviews

---

## 2. Core Protocol: The 6 Kernel Invariants

Every agent operating in this repository must strictly adhere to the six Gravitas invariants on every turn:

1. **Ground before mutating:**
   Read the target file, its tests, and its callers before editing. Never act on assumed file state.
2. **Stay in declared scope:**
   Writes outside the declared scope (`allowed_write_scope`) are forbidden. If scope was misjudged, update the plan explicitly rather than writing out-of-scope files.
3. **Completion needs evidence:**
   A task or criterion is only complete when an owned validator (test suite, linter, typecheck, or endpoint check) passes **after the last mutation**. Stale passes prior to the final edit do not count.
4. **Never exact-retry a failure:**
   When a tool call, test, or approach fails, do not repeat the identical action. Alter the diagnosis, context, or implementation strategy first.
5. **Satisfy the contract:**
   Task acceptance criteria and their required validators gate completion. An unrelated green test suite does not satisfy task criteria.
6. **Say what you cannot verify:**
   Clearly identify any unverified assumptions or unrun tests. Never round uncertainty up to fabricated certainty.

---

## 3. Workflow Steps for Every Agent

At the beginning of **every task**:

### Step 1: Reconnaissance & Tool Inspection
1. Inspect available Gravitas capabilities via MCP tools (`gravitas_doctor`, `gravitas_invariants`, `gravitas_decide`, `gravitas_validators`, `gravitas_context`, `gravitas_explain`) or the `gravitas` skill (`skills/gravitas/SKILL.md`).
2. Run `gravitas_doctor` or `python Gravitas/gravitas_cli.py doctor` to verify runtime health.

### Step 2: Planning & Policy Decision
1. Invoke `gravitas_decide` (or `python Gravitas/gravitas_cli.py decide`) with task complexity signals:
   - `direct`: Single-file, localized, low-risk changes.
   - `compact`: Multi-file, moderate uncertainty, component-level changes.
   - `deep`: Architectural refactoring, migrations, security-sensitive changes.
2. Formulate a concise plan grounded in observed code.

### Step 3: Scoped Implementation
1. Read all files before making edits.
2. Limit modifications strictly to files within the declared task scope.

### Step 4: Verification with Executed Evidence
1. Run validators using `gravitas_validators` (e.g. `npx tsc --noEmit`, `pytest`, `python -m unittest`, or running API checks).
2. Record and report actual validator exit codes and outputs. Do not claim a check passed without executed evidence.

---

## 4. MCP Configuration & Availability

### Local & Antigravity Setup
The Gravitas MCP server is hosted at `Gravitas/gravitas_mcp_server.py`.

In `mcp_config.json` (or `.agents/mcp_config.json`):
```json
{
  "mcpServers": {
    "gravitas": {
      "command": "python",
      "args": [
        "A:/Projects/RAGraph/Gravitas/gravitas_mcp_server.py"
      ]
    }
  }
}
```

### Fallback if MCP is Unavailable in an Environment
If an agent environment lacks active MCP stdio support:
1. Directly execute CLI capabilities: `python Gravitas/gravitas_cli.py [doctor|decide|validators|context]`
2. Consult the installed skill: `.agents/skills/gravitas/SKILL.md`
3. Never fabricate tool results or claim unavailable tools were executed. Explicitly state the CLI/skill execution method used.
