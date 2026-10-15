"""
Export manifest for migrate-back drill (Render-safe, $0, no AWS calls).

Usage (backend/):
  python scripts/export_manifest.py --out ./manifest.json

What it does:
- Reads Postgres documents (if reachable) and writes id/filename/status/storage_path.
- Prints Qdrant collections + S3 sync commands to run manually.
- Never deletes anything. Run this BEFORE any AWS lab, and again
  BEFORE tearing down AWS, so you can prove nothing was lost.

Migrate-back rule: Postgres (Neon) + Qdrant Cloud are source of truth.
Files in S3 must be copied back to Render disk or re-uploaded; vectors
and outline/graph in DB/Qdrant are NOT rebuilt from scratch.
"""
from __future__ import annotations
import argparse
import asyncio
import json
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


async def main(out: str):
    from app.services.db_service import db_service
    manifest = {"documents": [], "notes": []}
    try:
        ok = await db_service.connect()
        if ok:
            # List via raw pool to avoid owner filtering; fallback to empty.
            async with db_service._pool.acquire() as conn:
                rows = await conn.fetch(
                    "SELECT id, original_filename, status, storage_path,"
                    " file_size, node_count, created_at FROM documents"
                    " ORDER BY created_at DESC LIMIT 1000"
                )
                for r in rows:
                    manifest["documents"].append({
                        "id": r["id"],
                        "filename": r["original_filename"],
                        "status": r["status"],
                        "storage_path": r["storage_path"],
                        "file_size": r["file_size"],
                        "node_count": r["node_count"],
                        "created_at": str(r["created_at"]),
                    })
            await db_service.close()
        else:
            manifest["notes"].append("Postgres unreachable — manifest empty (degraded mode).")
    except Exception as e:
        manifest["notes"].append(f"DB export failed: {e!r}")

    with open(out, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)
    print(f"Wrote {out} with {len(manifest['documents'])} documents.")
    print("Next (manual, no auto-delete):")
    print("  1. Qdrant Cloud dashboard -> Snapshots for ragraph_text/ragraph_images")
    print("  2. If S3 lab used: aws s3 sync s3://<bucket>/uploads ./uploads-restore/")
    print("  3. Keep this manifest until Render /api/documents/ lists the same count.")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default="./manifest.json")
    args = ap.parse_args()
    asyncio.run(main(args.out))
