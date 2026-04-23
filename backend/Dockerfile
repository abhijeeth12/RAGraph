# ─────────────────────────────────────────────────────────────────────────────
# RAGraph Backend — Production Dockerfile
# Optimised for Render (free tier compatible, ~500MB image)
# ─────────────────────────────────────────────────────────────────────────────
FROM python:3.11-slim

# Prevent .pyc files, ensure stdout/stderr are unbuffered
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    # torch: CPU-only, no CUDA download
    PIP_NO_CACHE_DIR=1

# System deps: gcc for native extensions, libpq for asyncpg
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# ── Install Python deps ──────────────────────────────────────────────────────
# Copy requirements first for Docker layer caching
COPY requirements.txt .

# Install torch CPU-only FIRST (before requirements.txt) to avoid CUDA wheels
# This saves ~800MB vs the default GPU build
RUN pip install --no-cache-dir \
    torch==2.5.1 \
    --index-url https://download.pytorch.org/whl/cpu \
    && pip install --no-cache-dir -r requirements.txt

# ── Copy application ─────────────────────────────────────────────────────────
COPY . .

# Create uploads directory (will be overridden by Render Disk if configured)
RUN mkdir -p /app/uploads/images

# ── Health check ─────────────────────────────────────────────────────────────
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:${PORT:-8000}/api/health || exit 1

EXPOSE 8000

# ── Start ────────────────────────────────────────────────────────────────────
CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000} --workers 1
