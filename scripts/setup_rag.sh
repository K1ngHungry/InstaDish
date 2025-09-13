#!/bin/bash

# InstaDish RAG Setup Script
echo "🍽️ InstaDish RAG Setup"
echo "======================"

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required but not installed."
    echo "Please install Python 3 and try again."
    exit 1
fi

# Check if pip is installed
if ! command -v pip3 &> /dev/null; then
    echo "❌ pip3 is required but not installed."
    echo "Please install pip3 and try again."
    exit 1
fi

# Get the directory of this script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "📁 Project root: $PROJECT_ROOT"
echo "📁 Script directory: $SCRIPT_DIR"

# Check if CSV file exists
CSV_FILE="$PROJECT_ROOT/recipes_small.csv"
if [ ! -f "$CSV_FILE" ]; then
    echo "❌ CSV file not found at: $CSV_FILE"
    echo "Please make sure recipes_small.csv is in the project root."
    exit 1
fi

echo "✅ Found CSV file: $CSV_FILE"

# Create virtual environment if it doesn't exist
VENV_DIR="$SCRIPT_DIR/venv"
if [ ! -d "$VENV_DIR" ]; then
    echo "🔄 Creating Python virtual environment..."
    python3 -m venv "$VENV_DIR"
fi

# Activate virtual environment
echo "🔄 Activating virtual environment..."
source "$VENV_DIR/bin/activate"

# Create data directory
DATA_DIR="$PROJECT_ROOT/data/embeddings"
mkdir -p "$DATA_DIR"

# Generate search index (no heavy dependencies needed)
echo "🔄 Generating search index from CSV data..."
python3 "$SCRIPT_DIR/simple_embedding_generator.py"

# Check if search index was generated successfully
if [ -f "$DATA_DIR/search_index.json" ] && [ -f "$DATA_DIR/recipe_metadata.json" ]; then
    echo "✅ Search index generated successfully!"
    echo "📁 Files created in: $DATA_DIR"
    echo ""
    echo "🚀 You can now start your InstaDish server with:"
    echo "   npm run dev"
    echo ""
    echo "📊 The RAG system will automatically load the search index on startup."
else
    echo "❌ Failed to generate search index. Please check the error messages above."
    exit 1
fi

echo "🎉 RAG setup complete!"
