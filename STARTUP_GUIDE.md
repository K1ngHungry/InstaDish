# InstaDish Startup Guide

## Quick Start

### Automatic Script (Recommended)
```bash
./start_app.sh
```
- Handles conda activation automatically
- Starts Ollama in CPU-only mode for stability
- Includes health checks and process monitoring
- Auto-restarts services if they crash
- Best for all users

### Manual Commands (If script fails)
If the script fails, you can start manually:

```bash
# Terminal 1: Start Ollama (CPU-only mode for stability)
OLLAMA_GPU_LAYERS=0 ollama serve

# Terminal 2: Start Backend
conda activate instadish
cd backend
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# Terminal 3: Start Frontend
cd frontend
npm start
```

## Troubleshooting

### Ollama Issues
If you get memory errors or 500 status from chatbot:
1. The startup script automatically runs Ollama in CPU-only mode for stability
2. This makes responses slower but prevents memory crashes
3. If you still have issues, restart Ollama: `pkill -f ollama && OLLAMA_GPU_LAYERS=0 ollama serve`

### Conda Issues
If you get conda errors:
1. Run `conda init` in your shell
2. Restart your terminal
3. Run `conda activate instadish`
4. Try the manual script

### Memory Issues
If processes are being killed:
1. Close other applications to free up memory
2. The startup script includes memory optimization settings
3. Ollama runs in CPU-only mode to prevent GPU memory issues
4. Restart your computer if needed

### Port Conflicts
If ports are in use:
```bash
# Kill existing processes
pkill -f "uvicorn main:app"
pkill -f "react-scripts start"
pkill -f "ollama serve"
```

## Access Points
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:8000
- **Health Check**: http://localhost:8000/health
- **API Docs**: http://localhost:8000/docs
- **Ollama**: http://localhost:11434

## Stopping the Application
Press `Ctrl+C` in the terminal where you ran `./start_app.sh`. This will stop all services gracefully.
