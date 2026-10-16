"""
Storage service — reversible dual backend (local default, S3 opt-in).

Senior-engineer pattern: every file access goes through here so the
backend can run on Render ephemeral disk today, S3 in the AWS lab
tomorrow, and back on Render before the Free Plan expires — without
rewriting callers.

- Default: local disk, identical behaviour to today.
- S3: enabled ONLY when STORAGE_BACKEND=s3 AND AWS_BUCKET_NAME is set.
  boto3 is imported lazily so Render free builds don't pay the import
  cost unless S3 is actually selected.

Stored `storage_path` convention:
- local: "/app/uploads/<doc_id>.pdf" (as today)
- s3:    "s3://<bucket>/<key>"  e.g. "s3://ragraph-uploads/<doc_id>.pdf"

Callers that need a real filesystem path (parser, docx reader) must use
`ensure_local()` which downloads S3 objects to a temp dir.
"""
from __future__ import annotations

import os
import tempfile
from loguru import logger

from app.config import settings


def is_s3_path(storage_path: str) -> bool:
    return bool(storage_path) and storage_path.startswith("s3://")


def s3_enabled() -> bool:
    return (
        settings.storage_backend == "s3"
        and bool(settings.aws_bucket_name)
    )


def parse_s3_path(storage_path: str) -> tuple[str, str]:
    """Split 's3://bucket/key' -> (bucket, key)."""
    assert is_s3_path(storage_path), f"not an s3 path: {storage_path}"
    rest = storage_path[len("s3://"):]
    bucket, _, key = rest.partition("/")
    if not bucket or not key:
        raise ValueError(f"invalid s3 path: {storage_path}")
    return bucket, key


def _s3_client():
    try:
        import boto3  # lazy: only needed when S3 backend is active
    except ImportError as e:
        raise RuntimeError(
            "STORAGE_BACKEND=s3 requires 'boto3' installed. "
            "pip install boto3 (lab/EC2 only, not needed for Render local mode)."
        ) from e
    return boto3.client("s3", region_name=settings.aws_region)


# ─── Write path ──────────────────────────────────────────────────────────

def local_path_for(doc_id: str, ext: str) -> tuple[str, str]:
    """Return (absolute local path, storage_path to persist) for local mode."""
    filename = f"{doc_id}.{ext}"
    path = os.path.join(settings.local_storage_path, filename)
    os.makedirs(settings.local_storage_path, exist_ok=True)
    return os.path.abspath(path), path


def s3_key_for(doc_id: str, ext: str, prefix: str = "uploads") -> tuple[str, str]:
    """Return (key, storage_path to persist) for S3 mode."""
    key = f"{prefix}/{doc_id}.{ext}"
    return key, f"s3://{settings.aws_bucket_name}/{key}"


def upload_fileobj_to_s3(local_tmp_path: str, key: str) -> str:
    """Upload an already-staged temp file to S3. Returns persisted s3:// path."""
    client = _s3_client()
    client.upload_file(local_tmp_path, settings.aws_bucket_name, key)
    logger.info(f"Uploaded to s3://{settings.aws_bucket_name}/{key}")
    return f"s3://{settings.aws_bucket_name}/{key}"


def presigned_get_url(storage_path: str, expires_s: int = 3600) -> str:
    """Presigned HTTPS URL for S3 objects; local passthrough otherwise."""
    if not is_s3_path(storage_path):
        return storage_path
    bucket, key = parse_s3_path(storage_path)
    client = _s3_client()
    return client.generate_presigned_url(
        "get_object",
        Params={"Bucket": bucket, "Key": key},
        ExpiresIn=expires_s,
    )


# ─── Read path (parser needs a real file) ────────────────────────────────

def ensure_local(storage_path: str) -> str:
    """
    Return a local filesystem path readable by PyMuPDF/docx/etc.
    - local mode: returns storage_path unchanged (must exist).
    - s3 mode: downloads to tempdir and returns the temp path.
    Caller must NOT delete the returned path for local mode; temp files
    for S3 live under gettempdir() and are reused per doc_id.
    """
    if not is_s3_path(storage_path):
        return storage_path
    bucket, key = parse_s3_path(storage_path)
    tmpdir = os.path.join(tempfile.gettempdir(), "ragraph_s3cache")
    os.makedirs(tmpdir, exist_ok=True)
    local_tmp = os.path.join(tmpdir, key.replace("/", "_"))
    # When caching is disabled, always re-download (never reuse a stale copy).
    if settings.cache_enabled and os.path.exists(local_tmp) and os.path.getsize(local_tmp) > 0:
        return local_tmp
    client = _s3_client()
    client.download_file(bucket, key, local_tmp)
    logger.info(f"Downloaded {storage_path} -> {local_tmp}")
    return local_tmp


# ─── Delete path ─────────────────────────────────────────────────────────

def delete_storage(storage_path: str) -> bool:
    """Delete local file or S3 object. Returns True if deleted/missing."""
    try:
        if is_s3_path(storage_path):
            bucket, key = parse_s3_path(storage_path)
            _s3_client().delete_object(Bucket=bucket, Key=key)
            logger.info(f"Deleted {storage_path}")
            return True
        if storage_path and os.path.exists(storage_path):
            os.remove(storage_path)
        # Also clean sidecar caches from the old local-only design
        for suffix in ("_outline.json", "_graph.json"):
            sidecar = (storage_path or "") + suffix
            if sidecar and os.path.exists(sidecar):
                try:
                    os.remove(sidecar)
                except OSError:
                    pass
        return True
    except Exception as e:
        logger.warning(f"delete_storage failed for {storage_path}: {e}")
        return False
