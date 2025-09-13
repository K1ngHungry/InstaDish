#!/bin/bash

# InstaDish RAG Setup Script with Miniconda
echo "🍽️ InstaDish RAG Setup with Miniconda"
echo "====================================="

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

# Check if conda is installed
if ! command -v conda &> /dev/null; then
    echo "❌ Conda is not installed or not in PATH."
    echo "Please install Miniconda or Anaconda first:"
    echo "https://docs.conda.io/en/latest/miniconda.html"
    exit 1
fi

echo "✅ Found conda installation"

# Create conda environment if it doesn't exist
ENV_NAME="instadish-rag"
if conda env list | grep -q "^$ENV_NAME "; then
    echo "🔄 Conda environment '$ENV_NAME' already exists"
else
    echo "🔄 Creating conda environment '$ENV_NAME'..."
    conda env create -f "$SCRIPT_DIR/environment.yml"
fi

# Activate conda environment
echo "🔄 Activating conda environment..."
source "$(conda info --base)/etc/profile.d/conda.sh"
conda activate "$ENV_NAME"

# Create data directory
DATA_DIR="$PROJECT_ROOT/data/embeddings"
mkdir -p "$DATA_DIR"

# Generate embeddings
echo "🔄 Generating embeddings from CSV data..."
cd "$SCRIPT_DIR"
python generate_embeddings.py --csv ../recipes_small.csv --output ../data/embeddings

# Check if embeddings were generated successfully
if [ -f "$DATA_DIR/recipe_index.faiss" ] && [ -f "$DATA_DIR/recipe_metadata.json" ]; then
    echo "✅ Embeddings generated successfully!"
    echo "📁 Files created in: $DATA_DIR"
    echo ""
    echo "🚀 You can now start your InstaDish server with:"
    echo "   npm run dev"
    echo ""
    echo "📊 The RAG system will automatically load the embeddings on startup."
    echo ""
    echo "💡 To reactivate the conda environment later:"
    echo "   conda activate $ENV_NAME"
else
    echo "❌ Failed to generate embeddings. Please check the error messages above."
    exit 1
fi

echo "🎉 RAG setup complete!"

