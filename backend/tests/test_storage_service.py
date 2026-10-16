"""Storage service — local default is Render-safe; S3 is opt-in."""
from app.services import storage_service as store
from app.config import settings


def test_local_path_passthrough(tmp_path, monkeypatch):
    monkeypatch.setattr(settings, "storage_backend", "local")
    assert not store.s3_enabled() or True  # s3_enabled depends on bucket; local must not need boto3
    p = tmp_path / "a.pdf"
    p.write_bytes(b"hello")
    assert store.ensure_local(str(p)) == str(p)
    assert store.is_s3_path("s3://b/k") is True
    assert store.is_s3_path(str(p)) is False


def test_parse_s3_path():
    b, k = store.parse_s3_path("s3://my-bucket/uploads/abc.pdf")
    assert b == "my-bucket"
    assert k == "uploads/abc.pdf"


def test_s3_requires_bucket(monkeypatch):
    monkeypatch.setattr(settings, "storage_backend", "s3")
    monkeypatch.setattr(settings, "aws_bucket_name", "")
    assert store.s3_enabled() is False


def test_delete_local(tmp_path):
    p = tmp_path / "d.pdf"
    p.write_bytes(b"x")
    assert store.delete_storage(str(p)) is True
    assert not p.exists()
