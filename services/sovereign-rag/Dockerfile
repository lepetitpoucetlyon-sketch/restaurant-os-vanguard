FROM python:3.11-slim

WORKDIR /app

# Deps système minimaux
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential curl && \
    rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Données persistées via volume
RUN mkdir -p /data/sovereign_rag /data/uploads

ENV SOVEREIGN_RAG_DB_PATH=/data/sovereign_rag/sovereign.db
ENV UPLOAD_DIR=/data/uploads
ENV PYTHONUNBUFFERED=1

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

CMD ["gunicorn", "app.main:app", "-w", "2", "-k", "uvicorn.workers.UvicornWorker", \
     "--bind", "0.0.0.0:8000", "--timeout", "120"]
