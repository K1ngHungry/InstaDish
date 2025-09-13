#!/bin/bash

echo "🚀 Starting InstaDish AI Service..."

# Check if we're in a conda environment
if [[ "$CONDA_DEFAULT_ENV" == "instadish" ]]; then
    echo "✅ Using conda environment: $CONDA_DEFAULT_ENV"
    python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
else
    echo "⚠️  Not in conda environment, using system Python"
    echo "💡 For best results, activate conda environment first:"
    echo "   conda activate instadish"
    echo ""
    python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
fi
