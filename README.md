# 🍳 InstaDish - AI-Powered Recipe Discovery

A modern, AI-powered recipe discovery platform built with FastAPI and React, featuring semantic search, sustainability analysis, and intelligent chatbot assistance.

## ✨ Features

- **🔍 Semantic Recipe Search**: Find recipes using natural language queries powered by FAISS vector search
- **🤖 AI Chatbot**: Get cooking advice and recipe suggestions from an AI assistant
- **🌱 Sustainability Analysis**: Analyze the environmental impact of your ingredients
- **📊 Recipe Matching**: See how well your ingredients match recipe requirements
- **💾 Persistent Embeddings**: Fast startup with cached vector embeddings
- **📱 Responsive Design**: Beautiful, mobile-friendly interface

## 🏗️ Architecture

- **Backend**: FastAPI with Python 3.9+
- **Frontend**: React with TypeScript
- **AI/ML**: FAISS, sentence-transformers, Ollama
- **Data**: 1,339 real recipes from CSV database
- **Environment**: Conda for Python dependency management

## 🚀 Quick Start

### Prerequisites

- Python 3.9+
- Node.js 16+
- Conda/Miniconda
- Ollama (for AI chatbot)

### 1. Setup Backend

```bash
# Activate conda environment
conda activate instadish

# Install Python dependencies
cd backend
pip install -r requirements.txt

# Start the backend
cd ..
./start_backend.sh
```

The backend will be available at `http://localhost:8000`

### 2. Setup Frontend

```bash
# Install Node.js dependencies
cd frontend
npm install

# Start the frontend
npm start
```

The frontend will be available at `http://localhost:3000`

### 3. Setup AI Chatbot (Optional)

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
│   │   ├── rag_service.py  # FAISS + embeddings
│   │   ├── ollama_service.py # AI chatbot
│   │   └── sustainability_service.py
│   ├── data/               # Persistent embeddings
│   └── requirements.txt
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── hooks/         # Custom React hooks
│   │   └── services/      # API service layer
│   └── package.json
├── recipes_small.csv       # Recipe database
├── start_backend.sh        # Backend startup script
└── README.md
```

## 🔧 API Endpoints

### Recipes
- `GET /api/recipes` - Get all recipes
- `GET /api/recipes/{id}` - Get specific recipe
- `POST /api/recipes/search` - Search recipes
- `GET /api/recipes/categories` - Get categories

### Chatbot
- `POST /api/chatbot` - Chat with AI
- `GET /api/chatbot/status` - Check chatbot status
- `POST /api/chatbot/quick-questions` - Get quick questions

### Sustainability
- `POST /api/sustainability/analyze` - Analyze ingredients

### Health
- `GET /health` - Health check

## 🌱 Sustainability Analysis

The app analyzes ingredients for:
- **Carbon Footprint**: CO₂ emissions per ingredient
- **Water Usage**: Water consumption per ingredient
- **Sustainability Score**: Overall environmental impact
- **Recommendations**: Tips for more sustainable cooking

## 🤖 AI Features

- **Semantic Search**: Find recipes using natural language
- **Contextual Responses**: AI responses include relevant recipe suggestions
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

## 📊 Performance

- **Vector Search**: Sub-second recipe search with FAISS
- **Cached Embeddings**: Fast startup with persistent storage
- **Batch Processing**: Efficient embedding generation
- **Responsive UI**: Smooth user experience

## 🔒 Environment Variables

Create a `.env` file in the backend directory:

```env
# Optional: Custom Ollama URL
OLLAMA_BASE_URL=http://localhost:11434

# Optional: Custom model
OLLAMA_MODEL=llama2:7b
```

## 🐛 Troubleshooting

### Backend Issues
- Ensure conda environment is activated
- Check that all dependencies are installed
- Verify CSV file exists in project root

### Frontend Issues
- Clear browser cache
- Check that backend is running on port 8000
- Verify CORS settings

### AI Chatbot Issues
- Ensure Ollama is running
- Check that llama2:7b model is installed
- Verify Ollama service is accessible

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
- FastAPI and React communities