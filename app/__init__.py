"""Root proxy package forwarding imports to backend/app.

Enables 'python -m uvicorn app.main:app' to work directly from the repository root.
"""
from pathlib import Path
import sys

_backend_dir = str(Path(__file__).resolve().parent.parent / "backend")
if _backend_dir not in sys.path:
    sys.path.insert(0, _backend_dir)

_backend_app_dir = str(Path(__file__).resolve().parent.parent / "backend" / "app")
if _backend_app_dir not in __path__:
    __path__.insert(0, _backend_app_dir)
