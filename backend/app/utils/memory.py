"""
Memory Management Utilities.

Provides explicit garbage collection and glibc heap trimming for
memory-constrained container environments (e.g. Render Free Tier 512MB limit).
"""
import gc
import sys
import ctypes
from loguru import logger

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
            # malloc_trim(0) tells glibc to release as much memory as possible to the OS
            _libc.malloc_trim(0)
    except Exception as e:
        logger.debug(f"trim_memory error: {e}")
