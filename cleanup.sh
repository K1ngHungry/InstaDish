#!/bin/bash

# InstaDish Cleanup Script
echo "🧹 Cleaning up InstaDish processes..."

# Kill backend processes
echo " Stopping backend..."
pkill -f "uvicorn main:app" 2>/dev/null
pkill -f "python.*main:app" 2>/dev/null

# Kill frontend processes
echo " Stopping frontend..."
pkill -f "react-scripts start" 2>/dev/null
pkill -f "node.*start.js" 2>/dev/null

# Kill Ollama processes
echo " Stopping Ollama..."
pkill -f "ollama serve" 2>/dev/null
pkill -f "ollama runner" 2>/dev/null

# Wait a moment for processes to terminate
sleep 2

# Check if any processes are still running
REMAINING=$(ps aux | grep -E "(uvicorn|react-scripts|ollama)" | grep -v grep | wc -l)

if [ $REMAINING -gt 0 ]; then
    echo "  Some processes may still be running. Force killing..."
    pkill -9 -f "uvicorn main:app" 2>/dev/null
    pkill -9 -f "react-scripts start" 2>/dev/null
    pkill -9 -f "ollama serve" 2>/dev/null
    sleep 1
fi

# Check ports
echo "🔍 Checking ports..."
if lsof -i :8000 >/dev/null 2>&1; then
    echo "  Port 8000 is still in use"
    lsof -i :8000
fi

if lsof -i :3000 >/dev/null 2>&1; then
    echo "  Port 3000 is still in use"
    lsof -i :3000
fi

if lsof -i :11434 >/dev/null 2>&1; then
    echo "  Port 11434 is still in use"
    lsof -i :11434
fi

echo " Cleanup complete!"
