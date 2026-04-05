FROM python:3.11

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 1. Copy ALL files first. 
# This completely bypasses Railway's strict file-path missing errors because 
# Railway occasionally sets the entire repository root as the build context.
COPY . .

# 2. Check where the requirements actually got placed during the copy and install them
RUN if [ -f "backend/requirements.txt" ]; then \
        pip install --no-cache-dir -r backend/requirements.txt; \
    else \
        pip install --no-cache-dir -r requirements.txt; \
    fi

EXPOSE 8000

# 3. Start Uvicorn. If Railway dumped the whole repo in /app, we simply step into the backend folder first.
CMD ["sh", "-c", "if [ -d 'backend' ]; then cd backend; fi && uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
