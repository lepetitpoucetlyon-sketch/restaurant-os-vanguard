FROM python:3.10-slim

WORKDIR /app

# Install system dependencies (required for image processing, libreoffice for docs, etc.)
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for layer caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy server code
COPY raganything_server.py .

# Expose LightRAG standard port
EXPOSE 9621

# Create storage directories
RUN mkdir -p /app/rag_storage /app/temp /app/mineru_models

CMD ["uvicorn", "raganything_server:app", "--host", "0.0.0.0", "--port", "9621"]
