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
- **💾 Persistent Embeddings**: Fast startup with cached vector embeddings (1,339 recipes)
- **📱 Responsive Design**: Beautiful, mobile-friendly interface
- **🔧 Configurable**: Environment-variable-driven deployment and configuration

## 🏗️ Architecture

- **Backend**: FastAPI with Python 3.9+ (async/await patterns)
- **Frontend**: React 19 with TypeScript, modern hooks-based architecture
- **AI/ML**: FAISS vector database, sentence-transformers, RAG architecture
- **LLM**: Ollama integration with LLaMA 2:7b for contextual cooking assistant
- **APIs**: FatSecret API (OAuth 2.0) for nutritional health scoring
- **Data**: 1,339 real recipes from CSV database with pre-computed embeddings
- **Environment**: Conda for Python dependency management
- **Deployment**: Environment-variable-driven configuration for cloud deployment

## 🔧 Tech Stack

**(FastAPI | React/TypeScript | FAISS | Ollama | FatSecret API)**

## 🚀 Quick Start

### Prerequisites

- Python 3.9+
- Node.js 16+
- Conda/Miniconda
- Ollama (for AI chatbot)

### Manual Setup

```bash
# Clone the repository
git clone <repository-url>
cd InstaDish

# 1. Set up environment variables
cp .env.example .env
# Edit .env file with your configuration

# 2. Activate conda environment
conda activate instadish

# 3. Start Ollama (in another terminal)
ollama serve

# 4. Start backend (in another terminal)
cd backend
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# 5. Start frontend (in another terminal)
cd frontend
npm start
```

The application will be available at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

### Environment Setup

1. **Create environment files:**
   ```bash
   # Backend environment
   cp backend/env.example backend/.env
   
   # Frontend environment  
   cp frontend/env.example frontend/.env
   ```

2. **Configure your environment variables:**
   - Edit `backend/.env` with your FatSecret API credentials (optional)
   - Edit `frontend/.env` with your backend URL

### What's Included vs. What You Need to Install

** Included in Repository:**
- Source code for both frontend and backend
- Recipe database (`recipes_small.csv`)
- Pre-generated embeddings and FAISS index
- Configuration files and startup scripts
- Cleanup and process management scripts

** You Need to Install:**
- Node.js dependencies (`npm install` in frontend/)
- Python dependencies (via conda environment)
- Ollama and the AI model
- Conda environment setup

** Not Included (Correctly):**
- `node_modules/` (installed via `npm install`)
- `build/` directories (generated during build)
- `.env` files (you create these)
- Cached data files (generated on first run)

## 🛠️ Manual Setup (Alternative)

### Backend Setup
```bash
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

## 🚀 Production Deployment

### Production Startup
```bash
# Set production environment variables
export HOST=0.0.0.0
export PORT=8000
export RELOAD=false
export CORS_ORIGINS=https://yourdomain.com

# Start the application manually
# See Manual Setup section above
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

# FatSecret API (Optional - for health scores)
FATSECRET_CLIENT_ID=your_client_id
FATSECRET_CLIENT_SECRET=your_client_secret
```

### Frontend Configuration (`frontend/.env`)
```bash
# Backend API URL
REACT_APP_API_URL=http://localhost:8000/api
# For production: https://your-backend-domain.com/api
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

## 🔧 API Endpoints

### Recipes
- `GET /api/recipes` - Get all recipes
- `GET /api/recipes/{id}` - Get specific recipe with full details
- `POST /api/recipes/search` - Search recipes with sorting options
- `GET /api/recipes/categories` - Get available recipe categories

### Chatbot
- `POST /api/chatbot` - Chat with AI (supports recipe context)
- `GET /api/chatbot/status` - Check chatbot status
- `POST /api/chatbot/quick-questions` - Get recipe-specific questions

### Sustainability
- `POST /api/sustainability/analyze` - Analyze ingredient sustainability

### Health
- `GET /health` - Health check endpoint

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
- **Rate Limiting**: Smart API usage with fallback to estimated nutrition data

## 🎯 Advanced Recipe Matching

- **Hybrid Ingredient Matching**: Combines exact, substring, fuzzy, and alias matching
- **Ingredient Classification**: Critical, Important, Optional, Rare ingredients
- **Pattern-Based Analysis**: Learns ingredient importance from similar recipes
- **Substitution Suggestions**: Smart ingredient replacement recommendations
- **Weighted Scoring**: Prioritizes critical ingredients in match calculations

## 🔄 Smart Sorting

Sort recipes by:
- **Ingredient Match**: How well your ingredients match the recipe
- **Sustainability**: Environmental impact score
- **Health Score**: Nutritional health rating

Each sorting option supports both ascending and descending order.

## 🤖 AI Features

- **Contextual Responses**: AI responses include relevant recipe suggestions
- **Recipe-Specific Guidance**: Select a recipe to get focused advice
- **Dynamic Quick Questions**: Questions adapt based on selected recipe
- **Ingredient Matching**: Smart matching of available ingredients
- **Cooking Advice**: Get tips and substitutions from the AI
- **CPU-Only Mode**: Stable operation with Ollama running in CPU-only mode

## 🛠️ Development

### Backend Development
```bash
cd backend
conda activate instadish
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
- **Memory Optimization**: CPU-only Ollama mode for stability

## 🏥 Health API Setup

For enhanced health scoring with real nutritional data:

1. **Get FatSecret API credentials** from [platform.fatsecret.com](https://platform.fatsecret.com/api/)
2. **Add credentials** to `backend/.env` file
3. **Whitelist your IP** in FatSecret app settings
4. **Restart the backend** to enable API integration

See `backend/FATSECRET_SETUP.md` for detailed setup instructions.

## 🐛 Troubleshooting

### Startup Issues
- **Port conflicts**: Run `./cleanup.sh` to stop existing processes
- **Conda issues**: Ensure conda is properly initialized with `conda init`
- **Memory issues**: The startup script includes memory optimization settings

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
- Ensure Ollama is running (CPU-only mode for stability)
- Check that llama2:7b model is installed
- Verify Ollama service is accessible
- If getting 500 errors, restart Ollama: `pkill -f ollama && OLLAMA_GPU_LAYERS=0 ollama serve`

### Health Scoring Issues
- Check FatSecret API credentials
- Verify IP address is whitelisted
- System will fallback to heuristic scoring if API fails
- Rate limiting is normal on free tier

## 🚀 Process Management

### Starting the Application
```bash
# Follow the Manual Setup steps above
# Each service runs in its own terminal
```

### Stopping the Application
- Press `Ctrl+C` in each terminal where services are running
- Or use `lsof -ti :PORT | xargs kill -9` to force kill processes on specific ports

### Force Kill All Services
```bash
# Kill all processes on InstaDish ports
for port in 8000 3000 11434; do lsof -ti :$port | xargs kill -9 2>/dev/null || true; done

# Or kill specific services
lsof -ti :8000 | xargs kill -9  # Backend
lsof -ti :3000 | xargs kill -9  # Frontend  
lsof -ti :11434 | xargs kill -9 # Ollama
```

### Manual Process Management
```bash
# Check running processes
ps aux | grep -E "(uvicorn|node|ollama)"

# Stop specific services
pkill -f "uvicorn main:app"
pkill -f "react-scripts start"
pkill -f "ollama serve"

# Use optional scripts (if available)
./start.sh  # Start all services
./stop.sh   # Stop all services
```

## 🚀 Deployment

### Render (Backend) + Vercel (Frontend)
```bash
# Backend deployment to Render:
# 1. Connect GitHub repo to Render
# 2. Set environment variables in Render dashboard
# 3. Build command: cd backend && pip install -r requirements.txt
# 4. Start command: cd backend && python -m uvicorn main:app --host 0.0.0.0 --port $PORT

# Frontend deployment to Vercel:
# 1. Connect GitHub repo to Vercel
# 2. Set REACT_APP_API_URL environment variable
# 3. Build command: cd frontend && npm run build
# 4. Output directory: frontend/build
```

### Environment Variables for Production
```bash
# Backend (Render)
HOST=0.0.0.0
PORT=10000
RELOAD=false
CORS_ORIGINS=https://your-frontend.vercel.app
FATSECRET_CLIENT_ID=your_client_id
FATSECRET_CLIENT_SECRET=your_client_secret

# Frontend (Vercel)
REACT_APP_API_URL=https://your-backend.onrender.com/api
```

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