#!/bin/bash

# InstaDish Start Script
# Starts all services with configurable environment variables

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting InstaDish Application...${NC}"

# Load environment variables
if [ -f .env ]; then
    echo -e "${GREEN}📋 Loading environment variables from .env${NC}"
    export $(cat .env | grep -v '^#' | xargs)
else
    echo -e "${YELLOW}⚠️  No .env file found, using defaults${NC}"
fi

# Set defaults
HOST=${HOST:-"0.0.0.0"}
PORT=${PORT:-"8000"}
FRONTEND_PORT=${REACT_APP_PORT:-"3000"}
PYTHON_ENV=${PYTHON_ENV:-"instadish"}
OLLAMA_URL=${OLLAMA_URL:-"http://localhost:11434"}

echo -e "${BLUE}🔧 Configuration:${NC}"
echo -e "  Backend: ${HOST}:${PORT}"
echo -e "  Frontend: localhost:${FRONTEND_PORT}"
echo -e "  Ollama: ${OLLAMA_URL}"
echo -e "  Python Env: ${PYTHON_ENV}"
echo ""

# Function to check if conda is available
check_conda() {
    if ! command -v conda &> /dev/null; then
        echo -e "${RED}❌ Conda not found. Please install Miniconda or Anaconda${NC}"
        exit 1
    fi
}

# Function to activate conda environment
activate_conda() {
    echo -e "${BLUE}📦 Activating conda environment: ${PYTHON_ENV}${NC}"
    
    # Initialize conda for this shell
    eval "$(conda shell.bash hook)"
    
    # Activate environment
    if conda activate ${PYTHON_ENV} 2>/dev/null; then
        echo -e "${GREEN}✅ Environment activated${NC}"
    else
        echo -e "${RED}❌ Failed to activate ${PYTHON_ENV} environment${NC}"
        echo -e "${YELLOW}💡 Create it with: conda create -n ${PYTHON_ENV} python=3.9${NC}"
        exit 1
    fi
}

# Function to check if port is in use
check_port() {
    local port=$1
    local service=$2
    
    if lsof -i :${port} > /dev/null 2>&1; then
        echo -e "${YELLOW}⚠️  Port ${port} is already in use (${service})${NC}"
        echo -e "${YELLOW}💡 Run ./stop.sh to stop existing services${NC}"
        exit 1
    fi
}

# Function to start Ollama
start_ollama() {
    echo -e "${BLUE}🤖 Starting Ollama...${NC}"
    
    if command -v ollama &> /dev/null; then
        # Start Ollama in background
        ollama serve > /dev/null 2>&1 &
        OLLAMA_PID=$!
        echo $OLLAMA_PID > .ollama.pid
        sleep 3
        
        # Test if Ollama is running
        if curl -s ${OLLAMA_URL}/api/tags > /dev/null 2>&1; then
            echo -e "${GREEN}✅ Ollama started successfully${NC}"
        else
            echo -e "${YELLOW}⚠️  Ollama may not be ready yet${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  Ollama not found. Install from: https://ollama.ai${NC}"
    fi
}

# Function to start backend
start_backend() {
    echo -e "${BLUE}🔧 Starting FastAPI backend...${NC}"
    
    cd backend
    
    # Check if uvicorn is installed
    if ! python -c "import uvicorn" 2>/dev/null; then
        echo -e "${RED}❌ uvicorn not found in environment${NC}"
        echo -e "${YELLOW}💡 Install with: pip install uvicorn[standard]${NC}"
        exit 1
    fi
    
    # Start backend in background
    python -m uvicorn main:app --host ${HOST} --port ${PORT} --reload > ../.backend.log 2>&1 &
    BACKEND_PID=$!
    echo $BACKEND_PID > ../.backend.pid
    cd ..
    
    # Wait for backend to start
    echo -e "${BLUE}⏳ Waiting for backend to start...${NC}"
    for i in {1..30}; do
        if curl -s http://${HOST}:${PORT}/health > /dev/null 2>&1; then
            echo -e "${GREEN}✅ Backend is ready!${NC}"
            break
        fi
        if [ $i -eq 30 ]; then
            echo -e "${RED}❌ Backend failed to start${NC}"
            echo -e "${YELLOW}💡 Check .backend.log for details${NC}"
            exit 1
        fi
        sleep 1
    done
}

# Function to start frontend
start_frontend() {
    echo -e "${BLUE}📱 Starting React frontend...${NC}"
    
    cd frontend
    
    # Check if node_modules exists
    if [ ! -d "node_modules" ]; then
        echo -e "${BLUE}📦 Installing frontend dependencies...${NC}"
        npm install
    fi
    
    # Start frontend in background
    npm start > ../.frontend.log 2>&1 &
    FRONTEND_PID=$!
    echo $FRONTEND_PID > ../.frontend.pid
    cd ..
    
    # Wait for frontend to start
    echo -e "${BLUE}⏳ Waiting for frontend to start...${NC}"
    for i in {1..60}; do
        if curl -s http://localhost:${FRONTEND_PORT} > /dev/null 2>&1; then
            echo -e "${GREEN}✅ Frontend is ready!${NC}"
            break
        fi
        if [ $i -eq 60 ]; then
            echo -e "${YELLOW}⚠️  Frontend taking longer than expected${NC}"
            break
        fi
        sleep 1
    done
}

# Main execution
main() {
    # Check prerequisites
    check_conda
    check_port ${PORT} "backend"
    check_port ${FRONTEND_PORT} "frontend"
    
    # Activate conda environment
    activate_conda
    
    # Start services
    start_ollama
    start_backend
    start_frontend
    
    # Success message
    echo ""
    echo -e "${GREEN}🎉 InstaDish is running!${NC}"
    echo -e "${BLUE}📱 Frontend: http://localhost:${FRONTEND_PORT}${NC}"
    echo -e "${BLUE}🔧 Backend:  http://${HOST}:${PORT}${NC}"
    echo -e "${BLUE}🤖 Ollama:   ${OLLAMA_URL}${NC}"
    echo -e "${BLUE}📊 Health:   http://${HOST}:${PORT}/health${NC}"
    echo -e "${BLUE}📚 API Docs: http://${HOST}:${PORT}/docs${NC}"
    echo ""
    echo -e "${YELLOW}💡 To stop all services, run: ./stop.sh${NC}"
}

# Run main function
main
