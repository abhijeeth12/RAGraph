#!/usr/bin/env python3
"""Gravitas MCP Server — Standard Model Context Protocol interface for Gravitas.

Exposes Gravitas reliability runtime tools (doctor, decide, validators, context,
invariants, explain) to any MCP-compliant agent host over stdio JSON-RPC 2.0.
"""
from __future__ import annotations

import json
import sys
import subprocess
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
REPO_ROOT = SCRIPT_DIR.parent.parent
GRAVITAS_DIR = REPO_ROOT / "Gravitas"
CLI_PATH = GRAVITAS_DIR / "gravitas_cli.py"

TOOLS = [
    {
        "name": "gravitas_doctor",
        "description": "Inspect Gravitas runtime health, skills, hooks, and project session status.",
        "inputSchema": {
            "type": "object",
            "properties": {},
            "required": []
        }
    },
    {
        "name": "gravitas_invariants",
        "description": "Retrieve the 6 core Gravitas invariants: Grounding, Scope, Evidence, No exact retry, Contract satisfaction, and Honesty.",
        "inputSchema": {
            "type": "object",
            "properties": {},
            "required": []
        }
    },
    {
        "name": "gravitas_decide",
        "description": "Emit planning-policy decision (direct, compact, deep, replan) and reason codes for a task based on complexity signals.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "files_count": {"type": "integer", "description": "Number of files estimated to be touched"},
                "uncertainty": {"type": "string", "enum": ["low", "medium", "high"], "description": "Level of domain/codebase uncertainty"},
                "task_type": {"type": "string", "enum": ["bugfix", "feature", "refactor", "migration", "architecture"], "description": "Category of work"}
            },
            "required": ["files_count", "uncertainty", "task_type"]
        }
    },
    {
        "name": "gravitas_validators",
        "description": "Discover repository-aware validators (test suites, linters, type checkers) and escalation plan.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "target_dir": {"type": "string", "description": "Directory to scan (defaults to repository root or backend)"}
            },
            "required": []
        }
    },
    {
        "name": "gravitas_context",
        "description": "Analyze repository context and blast radius for changed files at a specified disclosure depth.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "changed_files": {"type": "array", "items": {"type": "string"}, "description": "List of files being modified"},
                "depth": {"type": "string", "enum": ["shallow", "dependency", "impact"], "description": "Analysis depth"}
            },
            "required": ["changed_files"]
        }
    },
    {
        "name": "gravitas_explain",
        "description": "Render a human-readable explanation of session state, active contract, and next safe actions.",
        "inputSchema": {
            "type": "object",
            "properties": {},
            "required": []
        }
    }
]

INVARIANTS_TEXT = """# GRAVITAS 6 KERNEL INVARIANTS (Always Mandatory)

1. Ground before mutating: Read the target, its tests, and its callers before editing. Never assume file state.
2. Stay in declared scope: Writes outside allowed_write_scope are denied. Amend the contract openly if scope was wrong.
3. Completion needs evidence: A criterion is complete only when a Gravitas-owned validator passed after the last mutation. Stale evidence and self-review do not count.
4. Never exact-retry a failure: Change the diagnosis, context, or strategy before retrying.
5. Satisfy the contract: Acceptance criteria and required validators gate completion. Unrelated test passes prove nothing.
6. Say what you cannot verify: Mark uncertain or unverifiable claims explicitly instead of rounding up to certainty.
"""

def handle_call_tool(name: str, arguments: dict) -> dict:
    if name == "gravitas_invariants":
        return {"content": [{"type": "text", "text": INVARIANTS_TEXT}]}

    elif name == "gravitas_doctor":
        if CLI_PATH.exists():
            proc = subprocess.run([sys.executable, str(CLI_PATH), "doctor"], capture_output=True, text=True, cwd=str(REPO_ROOT))
            output = proc.stdout or proc.stderr
        else:
            output = "Gravitas CLI not present at " + str(CLI_PATH) + ". Native plugins and skills are active in .agents/."
        return {"content": [{"type": "text", "text": output}]}

    elif name == "gravitas_decide":
        files_cnt = arguments.get("files_count", 1)
        unc = arguments.get("uncertainty", "low")
        ttype = arguments.get("task_type", "bugfix")

        if files_cnt <= 1 and unc == "low" and ttype in ("bugfix", "refactor"):
            planning = "direct"
            context_depth = "shallow"
            verification_depth = "targeted"
            reason_codes = ["single-file-localized", "low-uncertainty"]
        elif files_cnt <= 3 and unc in ("low", "medium"):
            planning = "compact"
            context_depth = "dependency"
            verification_depth = "impact"
            reason_codes = ["bounded-multi-file", "moderate-risk"]
        else:
            planning = "deep"
            context_depth = "impact"
            verification_depth = "suite"
            reason_codes = ["broad-blast-radius", "high-uncertainty-or-architecture"]

        record = {
            "planning": planning,
            "context_depth": context_depth,
            "verification_depth": verification_depth,
            "delegation": "none",
            "reason_codes": reason_codes,
            "signals": {"files_count": files_cnt, "uncertainty": unc, "task_type": ttype}
        }
        return {"content": [{"type": "text", "text": json.dumps(record, indent=2)}]}

    elif name == "gravitas_validators":
        target = arguments.get("target_dir", "backend")
        target_path = REPO_ROOT / target if not Path(target).is_absolute() else Path(target)
        if not target_path.exists():
            target_path = REPO_ROOT
        if CLI_PATH.exists():
            proc = subprocess.run([sys.executable, str(CLI_PATH), "validators", "--root", str(target_path)], capture_output=True, text=True, cwd=str(REPO_ROOT))
            output = proc.stdout or proc.stderr
        else:
            output = "Target: " + str(target_path) + "\nValidators: pytest -q backend/tests, npx tsc --noEmit"
        return {"content": [{"type": "text", "text": output}]}

    elif name == "gravitas_context":
        changed = arguments.get("changed_files", [])
        depth = arguments.get("depth", "dependency")
        if CLI_PATH.exists():
            cmd = [sys.executable, str(CLI_PATH), "context", "--root", str(REPO_ROOT), "--depth", depth]
            for f in changed:
                cmd.extend(["--changed", f])
            proc = subprocess.run(cmd, capture_output=True, text=True, cwd=str(REPO_ROOT))
            output = proc.stdout or proc.stderr
        else:
            output = "Changed files: " + ", ".join(changed)
        return {"content": [{"type": "text", "text": output}]}

    elif name == "gravitas_explain":
        return {"content": [{"type": "text", "text": "Gravitas runtime active. Follow the 6 invariants: ground first, stay in scope, verify with executed proof, report accurately."}]}

    return {"content": [{"type": "text", "text": f"Unknown tool: {name}"}], "isError": True}

def main():
    while True:
        line = sys.stdin.readline()
        if not line:
            break
        line = line.strip()
        if not line:
            continue
        try:
            req = json.loads(line)
        except Exception:
            continue

        method = req.get("method")
        msg_id = req.get("id")

        if method == "initialize":
            res = {
                "jsonrpc": "2.0",
                "id": msg_id,
                "result": {
                    "protocolVersion": "2024-11-05",
                    "capabilities": {
                        "tools": {}
                    },
                    "serverInfo": {
                        "name": "gravitas-mcp",
                        "version": "4.0.0"
                    }
                }
            }
            sys.stdout.write(json.dumps(res) + "\n")
            sys.stdout.flush()

        elif method == "notifications/initialized":
            pass

        elif method == "tools/list":
            res = {
                "jsonrpc": "2.0",
                "id": msg_id,
                "result": {
                    "tools": TOOLS
                }
            }
            sys.stdout.write(json.dumps(res) + "\n")
            sys.stdout.flush()

        elif method == "tools/call":
            params = req.get("params", {})
            name = params.get("name", "")
            args = params.get("arguments", {})
            result = handle_call_tool(name, args)
            res = {
                "jsonrpc": "2.0",
                "id": msg_id,
                "result": result
            }
            sys.stdout.write(json.dumps(res) + "\n")
            sys.stdout.flush()

        elif method == "ping":
            res = {
                "jsonrpc": "2.0",
                "id": msg_id,
                "result": {}
            }
            sys.stdout.write(json.dumps(res) + "\n")
            sys.stdout.flush()

if __name__ == "__main__":
    main()
