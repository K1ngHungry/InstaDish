#!/bin/bash

# InstaDish App Startup Script
echo "🚀 Starting InstaDish Application..."

# Function to cleanup background processes
cleanup() {
    echo "🛑 Shutting down InstaDish..."
    
    # Kill processes by PID if available
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null
    fi
    if [ ! -z "$OLLAMA_PID" ]; then
        echo "🛑 Stopping Ollama..."
        kill $OLLAMA_PID 2>/dev/null
    fi
    
    # Also kill by process name as backup
    echo "🧹 Cleaning up any remaining processes..."
    pkill -f "uvicorn main:app" 2>/dev/null
    pkill -f "react-scripts start" 2>/dev/null
    pkill -f "ollama serve" 2>/dev/null
    
    # Wait a moment for processes to terminate
    sleep 2
    
    # Force kill if still running
    pkill -9 -f "uvicorn main:app" 2>/dev/null
    pkill -9 -f "react-scripts start" 2>/dev/null
    pkill -9 -f "ollama serve" 2>/dev/null
    
    echo "✅ Cleanup complete!"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Check if we're in the right directory
if [ ! -f "backend/main.py" ] || [ ! -f "frontend/package.json" ]; then
    echo "❌ Please run this script from the InstaDish root directory"
    exit 1
fi

# Clean up any existing processes before starting
echo "🧹 Checking for existing processes..."
if pgrep -f "uvicorn main:app" > /dev/null; then
    echo "⚠️  Found existing backend process, cleaning up..."
    pkill -f "uvicorn main:app" 2>/dev/null
    sleep 2
fi

if pgrep -f "react-scripts start" > /dev/null; then
    echo "⚠️  Found existing frontend process, cleaning up..."
    pkill -f "react-scripts start" 2>/dev/null
    sleep 2
fi

if pgrep -f "ollama serve" > /dev/null; then
    echo "⚠️  Found existing Ollama process, cleaning up..."
    pkill -f "ollama serve" 2>/dev/null
    sleep 2
fi

# Initialize conda properly
echo "📦 Setting up conda environment..."

# Check if conda is already available in PATH
if command -v conda &> /dev/null; then
    echo "✅ Conda found in PATH"
    CONDA_FOUND=true
else
    # Try to find and source conda from common locations
    CONDA_FOUND=false
    if [ -f ~/miniconda3/etc/profile.d/conda.sh ]; then
        source ~/miniconda3/etc/profile.d/conda.sh
        CONDA_FOUND=true
    elif [ -f ~/anaconda3/etc/profile.d/conda.sh ]; then
        source ~/anaconda3/etc/profile.d/conda.sh
        CONDA_FOUND=true
    elif [ -f /opt/homebrew/Caskroom/miniconda/base/etc/profile.d/conda.sh ]; then
        source /opt/homebrew/Caskroom/miniconda/base/etc/profile.d/conda.sh
        CONDA_FOUND=true
    elif [ -f /opt/homebrew/Caskroom/miniforge/base/etc/profile.d/conda.sh ]; then
        source /opt/homebrew/Caskroom/miniforge/base/etc/profile.d/conda.sh
        CONDA_FOUND=true
    elif [ -f /Users/kevin/yes/etc/profile.d/conda.sh ]; then
        source /Users/kevin/yes/etc/profile.d/conda.sh
        CONDA_FOUND=true
    fi
fi

if [ "$CONDA_FOUND" = false ]; then
    echo "❌ Conda not found. Please install conda or run: conda init"
    echo "Then run: conda activate instadish"
    exit 1
fi

# Check if conda environment is active
if [[ "$CONDA_DEFAULT_ENV" == "instadish" ]]; then
    echo "✅ Conda environment already active: $CONDA_DEFAULT_ENV"
else
    echo "📦 Activating instadish environment..."
    
    # Try to activate conda environment
    if conda activate instadish 2>/dev/null; then
        echo "✅ Conda environment activated: $CONDA_DEFAULT_ENV"
    else
        echo "❌ Failed to activate instadish environment"
        echo "Please run: conda activate instadish"
        echo "Or create the environment with: conda create -n instadish python=3.9"
        exit 1
    fi
fi

# Check if Ollama is running (configurable via environment)
OLLAMA_URL=${OLLAMA_URL:-"http://localhost:11434"}
echo "🤖 Checking Ollama service at $OLLAMA_URL..."
if curl -s $OLLAMA_URL/api/tags > /dev/null 2>&1; then
    echo "✅ Ollama is already running"
else
    echo "🚀 Starting Ollama service in CPU-only mode (for stability)..."
    OLLAMA_GPU_LAYERS=0 ollama serve &
    OLLAMA_PID=$!
    sleep 5
    echo "✅ Ollama started in CPU-only mode"
fi

# Get configuration from environment variables
HOST=${HOST:-"0.0.0.0"}
PORT=${PORT:-"8000"}
RELOAD=${RELOAD:-"true"}
FRONTEND_PORT=${REACT_APP_PORT:-"3000"}
PYTHON_ENV=${PYTHON_ENV:-"instadish"}
DEBUG=${DEBUG:-"false"}

# Start backend in background
echo "🔧 Starting FastAPI backend..."
cd backend

# Set memory limits and start backend
export PYTHONUNBUFFERED=1
export MALLOC_TRIM_THRESHOLD_=131072
export MALLOC_MMAP_THRESHOLD_=131072
export MALLOC_MMAP_MAX_=65536

python -m uvicorn main:app --host $HOST --port $PORT --reload --workers 1 &
BACKEND_PID=$!

# Wait for backend to start and check if it's healthy
echo "⏳ Waiting for backend to start..."
for i in {1..30}; do
    if curl -s http://$HOST:$PORT/health > /dev/null 2>&1; then
        echo "✅ Backend is healthy and ready!"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "❌ Backend failed to start after 30 seconds"
        echo "Check the logs above for errors"
        cleanup
        exit 1
    fi
    sleep 1
done

# Start frontend in background
echo "🎨 Starting React frontend..."
cd ../frontend

# Set Node.js memory limits
export NODE_OPTIONS="--max-old-space-size=2048"

npm start &
FRONTEND_PID=$!

# Wait for frontend to start
echo "⏳ Waiting for frontend to start..."
for i in {1..60}; do
    if curl -s http://localhost:$FRONTEND_PORT > /dev/null 2>&1; then
        echo "✅ Frontend is ready!"
        break
    fi
    if [ $i -eq 60 ]; then
        echo "⚠️  Frontend taking longer than expected to start"
        echo "It may still be starting up in the background"
        break
    fi
    sleep 1
done

echo ""
echo "🎉 InstaDish is running!"
echo "📱 Frontend: http://localhost:$FRONTEND_PORT"
echo "🔧 Backend:  http://$HOST:$PORT"
echo "🤖 Ollama:   $OLLAMA_URL"
echo "📊 Health:   http://$HOST:$PORT/health"
echo "📚 API Docs: http://$HOST:$PORT/docs"
echo ""
echo "Press Ctrl+C to stop all services"

# Monitor processes and restart if they die
while true; do
    if ! kill -0 $BACKEND_PID 2>/dev/null; then
        echo "❌ Backend process died, restarting..."
        cd backend
        python -m uvicorn main:app --host $HOST --port $PORT --reload --workers 1 &
        BACKEND_PID=$!
        cd ..
    fi
    
    if ! kill -0 $FRONTEND_PID 2>/dev/null; then
        echo "❌ Frontend process died, restarting..."
        cd frontend
        npm start &
        FRONTEND_PID=$!
        cd ..
    fi
    
    sleep 5
done