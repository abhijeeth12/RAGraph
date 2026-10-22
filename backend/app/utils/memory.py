"""
Memory Management and Instrumentation Utilities.

Provides:
1. Low-overhead RSS and High-Water-Mark (VmHWM) extraction (psutil + Linux /proc fallback)
2. Linux Container (cgroup v1 / cgroup v2) limit and usage detection (Render 512MB limit)
3. Structured stage-by-stage memory checkpoints with deltas and remaining headroom
4. Targeted, lightweight tracemalloc allocation snapshots (top allocation sites)
5. Heap trimming via Python gc.collect() and glibc malloc_trim(0)
"""
from __future__ import annotations

import os
import sys
import gc
import time
import ctypes
import threading
import tracemalloc
from dataclasses import dataclass, asdict
from datetime import datetime, UTC
from typing import Optional, Any, Dict, List
from loguru import logger

# ── glibc malloc_trim loader ─────────────────────────────────────────────────
_libc = None
if sys.platform.startswith("linux"):
    try:
        _libc = ctypes.CDLL("libc.so.6")
    except Exception as e:
        logger.debug(f"Could not load libc for malloc_trim: {e}")


def trim_memory() -> None:
    """
    Force Python garbage collection and release freed memory back to the OS kernel.
    On Linux, calls glibc malloc_trim(0) to release arena memory.
    """
    try:
        gc.collect()
        if _libc is not None and hasattr(_libc, "malloc_trim"):
            _libc.malloc_trim(0)
    except Exception as e:
        logger.debug(f"trim_memory error: {e}")


# ── Process & System Metrics Extraction ──────────────────────────────────────
_proc_self = None
_max_observed_rss: float = 0.0
_peak_lock = threading.Lock()


def _get_process():
    global _proc_self
    if _proc_self is None:
        try:
            import psutil
            _proc_self = psutil.Process(os.getpid())
        except Exception:
            _proc_self = None
    return _proc_self


def _read_proc_status() -> Dict[str, str]:
    """Read Linux /proc/self/status lines (VmRSS, VmHWM, VmSize, RssAnon, etc.)."""
    status: Dict[str, str] = {}
    if sys.platform.startswith("linux") and os.path.exists("/proc/self/status"):
        try:
            with open("/proc/self/status", "r", encoding="utf-8", errors="replace") as f:
                for line in f:
                    parts = line.split(":", 1)
                    if len(parts) == 2:
                        status[parts[0].strip()] = parts[1].strip()
        except Exception:
            pass
    return status


def _read_cgroup_memory() -> Dict[str, Any]:
    """
    Inspect cgroup v2 and v1 container memory files.
    Render uses Linux Docker containers subject to cgroup memory quotas (e.g. 512MB).
    """
    result: Dict[str, Any] = {
        "is_cgroup": False,
        "version": None,
        "usage_bytes": None,
        "limit_bytes": None,
        "peak_bytes": None,
    }

    # 1. Check cgroup v2 (/sys/fs/cgroup/memory.*)
    cgroup2_cur = "/sys/fs/cgroup/memory.current"
    cgroup2_max = "/sys/fs/cgroup/memory.max"
    cgroup2_peak = "/sys/fs/cgroup/memory.peak"
    if os.path.exists(cgroup2_cur):
        try:
            with open(cgroup2_cur, "r") as f:
                cur_val = f.read().strip()
                if cur_val.isdigit():
                    result["usage_bytes"] = int(cur_val)
                    result["is_cgroup"] = True
                    result["version"] = "v2"
        except Exception:
            pass

        if os.path.exists(cgroup2_max):
            try:
                with open(cgroup2_max, "r") as f:
                    max_val = f.read().strip()
                    if max_val.isdigit():
                        val = int(max_val)
                        # Filter out unbounded / large host limit
                        if val < (1 << 50):
                            result["limit_bytes"] = val
            except Exception:
                pass

        if os.path.exists(cgroup2_peak):
            try:
                with open(cgroup2_peak, "r") as f:
                    peak_val = f.read().strip()
                    if peak_val.isdigit():
                        result["peak_bytes"] = int(peak_val)
            except Exception:
                pass

    # 2. Check cgroup v1 (/sys/fs/cgroup/memory/memory.*) if v2 wasn't detected
    if not result["is_cgroup"]:
        cgroup1_cur = "/sys/fs/cgroup/memory/memory.usage_in_bytes"
        cgroup1_max = "/sys/fs/cgroup/memory/memory.limit_in_bytes"
        cgroup1_peak = "/sys/fs/cgroup/memory/memory.max_usage_in_bytes"
        if os.path.exists(cgroup1_cur):
            try:
                with open(cgroup1_cur, "r") as f:
                    cur_val = f.read().strip()
                    if cur_val.isdigit():
                        result["usage_bytes"] = int(cur_val)
                        result["is_cgroup"] = True
                        result["version"] = "v1"
            except Exception:
                pass

            if os.path.exists(cgroup1_max):
                try:
                    with open(cgroup1_max, "r") as f:
                        max_val = f.read().strip()
                        if max_val.isdigit():
                            val = int(max_val)
                            # In cgroup v1, unlimited limit is usually 9223372036854771712 or 2**63 - pagesize
                            if val < (1 << 50):
                                result["limit_bytes"] = val
                except Exception:
                    pass

            if os.path.exists(cgroup1_peak):
                try:
                    with open(cgroup1_peak, "r") as f:
                        peak_val = f.read().strip()
                        if peak_val.isdigit():
                            result["peak_bytes"] = int(peak_val)
                except Exception:
                    pass

    return result


@dataclass
class MemorySnapshot:
    """Comprehensive point-in-time memory measurement."""
    timestamp: str
    rss_mb: float
    vms_mb: float
    peak_rss_mb: float
    container_used_mb: Optional[float]
    container_limit_mb: float
    headroom_mb: float
    anon_rss_mb: Optional[float]
    file_rss_mb: Optional[float]
    is_cgroup_measured: bool
    pid: int

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


def get_memory_snapshot() -> MemorySnapshot:
    """
    Acquire an accurate, low-overhead memory snapshot.
    Safe on all platforms (Linux/Docker/Windows/macOS) with zero exceptions.
    """
    global _max_observed_rss

    pid = os.getpid()
    rss_mb = 0.0
    vms_mb = 0.0

    proc = _get_process()
    if proc is not None:
        try:
            mem = proc.memory_info()
            rss_mb = round(mem.rss / (1024 * 1024), 2)
            vms_mb = round(mem.vms / (1024 * 1024), 2)
        except Exception:
            pass

    # Read procfs status on Linux for kernel-measured VmHWM (Hardware Water Mark)
    proc_status = _read_proc_status()
    peak_rss_mb = 0.0
    anon_rss_mb = None
    file_rss_mb = None

    if "VmHWM" in proc_status:
        try:
            # VmHWM is formatted as: ' 123456 kB'
            val_kb = float(proc_status["VmHWM"].split()[0])
            peak_rss_mb = round(val_kb / 1024.0, 2)
        except Exception:
            pass

    if "RssAnon" in proc_status:
        try:
            anon_rss_mb = round(float(proc_status["RssAnon"].split()[0]) / 1024.0, 2)
        except Exception:
            pass

    if "RssFile" in proc_status:
        try:
            file_rss_mb = round(float(proc_status["RssFile"].split()[0]) / 1024.0, 2)
        except Exception:
            pass

    with _peak_lock:
        if rss_mb > _max_observed_rss:
            _max_observed_rss = rss_mb
        if peak_rss_mb == 0.0:
            peak_rss_mb = _max_observed_rss
        else:
            peak_rss_mb = max(peak_rss_mb, _max_observed_rss)

    # Cgroup container metrics
    cgroup_info = _read_cgroup_memory()
    container_used_mb = None
    container_limit_mb = 512.0  # Default Render Free Tier memory quota
    is_cgroup_measured = False

    if cgroup_info["is_cgroup"]:
        is_cgroup_measured = True
        if cgroup_info["usage_bytes"] is not None:
            container_used_mb = round(cgroup_info["usage_bytes"] / (1024 * 1024), 2)
        if cgroup_info["limit_bytes"] is not None:
            container_limit_mb = round(cgroup_info["limit_bytes"] / (1024 * 1024), 2)
        if cgroup_info["peak_bytes"] is not None:
            cgroup_peak = round(cgroup_info["peak_bytes"] / (1024 * 1024), 2)
            peak_rss_mb = max(peak_rss_mb, cgroup_peak)

    # Calculate remaining headroom before failure
    effective_used = container_used_mb if container_used_mb is not None else rss_mb
    headroom_mb = round(max(0.0, container_limit_mb - effective_used), 2)

    return MemorySnapshot(
        timestamp=datetime.now(UTC).isoformat(),
        rss_mb=rss_mb,
        vms_mb=vms_mb,
        peak_rss_mb=peak_rss_mb,
        container_used_mb=container_used_mb,
        container_limit_mb=container_limit_mb,
        headroom_mb=headroom_mb,
        anon_rss_mb=anon_rss_mb,
        file_rss_mb=file_rss_mb,
        is_cgroup_measured=is_cgroup_measured,
        pid=pid,
    )


# ── Structured Checkpoint Logging ────────────────────────────────────────────

def format_checkpoint_msg(
    stage: str,
    status: str,
    snap: MemorySnapshot,
    delta_mb: Optional[float] = None,
    elapsed_s: Optional[float] = None,
    context: Optional[str] = None,
    details: Optional[Dict[str, Any]] = None,
) -> str:
    """Produce a standard, highly searchable, parseable log line."""
    parts = [
        f"[MEM-{status.upper()}]",
        f"stage=\"{stage}\"",
    ]
    if context:
        parts.append(f"ctx=\"{context}\"")
    parts.append(f"pid={snap.pid}")
    parts.append(f"rss={snap.rss_mb:.1f}MB")

    if delta_mb is not None:
        sign = "+" if delta_mb >= 0 else ""
        parts.append(f"delta={sign}{delta_mb:.1f}MB")

    parts.append(f"peak={snap.peak_rss_mb:.1f}MB")

    if snap.container_used_mb is not None:
        parts.append(f"container={snap.container_used_mb:.1f}MB/{snap.container_limit_mb:.0f}MB")
    else:
        parts.append(f"container=est/{snap.container_limit_mb:.0f}MB")

    parts.append(f"headroom={snap.headroom_mb:.1f}MB")

    if elapsed_s is not None:
        parts.append(f"elapsed={elapsed_s:.2f}s")

    if details:
        det_str = " ".join(f"{k}={v}" for k, v in details.items() if v is not None)
        if det_str:
            parts.append(f"details=({det_str})")

    return " | ".join(parts)


def log_memory_checkpoint(
    stage: str,
    context: Optional[str] = None,
    details: Optional[Dict[str, Any]] = None,
    delta_from: Optional[MemorySnapshot] = None,
    level: str = "INFO",
) -> MemorySnapshot:
    """Log a single point checkpoint."""
    snap = get_memory_snapshot()
    delta_mb = round(snap.rss_mb - delta_from.rss_mb, 2) if delta_from else None
    msg = format_checkpoint_msg(
        stage=stage,
        status="CHECKPOINT",
        snap=snap,
        delta_mb=delta_mb,
        context=context,
        details=details,
    )
    if level == "DEBUG":
        logger.debug(msg)
    elif level == "WARNING":
        logger.warning(msg)
    else:
        logger.info(msg)
    return snap


# ── Stage Tracker Context Manager ────────────────────────────────────────────

class MemoryStageTracker:
    """
    Context manager (both sync and async) for profiling execution stages.
    Emits start, intermediate checkpoint, and end/fail logs with RSS deltas,
    peak memory, headroom, and optional tracemalloc Python heap profiling.
    """

    def __init__(
        self,
        stage_name: str,
        context: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
        profile_allocations: bool = False,
    ):
        self.stage_name = stage_name
        self.context = context
        self.details = details or {}
        self.profile_allocations = profile_allocations
        self.t_start: float = 0.0
        self.start_snap: Optional[MemorySnapshot] = None
        self.last_snap: Optional[MemorySnapshot] = None
        self.last_time: float = 0.0
        self._tm_snapshot_start = None
        self._owns_tracemalloc = False

    def start(self) -> "MemoryStageTracker":
        self.t_start = time.monotonic()
        self.last_time = self.t_start
        self.start_snap = get_memory_snapshot()
        self.last_snap = self.start_snap

        if self.profile_allocations:
            try:
                if not tracemalloc.is_tracing():
                    tracemalloc.start()
                    self._owns_tracemalloc = True
                self._tm_snapshot_start = tracemalloc.take_snapshot()
            except Exception as e:
                logger.debug(f"tracemalloc start failed: {e}")

        msg = format_checkpoint_msg(
            stage=self.stage_name,
            status="START",
            snap=self.start_snap,
            context=self.context,
            details=self.details,
        )
        logger.info(msg)
        return self

    def checkpoint(self, sub_stage: str, details: Optional[Dict[str, Any]] = None) -> MemorySnapshot:
        """Log an intermediate checkpoint within this stage."""
        now = time.monotonic()
        snap = get_memory_snapshot()
        delta_since_last = round(snap.rss_mb - (self.last_snap.rss_mb if self.last_snap else 0.0), 2)
        elapsed_sub = round(now - self.last_time, 2)

        merged_details = dict(self.details)
        if details:
            merged_details.update(details)

        msg = format_checkpoint_msg(
            stage=f"{self.stage_name}:{sub_stage}",
            status="STEP",
            snap=snap,
            delta_mb=delta_since_last,
            elapsed_s=elapsed_sub,
            context=self.context,
            details=merged_details,
        )
        logger.info(msg)

        self.last_snap = snap
        self.last_time = now
        return snap

    def finish(self, exc: Optional[BaseException] = None) -> MemorySnapshot:
        now = time.monotonic()
        elapsed_total = round(now - self.t_start, 2)
        end_snap = get_memory_snapshot()
        delta_total = round(end_snap.rss_mb - (self.start_snap.rss_mb if self.start_snap else 0.0), 2)

        status = "FAILED" if exc else "DONE"
        det = dict(self.details)
        if exc:
            det["error"] = type(exc).__name__

        msg = format_checkpoint_msg(
            stage=self.stage_name,
            status=status,
            snap=end_snap,
            delta_mb=delta_total,
            elapsed_s=elapsed_total,
            context=self.context,
            details=det,
        )

        if exc:
            logger.error(msg)
        else:
            logger.info(msg)

        # Tracemalloc allocation difference analysis
        if self._tm_snapshot_start is not None:
            try:
                snap_end = tracemalloc.take_snapshot()
                top_diffs = snap_end.compare_to(self._tm_snapshot_start, "lineno")
                # Format top 4 allocation sites
                alloc_lines: List[str] = []
                for stat in top_diffs[:4]:
                    if abs(stat.size_diff) > 1024 * 10:  # Only report > 10KB diffs
                        kb_diff = stat.size_diff / 1024.0
                        total_kb = stat.size / 1024.0
                        alloc_lines.append(
                            f"{stat.traceback[0].filename.rsplit(os.sep, 1)[-1]}:{stat.traceback[0].lineno} "
                            f"(+{kb_diff:.1f}KB, cur={total_kb:.1f}KB)"
                        )
                if alloc_lines:
                    alloc_summary = " | ".join(alloc_lines)
                    logger.info(f"[MEM-ALLOC] stage=\"{self.stage_name}\" ctx=\"{self.context}\" top_sites=[{alloc_summary}]")
                del snap_end, self._tm_snapshot_start
            except Exception as tm_err:
                logger.debug(f"tracemalloc diff failed: {tm_err}")
            finally:
                if self._owns_tracemalloc:
                    try:
                        tracemalloc.stop()
                    except Exception:
                        pass

        return end_snap

    def __enter__(self) -> "MemoryStageTracker":
        return self.start()

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.finish(exc_val)
        return False

    async def __aenter__(self) -> "MemoryStageTracker":
        return self.start()

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        self.finish(exc_val)
        return False


# ── Full Diagnostic Report ───────────────────────────────────────────────────

def get_diagnostic_memory_report() -> Dict[str, Any]:
    """
    Generate a complete, non-blocking diagnostic memory report suitable for
    health endpoints, debugging dashboards, and Render log dumping.
    """
    snap = get_memory_snapshot()
    cgroup = _read_cgroup_memory()
    proc_status = _read_proc_status()

    # Python GC statistics
    gc_counts = gc.get_count()
    gc_stats = {
        "collections_gen0": gc_counts[0] if len(gc_counts) > 0 else 0,
        "collections_gen1": gc_counts[1] if len(gc_counts) > 1 else 0,
        "collections_gen2": gc_counts[2] if len(gc_counts) > 2 else 0,
    }

    # Count of objects by common large types (sampling)
    type_counts: Dict[str, int] = {}
    try:
        all_objs = gc.get_objects()
        for obj in all_objs[:10000]:  # Cap sample to 10k objects to avoid CPU spike
            t_name = type(obj).__name__
            if t_name in ("dict", "list", "str", "bytes", "tuple", "set", "ndarray", "PointStruct", "TreeNode"):
                type_counts[t_name] = type_counts.get(t_name, 0) + 1
    except Exception:
        pass

    # Thread count
    thread_count = threading.active_count()

    return {
        "timestamp": snap.timestamp,
        "pid": snap.pid,
        "process": {
            "rss_mb": snap.rss_mb,
            "vms_mb": snap.vms_mb,
            "peak_rss_mb": snap.peak_rss_mb,
            "anon_rss_mb": snap.anon_rss_mb,
            "file_rss_mb": snap.file_rss_mb,
        },
        "container": {
            "cgroup_version": cgroup.get("version"),
            "is_cgroup_measured": snap.is_cgroup_measured,
            "container_used_mb": snap.container_used_mb,
            "container_limit_mb": snap.container_limit_mb,
            "headroom_mb": snap.headroom_mb,
        },
        "gc": {
            "counts": gc_stats,
            "sample_type_counts": type_counts,
        },
        "system": {
            "platform": sys.platform,
            "thread_count": thread_count,
            "has_libc_malloc_trim": (_libc is not None and hasattr(_libc, "malloc_trim")),
        },
    }
