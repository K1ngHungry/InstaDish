#!/bin/bash

# InstaDish Stop Script
# Stops all running InstaDish services

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🛑 Stopping InstaDish Application...${NC}"

# Function to stop process by PID file
stop_by_pid() {
    local pid_file=$1
    local service_name=$2
    
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if ps -p $pid > /dev/null 2>&1; then
            echo -e "${BLUE}🛑 Stopping ${service_name} (PID: $pid)...${NC}"
            kill $pid 2>/dev/null || true
            sleep 2
            
            # Force kill if still running
            if ps -p $pid > /dev/null 2>&1; then
                echo -e "${YELLOW}⚠️  Force stopping ${service_name}...${NC}"
                kill -9 $pid 2>/dev/null || true
            fi
            
            echo -e "${GREEN}✅ ${service_name} stopped${NC}"
        else
            echo -e "${YELLOW}⚠️  ${service_name} process not found${NC}"
        fi
        rm -f "$pid_file"
    else
        echo -e "${YELLOW}⚠️  No PID file found for ${service_name}${NC}"
    fi
}

# Function to stop processes by name
stop_by_name() {
    local process_name=$1
    local service_name=$2
    
    local pids=$(pgrep -f "$process_name" 2>/dev/null || true)
    
    if [ -n "$pids" ]; then
        echo -e "${BLUE}🛑 Stopping ${service_name} processes...${NC}"
        echo "$pids" | xargs kill 2>/dev/null || true
        sleep 2
        
        # Force kill if still running
        local remaining_pids=$(pgrep -f "$process_name" 2>/dev/null || true)
        if [ -n "$remaining_pids" ]; then
            echo -e "${YELLOW}⚠️  Force stopping remaining ${service_name} processes...${NC}"
            echo "$remaining_pids" | xargs kill -9 2>/dev/null || true
        fi
        
        echo -e "${GREEN}✅ ${service_name} stopped${NC}"
    else
        echo -e "${YELLOW}⚠️  No ${service_name} processes found${NC}"
    fi
}

# Function to stop services on specific ports
stop_by_port() {
    local port=$1
    local service_name=$2
    
    local pids=$(lsof -ti :$port 2>/dev/null || true)
    
    if [ -n "$pids" ]; then
        echo -e "${BLUE}🛑 Stopping ${service_name} on port ${port}...${NC}"
        echo "$pids" | xargs kill 2>/dev/null || true
        sleep 2
        
        # Force kill if still running
        local remaining_pids=$(lsof -ti :$port 2>/dev/null || true)
        if [ -n "$remaining_pids" ]; then
            echo -e "${YELLOW}⚠️  Force stopping remaining processes on port ${port}...${NC}"
            echo "$remaining_pids" | xargs kill -9 2>/dev/null || true
        fi
        
        echo -e "${GREEN}✅ ${service_name} stopped${NC}"
    else
        echo -e "${YELLOW}⚠️  No processes found on port ${port}${NC}"
    fi
}

# Main execution
main() {
    # Stop by PID files (preferred method)
    stop_by_pid ".backend.pid" "Backend"
    stop_by_pid ".frontend.pid" "Frontend"
    stop_by_pid ".ollama.pid" "Ollama"
    
    # Fallback: Stop by process names (more aggressive)
    stop_by_name "uvicorn main:app" "Backend"
    stop_by_name "react-scripts start" "Frontend"
    stop_by_name "ollama serve" "Ollama"
    
    # Additional cleanup for common process patterns
    stop_by_name "uvicorn" "Uvicorn processes"
    stop_by_name "react-scripts" "React processes"
    stop_by_name "node.*start.js" "Node start processes"
    
    # Fallback: Stop by ports
    stop_by_port "8000" "Backend"
    stop_by_port "3000" "Frontend"
    stop_by_port "11434" "Ollama"
    
    # Final cleanup: Kill any remaining processes on our ports
    echo -e "${BLUE}🧹 Final cleanup of remaining processes...${NC}"
    for port in 8000 3000 11434; do
        local pids=$(lsof -ti :$port 2>/dev/null || true)
        if [ -n "$pids" ]; then
            echo -e "${YELLOW}⚠️  Killing remaining processes on port $port: $pids${NC}"
            echo "$pids" | xargs kill -9 2>/dev/null || true
        fi
    done
    
    # Clean up log files
    echo -e "${BLUE}🧹 Cleaning up log files...${NC}"
    rm -f .backend.log .frontend.log .ollama.log
    
    # Clean up PID files
    rm -f .backend.pid .frontend.pid .ollama.pid
    
    echo ""
    echo -e "${GREEN}✅ All InstaDish services stopped${NC}"
    echo -e "${BLUE}💡 To start again, run: ./start.sh${NC}"
}

# Run main function
main
