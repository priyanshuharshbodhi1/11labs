FROM python:3.9-slim

WORKDIR /app

# Install system dependencies if needed (e.g. for some pip packages)
# RUN apt-get update && apt-get install -y gcc

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Cloud Run expects the container to listen on $PORT (default 8080)
ENV PORT=8080

# Run using uvicorn directly
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port $PORT"]
