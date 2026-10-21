"""Root proxy module forwarding app.main to backend/app/main.py.

Enables 'python -m uvicorn app.main:app' to work directly from the repository root.
"""
from pathlib import Path
import sys

_backend_dir = str(Path(__file__).resolve().parent.parent / "backend")
if _backend_dir not in sys.path:
    sys.path.insert(0, _backend_dir)

# Import the actual FastAPI instance from backend/app/main.py
import app.main as _real_main

app = _real_main.app
