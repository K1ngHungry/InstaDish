#!/bin/bash

# InstaDish App Startup Script
echo "🚀 Starting InstaDish Application..."

# Function to cleanup background processes
cleanup() {
    echo "🛑 Shutting down InstaDish..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    if [ ! -z "$OLLAMA_PID" ]; then
        echo "🛑 Stopping Ollama..."
        kill $OLLAMA_PID 2>/dev/null
    fi
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Check if we're in the right directory
if [ ! -f "backend/main.py" ] || [ ! -f "frontend/package.json" ]; then
    echo "❌ Please run this script from the InstaDish root directory"
    exit 1
fi

# Check if conda environment is active
if [[ "$CONDA_DEFAULT_ENV" == "instadish" ]]; then
    echo "✅ Conda environment already active: $CONDA_DEFAULT_ENV"
else
    echo "📦 Activating conda environment..."
    
    # Try to activate conda environment
    if command -v conda &> /dev/null; then
        # Try different conda initialization methods
        if [ -f ~/miniconda3/etc/profile.d/conda.sh ]; then
            source ~/miniconda3/etc/profile.d/conda.sh
        elif [ -f ~/anaconda3/etc/profile.d/conda.sh ]; then
            source ~/anaconda3/etc/profile.d/conda.sh
        fi
        
        conda activate instadish
        
        if [[ "$CONDA_DEFAULT_ENV" != "instadish" ]]; then
            echo "Failed to activate instadish environment"
            echo "Please run: conda activate instadish"
            exit 1
        fi
    else
        echo "Conda not found. Please install conda first."
        exit 1
    fi
fi

echo "✅ Conda environment activated: $CONDA_DEFAULT_ENV"

# Check if Ollama is running (configurable via environment)
OLLAMA_URL=${OLLAMA_URL:-"http://localhost:11434"}
echo "🤖 Checking Ollama service at $OLLAMA_URL..."
if curl -s $OLLAMA_URL/api/tags > /dev/null 2>&1; then
    echo "✅ Ollama is already running"
else
    echo "🚀 Starting Ollama service..."
    ollama serve &
    OLLAMA_PID=$!
    sleep 5
    echo "✅ Ollama started"
fi

# Get configuration from environment variables
HOST=${HOST:-"0.0.0.0"}
PORT=${PORT:-"8000"}
RELOAD=${RELOAD:-"true"}

# Start backend in background
echo "🔧 Starting FastAPI backend..."
cd backend
python -m uvicorn main:app --host $HOST --port $PORT --reload &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Start frontend in background
echo "🎨 Starting React frontend..."
cd ../frontend
npm start &
FRONTEND_PID=$!

echo ""
echo "🎉 InstaDish is starting up!"
echo "📱 Frontend: http://localhost:3000"
echo "🔧 Backend:  http://$HOST:$PORT"
echo "🤖 Ollama:   $OLLAMA_URL"
echo "📊 Health:   http://$HOST:$PORT/health"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID