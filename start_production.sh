#!/bin/bash

# InstaDish Production Startup Script
echo "🚀 Starting InstaDish in Production Mode..."

# Load environment variables from .env file
if [ -f "backend/.env" ]; then
    echo "📋 Loading environment variables from backend/.env"
    export $(cat backend/.env | grep -v '^#' | xargs)
fi

# Check if we're in the right directory
if [ ! -f "backend/main.py" ] || [ ! -f "frontend/package.json" ]; then
    echo "❌ Please run this script from the InstaDish root directory"
    exit 1
fi

# Production configuration
HOST=${HOST:-"0.0.0.0"}
PORT=${PORT:-"8000"}
RELOAD=${RELOAD:-"false"}
LOG_LEVEL=${LOG_LEVEL:-"info"}

echo "🔧 Production Configuration:"
echo "   Host: $HOST"
echo "   Port: $PORT"
echo "   Reload: $RELOAD"
echo "   Log Level: $LOG_LEVEL"

# Check if Ollama is running (configurable via environment)
OLLAMA_URL=${OLLAMA_URL:-"http://localhost:11434"}
echo "🤖 Checking Ollama service at $OLLAMA_URL..."
if curl -s $OLLAMA_URL/api/tags > /dev/null 2>&1; then
    echo "✅ Ollama is already running"
else
    echo "❌ Ollama is not running. Please start Ollama service first."
    echo "   Run: ollama serve"
    exit 1
fi

# Start backend in production mode
echo "🔧 Starting FastAPI backend in production mode..."
cd backend
python -m uvicorn main:app --host $HOST --port $PORT --reload $RELOAD --log-level $LOG_LEVEL
