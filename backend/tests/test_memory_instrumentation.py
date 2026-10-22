"""
Unit and integration tests for memory instrumentation, checkpoints, and diagnostics.
"""
import pytest
import asyncio
from app.utils.memory import (
    get_memory_snapshot,
    log_memory_checkpoint,
    MemoryStageTracker,
    get_diagnostic_memory_report,
    trim_memory,
    format_checkpoint_msg,
    MemorySnapshot,
)


def test_get_memory_snapshot():
    snap = get_memory_snapshot()
    assert isinstance(snap, MemorySnapshot)
    assert snap.rss_mb > 0.0
    assert snap.pid > 0
    assert snap.container_limit_mb >= 512.0
    assert snap.headroom_mb >= 0.0
    assert isinstance(snap.timestamp, str)


def test_memory_stage_tracker_sync():
    with MemoryStageTracker("test_sync_stage", context="unit_test", details={"batch": 10}, profile_allocations=True) as tracker:
        snap_step = tracker.checkpoint("intermediate_step", details={"items": 5})
        assert snap_step.rss_mb > 0.0
        # Allocate some small memory
        dummy = [str(x) * 100 for x in range(1000)]
    # End of stage
    assert tracker.start_snap is not None
    assert tracker.last_snap is not None


@pytest.mark.asyncio
async def test_memory_stage_tracker_async():
    async with MemoryStageTracker("test_async_stage", context="async_unit_test") as tracker:
        await asyncio.sleep(0.01)
        snap_step = tracker.checkpoint("async_step")
        assert snap_step.rss_mb > 0.0
    assert tracker.start_snap is not None


def test_memory_stage_tracker_records_failure():
    with pytest.raises(ValueError, match="simulated_error"):
        with MemoryStageTracker("failing_stage", context="error_test") as tracker:
            raise ValueError("simulated_error")
    assert tracker.start_snap is not None


def test_format_checkpoint_msg():
    snap = get_memory_snapshot()
    msg = format_checkpoint_msg(
        stage="test_format",
        status="START",
        snap=snap,
        delta_mb=5.2,
        elapsed_s=1.23,
        context="ctx_test",
        details={"key1": "val1", "key2": 42},
    )
    assert "[MEM-START]" in msg
    assert 'stage="test_format"' in msg
    assert 'ctx="ctx_test"' in msg
    assert "delta=+5.2MB" in msg
    assert "elapsed=1.23s" in msg
    assert "details=(key1=val1 key2=42)" in msg


def test_diagnostic_memory_report():
    report = get_diagnostic_memory_report()
    assert "process" in report
    assert "container" in report
    assert "gc" in report
    assert "system" in report
    assert report["process"]["rss_mb"] > 0.0
    assert "thread_count" in report["system"]


def test_trim_memory_safe():
    trim_memory()


@pytest.mark.asyncio
async def test_health_memory_endpoint():
    from httpx import AsyncClient, ASGITransport
    from app.main import app

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/api/health/memory")
        assert resp.status_code == 200
        data = resp.json()
        assert "process" in data
        assert "container" in data
        assert data["process"]["rss_mb"] > 0.0

        # Also verify /api/health includes the memory key
        health_resp = await client.get("/api/health")
        assert health_resp.status_code == 200
        health_data = health_resp.json()
        assert "memory" in health_data["services"]
        assert health_data["services"]["memory"]["rss_mb"] > 0.0
