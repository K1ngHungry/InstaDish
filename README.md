# InstaDish - AI-Powered Recipe Discovery

A modern, AI-powered recipe discovery platform built with FastAPI and React, featuring semantic search, sustainability analysis, health scoring, and intelligent chatbot assistance.

## Features

- **Semantic Recipe Search**: Find recipes using natural language queries powered by FAISS vector search
- **AI Chatbot**: Get cooking advice and recipe suggestions from an AI assistant with recipe-specific guidance
- **Sustainability Analysis**: Analyze the environmental impact of your ingredients with detailed carbon footprint and water usage
- **Health Scoring**: Get nutritional health scores for recipes using FatSecret API integration
- **Advanced Recipe Matching**: See how well your ingredients match recipe requirements with critical/important/replaceable ingredient classification
- **Smart Sorting**: Sort recipes by ingredient match, sustainability, or health scores
- **Recipe Selection**: Select a recipe to get focused AI advice and relevant quick questions
- **Persistent Embeddings**: Fast startup with cached vector embeddings (1,339 recipes)
- **Responsive Design**: Beautiful, mobile-friendly interface

## Architecture

- **Backend**: FastAPI with Python 3.9+ (async/await patterns)
- **Frontend**: React with TypeScript, modern hooks-based architecture
- **AI/ML**: FAISS vector database, sentence-transformers, RAG architecture
- **LLM**: Ollama integration with LLaMA 2:7b for contextual cooking assistant
- **APIs**: FatSecret API (OAuth 2.0) for nutritional health scoring
- **Data**: 1,339 real recipes from CSV database with pre-computed embeddings
- **Environment**: Conda for Python dependency management

## Quick Start

### Prerequisites

- Python 3.9+
- Node.js 16+
- Conda/Miniconda
- Ollama


## 🛠️ Manual Setup

### Backend Setup
```bash
# Clone the repository
git clone <repository-url>
cd InstaDish

# Activate conda environment
conda activate instadish

# Install Python dependencies
cd backend
pip install -r requirements.txt

# Start the backend
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### Frontend Setup
```bash
# Install Node.js dependencies
cd frontend
npm install

# Start the frontend
npm start
```

### AI Chatbot Setup
```bash
# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Pull the model
ollama pull llama2:7b

# Start Ollama service (CPU-only mode for stability)
OLLAMA_GPU_LAYERS=0 ollama serve
```

## 📁 Project Structure

```
InstaDish/
├── backend/                 # FastAPI backend
│   ├── main.py             # Main application entry point
│   ├── services/           # Business logic services
│   │   ├── rag_service.py  # FAISS + embeddings + pattern analysis
│   │   ├── ollama_service.py # AI chatbot integration
│   │   ├── sustainability_service.py # Environmental impact analysis
│   │   └── health_service.py # FatSecret API integration
│   ├── data/               # Persistent data and cache
│   │   ├── faiss_index.faiss # Vector embeddings index
│   │   ├── recipe_metadata.json # Recipe information cache
│   │   ├── recipe_texts.json # Recipe text cache
│   │   ├── embeddings.npy # Vector embeddings cache
│   │   ├── index_config.json # FAISS configuration
│   │   ├── ingredient_aliases.json # Ingredient matching rules
│   │   ├── critical_ingredients.json # Ingredient importance data
│   │   └── ingredient_substitutions.json # Substitution suggestions
│   ├── .env                # Environment variables
│   ├── requirements.txt    # Python dependencies
│   └── FATSECRET_SETUP.md  # Health API setup guide
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # UI components
│   │   │   ├── common/     # Shared components
│   │   │   │   ├── Header.js # Navigation header
│   │   │   │   └── IngredientInput.js # Ingredient input component
│   │   │   ├── chatbot/    # AI chatbot components
│   │   │   │   └── Chatbot.js # Main chatbot interface
│   │   │   ├── recipe/     # Recipe-related components
│   │   │   │   ├── RecipeModal.js # Recipe details modal
│   │   │   │   └── RecipeResults.js # Search results display
│   │   │   └── sustainability/ # Environmental analysis
│   │   │       └── SustainabilityDashboard.js # Sustainability metrics
│   │   ├── hooks/          # Custom React hooks
│   │   │   ├── useRecipes.js # Recipe management
│   │   │   ├── useIngredients.js # Ingredient management
│   │   │   ├── useChatbot.js # Chatbot functionality
│   │   │   └── useSustainability.js # Sustainability analysis
│   │   ├── services/       # API service layer
│   │   │   └── api.js      # API client
│   │   └── utils/          # Utility functions
│   └── package.json
├── recipes_small.csv       # Recipe database (1,339 recipes)
├── .env.example           # Environment configuration template
├── .env                   # Local environment configuration (create from example)
├── start.sh               # Manual startup script (optional)
├── stop.sh                # Process cleanup script (optional)
├── STARTUP_GUIDE.md       # Detailed startup instructions
└── README.md
```

## API Features

- **Recipe Search** - Semantic search with ingredient matching
- **Sustainability Analysis** - Environmental impact scoring
- **Health Scoring** - Nutritional analysis and scoring
- **AI Chatbot** - Contextual cooking assistance

## Sustainability Analysis

The app analyzes ingredients for:
- **Carbon Footprint**: CO₂ emissions per ingredient (kg CO₂)
- **Water Usage**: Water consumption per ingredient (liters)
- **Sustainability Score**: Overall environmental impact (1-5 scale)
- **Ingredient Breakdown**: Individual ingredient impact analysis
- **Recommendations**: Tips for more sustainable cooking

## Health Scoring

- **FatSecret API Integration**: Real nutritional data from comprehensive food database
- **Health Score Calculation**: Multi-component scoring system
  - **Nutritional Density**: Protein and fiber content per calorie
  - **Macro Balance**: Protein (25%), carbs (45%), fat (30%) ratios
  - **Health Risk Assessment**: Sodium, sugar, and saturated fat penalties
- **Health Levels**: Excellent (90-100), Very Good (80-89), Good (70-79), Fair (60-69), Poor (50-59), Very Poor (<50)
- **Fallback Scoring**: Heuristic-based scoring when API is unavailable
- **Rate Limiting**: Smart API usage with fallback to estimated nutrition data

## Advanced Recipe Matching

- **Hybrid Ingredient Matching**: Combines exact, substring, fuzzy, and alias matching
- **Ingredient Classification**: Critical, Important, Optional, Rare ingredients
- **Pattern-Based Analysis**: Learns ingredient importance from similar recipes
- **Substitution Suggestions**: Smart ingredient replacement recommendations
- **Weighted Scoring**: Prioritizes critical ingredients in match calculations

## Smart Sorting

Sort recipes by:
- **Ingredient Match**: How well your ingredients match the recipe
- **Sustainability**: Environmental impact score
- **Health Score**: Nutritional health rating

Each sorting option supports both ascending and descending order.

## AI Features

- **Contextual Responses**: AI responses include relevant recipe suggestions
- **Recipe-Specific Guidance**: Select a recipe to get focused advice
- **Dynamic Quick Questions**: Questions adapt based on selected recipe
- **Ingredient Matching**: Smart matching of available ingredients
- **Cooking Advice**: Get tips and substitutions from the AI
- **CPU-Only Mode**: Stable operation with Ollama running in CPU-only mode

## Performance

- **Vector Search**: Sub-second recipe search with FAISS
- **Cached Embeddings**: Fast startup with persistent storage
- **Pattern Caching**: Pre-computed ingredient criticality patterns
- **Efficient API Usage**: Smart ingredient grouping for health scores
- **Responsive UI**: Smooth user experience
- **Memory Optimization**: CPU-only Ollama mode for stability
