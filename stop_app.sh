#!/bin/bash

# InstaDish Stop Script
echo "🛑 Stopping InstaDish services..."

# Function to kill processes on specific ports
kill_port() {
    local port=$1
    local service_name=$2
    local pids=$(lsof -ti:$port 2>/dev/null)
    
    if [ ! -z "$pids" ]; then
        echo "🛑 Stopping $service_name on port $port (PIDs: $pids)"
        kill -9 $pids
        sleep 1
    else
        echo "✅ $service_name on port $port is not running"
    fi
}

# Stop all InstaDish services
kill_port 3000 "Frontend (React)"
kill_port 8000 "Backend (FastAPI)"
kill_port 11434 "Ollama (AI Service)"

# Check if any processes are still running
echo ""
echo "🔍 Checking for remaining processes..."
remaining=$(lsof -i :3000 -i :8000 -i :11434 2>/dev/null)

if [ -z "$remaining" ]; then
    echo "✅ All InstaDish services stopped successfully"
else
    echo "⚠️  Some processes may still be running:"
    echo "$remaining"
fi

echo ""
echo "🎉 Cleanup complete!"
