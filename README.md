# 🍳 InstaDish - AI-Powered Recipe Discovery

A modern, AI-powered recipe discovery platform built with FastAPI and React, featuring semantic search, sustainability analysis, health scoring, and intelligent chatbot assistance.

## ✨ Features

- **🔍 Semantic Recipe Search**: Find recipes using natural language queries powered by FAISS vector search
- **🤖 AI Chatbot**: Get cooking advice and recipe suggestions from an AI assistant with recipe-specific guidance
- **🌱 Sustainability Analysis**: Analyze the environmental impact of your ingredients with detailed carbon footprint and water usage
- **🏥 Health Scoring**: Get nutritional health scores for recipes using FatSecret API integration
- **📊 Advanced Recipe Matching**: See how well your ingredients match recipe requirements with critical/important/replaceable ingredient classification
- **🎯 Smart Sorting**: Sort recipes by ingredient match, sustainability, or health scores
- **📌 Recipe Selection**: Select a recipe to get focused AI advice and relevant quick questions
- **💾 Persistent Embeddings**: Fast startup with cached vector embeddings
- **📱 Responsive Design**: Beautiful, mobile-friendly interface

## 🏗️ Architecture

- **Backend**: FastAPI with Python 3.9+
- **Frontend**: React with TypeScript
- **AI/ML**: FAISS, sentence-transformers, Ollama
- **Health API**: FatSecret API integration for nutritional data
- **Data**: 1,339 real recipes from CSV database
- **Environment**: Conda for Python dependency management

## 🚀 Quick Start

### Prerequisites

- Python 3.9+
- Node.js 16+
- Conda/Miniconda
- Ollama (for AI chatbot)

### Environment Setup

1. **Copy environment files:**
   ```bash
   cp backend/env.example backend/.env
   cp frontend/env.example frontend/.env
   ```

2. **Configure your environment variables:**
   - Edit `backend/.env` with your FatSecret API credentials
   - Edit `frontend/.env` with your backend URL

### What's Included vs. What You Need to Install

**✅ Included in Repository:**
- Source code for both frontend and backend
- Recipe database (`recipes_small.csv`)
- Pre-generated embeddings and data files
- Configuration files and scripts

**📦 You Need to Install:**
- Node.js dependencies (`npm install` in frontend/)
- Python dependencies (`pip install -r requirements.txt` in backend/)
- Ollama and the AI model
- Conda environment setup

**🚫 Not Included (Correctly):**
- `node_modules/` (installed via `npm install`)
- `build/` directories (generated during build)
- `.env` files (you create these)

### 1. One-Command Setup

```bash
# Clone the repository
git clone <repository-url>
cd InstaDish

# Start everything with one command
./start_app.sh
```

This will:
- Activate the conda environment
- Install Python dependencies (if needed)
- Start Ollama (if not running)
- Start the FastAPI backend
- Install Node.js dependencies (if needed)
- Start the React frontend

### 2. Manual Setup (Alternative)

#### Backend Setup
```bash
# Activate conda environment
conda activate instadish

# Install Python dependencies
cd backend
pip install -r requirements.txt

# Start the backend
python main.py
```

## 🚀 Production Deployment

### Production Startup
```bash
# Use production startup script
./start_production.sh

# Or manually:
export HOST=0.0.0.0
export PORT=8000
export RELOAD=false
export CORS_ORIGINS=https://yourdomain.com
cd backend && python main.py
```

## 🌐 Environment Variables

### Backend Configuration (`backend/.env`)
```bash
# Server settings
HOST=0.0.0.0
PORT=8000
RELOAD=false
LOG_LEVEL=info

# CORS (comma-separated origins)
CORS_ORIGINS=http://localhost:3000,https://yourdomain.com

# Ollama configuration
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama2:7b

# FatSecret API
FATSECRET_CLIENT_ID=your_client_id
FATSECRET_CLIENT_SECRET=your_client_secret
```

### Frontend Configuration (`frontend/.env`)
```bash
# Backend API URL
REACT_APP_API_URL=http://localhost:8000/api
# For production: https://your-backend-domain.com/api
```

#### Frontend Setup
```bash
# Install Node.js dependencies
cd frontend
npm install

# Start the frontend
npm start
```

#### AI Chatbot Setup
```bash
# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Pull the model
ollama pull llama2:7b

# Start Ollama service
ollama serve
```

## 📁 Project Structure

```
InstaDish/
├── backend/                 # FastAPI backend
│   ├── main.py             # Main application
│   ├── services/           # Business logic
│   │   ├── rag_service.py  # FAISS + embeddings + pattern analysis
│   │   ├── ollama_service.py # AI chatbot
│   │   ├── sustainability_service.py # Environmental analysis
│   │   └── health_service.py # FatSecret API integration
│   ├── data/               # Persistent data
│   │   ├── faiss_index.faiss # Vector embeddings
│   │   ├── recipe_metadata.json # Recipe information
│   │   ├── ingredient_aliases.json # Ingredient matching
│   │   ├── critical_ingredients.json # Ingredient importance
│   │   └── ingredient_substitutions.json # Substitution suggestions
│   ├── .env                # Environment variables
│   ├── requirements.txt    # Python dependencies
│   └── FATSECRET_SETUP.md  # Health API setup guide
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # UI components
│   │   │   ├── common/     # Shared components
│   │   │   │   └── RecipeSorting.tsx # Sorting controls
│   │   │   ├── Chatbot.tsx # AI chat interface
│   │   │   ├── RecipeModal.tsx # Recipe details
│   │   │   ├── RecipeResults.tsx # Search results
│   │   │   └── SustainabilityDashboard.tsx # Environmental analysis
│   │   ├── hooks/         # Custom React hooks
│   │   │   ├── useRecipes.ts # Recipe management
│   │   │   └── useIngredients.ts # Ingredient management
│   │   └── services/      # API service layer
│   │       └── api.js     # API client
│   └── package.json
├── recipes_small.csv       # Recipe database
├── start_app.sh           # Application startup script
├── stop_app.sh            # Application shutdown script
└── README.md
```

## 🔧 API Endpoints

### Recipes
- `GET /api/recipes` - Get all recipes
- `GET /api/recipes/{id}` - Get specific recipe
- `POST /api/recipes/search` - Search recipes with sorting options
- `GET /api/recipes/categories` - Get categories

### Chatbot
- `POST /api/chatbot` - Chat with AI (supports recipe context)
- `GET /api/chatbot/status` - Check chatbot status
- `POST /api/chatbot/quick-questions` - Get recipe-specific questions

### Sustainability
- `POST /api/sustainability/analyze` - Analyze ingredient sustainability

### Health
- `GET /health` - Health check

### Admin
- `POST /api/admin/reload-ingredients` - Reload ingredient data

## 🌱 Sustainability Analysis

The app analyzes ingredients for:
- **Carbon Footprint**: CO₂ emissions per ingredient (kg CO₂)
- **Water Usage**: Water consumption per ingredient (liters)
- **Sustainability Score**: Overall environmental impact (1-5 scale)
- **Ingredient Breakdown**: Individual ingredient impact analysis
- **Recommendations**: Tips for more sustainable cooking

## 🏥 Health Scoring

- **FatSecret API Integration**: Real nutritional data from comprehensive food database
- **Health Score Calculation**: Multi-component scoring system
  - **Nutritional Density**: Protein and fiber content per calorie
  - **Macro Balance**: Protein (25%), carbs (45%), fat (30%) ratios
  - **Health Risk Assessment**: Sodium, sugar, and saturated fat penalties
- **Health Levels**: Excellent (90-100), Very Good (80-89), Good (70-79), Fair (60-69), Poor (50-59), Very Poor (<50)
- **Fallback Scoring**: Heuristic-based scoring when API is unavailable

## 🎯 Advanced Recipe Matching

- **Hybrid Ingredient Matching**: Combines exact, substring, fuzzy, and alias matching
- **Ingredient Classification**: Critical, Important, Optional, Rare ingredients
- **Pattern-Based Analysis**: Learns ingredient importance from similar recipes
- **Substitution Suggestions**: Smart ingredient replacement recommendations
- **Weighted Scoring**: Prioritizes critical ingredients in match calculations

## 🔄 Smart Sorting

Sort recipes by:
- **🥘 Ingredient Match**: How well your ingredients match the recipe
- **🌱 Sustainability**: Environmental impact score
- **🏥 Health Score**: Nutritional health rating

Each sorting option supports both ascending and descending order.

## 🤖 AI Features

- **Contextual Responses**: AI responses include relevant recipe suggestions
- **Recipe-Specific Guidance**: Select a recipe to get focused advice
- **Dynamic Quick Questions**: Questions adapt based on selected recipe
- **Ingredient Matching**: Smart matching of available ingredients
- **Cooking Advice**: Get tips and substitutions from the AI

## 🛠️ Development

### Backend Development
```bash
cd backend
python -m uvicorn main:app --reload
```

### Frontend Development
```bash
cd frontend
npm start
```

### Adding New Recipes
1. Add recipes to `recipes_small.csv`
2. Restart the backend to regenerate embeddings
3. New recipes will be automatically indexed

### Updating Ingredient Data
1. Edit JSON files in `backend/data/`
2. Call `/api/admin/reload-ingredients` endpoint
3. Changes take effect immediately

## 📊 Performance

- **Vector Search**: Sub-second recipe search with FAISS
- **Cached Embeddings**: Fast startup with persistent storage
- **Pattern Caching**: Pre-computed ingredient criticality patterns
- **Efficient API Usage**: Smart ingredient grouping for health scores
- **Responsive UI**: Smooth user experience

## 🔒 Environment Variables

Create a `.env` file in the backend directory:

```env
# FatSecret API (Optional - for health scores)
FATSECRET_CLIENT_ID=your_client_id_here
FATSECRET_CLIENT_SECRET=your_client_secret_here

# Ollama Configuration (Optional)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama2:7b
```

## 🏥 Health API Setup

For enhanced health scoring with real nutritional data:

1. **Get FatSecret API credentials** from [platform.fatsecret.com](https://platform.fatsecret.com/api/)
2. **Add credentials** to `backend/.env` file
3. **Whitelist your IP** in FatSecret app settings
4. **Restart the backend** to enable API integration

See `backend/FATSECRET_SETUP.md` for detailed setup instructions.

## 🐛 Troubleshooting

### Backend Issues
- Ensure conda environment is activated
- Check that all dependencies are installed
- Verify CSV file exists in project root
- Check FatSecret API credentials if using health scoring

### Frontend Issues
- Clear browser cache
- Check that backend is running on port 8000
- Verify CORS settings

### AI Chatbot Issues
- Ensure Ollama is running
- Check that llama2:7b model is installed
- Verify Ollama service is accessible

### Health Scoring Issues
- Check FatSecret API credentials
- Verify IP address is whitelisted
- System will fallback to heuristic scoring if API fails

## 📝 License

MIT License - feel free to use this project for learning and development!

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 🙏 Acknowledgments

- Recipe data from various sources
- FAISS for vector search
- Ollama for AI capabilities
- FatSecret for nutritional data
- FastAPI and React communities