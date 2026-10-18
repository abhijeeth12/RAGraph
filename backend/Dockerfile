# ─────────────────────────────────────────────────────────────────────────────
# RAGraph Backend — Production Dockerfile
# Optimised for Render (free tier compatible, ~500MB image)
# ─────────────────────────────────────────────────────────────────────────────
FROM python:3.11-slim

# Prevent .pyc files, ensure stdout/stderr are unbuffered
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    MALLOC_ARENA_MAX=2 \
    OMP_NUM_THREADS=1 \
    OPENBLAS_NUM_THREADS=1 \
    MKL_NUM_THREADS=1 \
    VECLIB_MAXIMUM_THREADS=1 \
    NUMEXPR_NUM_THREADS=1

# System deps: gcc for native extensions, libpq for asyncpg.
# libgomp1 provides the OpenMP runtime used by LiteParse's bundled Tesseract/OCR.
# LibreOffice is intentionally NOT installed: RAGraph keeps its lightweight
# python-docx / python-pptx adapters for Office formats instead of converting
# them to PDF (which would add ~600MB to the image).
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    libpq-dev \
    libgomp1 \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# ── Install Python deps ──────────────────────────────────────────────────────
# Copy requirements first for Docker layer caching
COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

# ── Copy application ─────────────────────────────────────────────────────────
COPY . .

# Create uploads directory (will be overridden by Render Disk if configured)
RUN mkdir -p /app/uploads/images

# ── Health check ─────────────────────────────────────────────────────────────
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:${PORT:-8000}/api/health || exit 1

# Pre-download the default embedding model to avoid runtime overhead
RUN python -c "from fastembed import TextEmbedding; TextEmbedding('sentence-transformers/all-MiniLM-L6-v2')"

EXPOSE 8000

# ── Start ────────────────────────────────────────────────────────────────────
CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000} --workers 1
