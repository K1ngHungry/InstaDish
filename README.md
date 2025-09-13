# InstaDish v2.0 🍽️

**AI-powered recipe discovery with ingredient-based matching and sustainability insights**

InstaDish is a modern web application that helps you find delicious recipes based on the ingredients you already have, powered by AI and enhanced with sustainability insights.

## ✨ Features

### 🤖 **AI-Powered Cooking Assistant**
- **Ollama Integration**: Uses `llama2:7b` model for intelligent cooking advice
- **Context-Aware Responses**: Knows your selected ingredients and provides personalized suggestions
- **Recipe Recommendations**: Suggests recipes based on your available ingredients
- **Cooking Tips**: Provides expert cooking techniques and ingredient substitutions

### 🍳 **Smart Recipe Matching**
- **12 Curated Recipes**: From Italian classics to healthy veggie bowls
- **Ingredient-Based Search**: Finds recipes that match your available ingredients
- **Match Percentage**: Shows how well your ingredients match each recipe
- **Missing Ingredients**: Tells you exactly what you need to buy

### 🌱 **Sustainability Dashboard**
- **Environmental Scoring**: Rates your ingredient choices for sustainability
- **Carbon Footprint**: Calculates CO₂ impact of your ingredients
- **Health Analysis**: Provides nutritional insights and health scores
- **Eco-Friendly Tips**: Suggests ways to make your meals more sustainable

### 🎨 **Modern User Experience**
- **Beautiful UI**: Clean, modern design with smooth animations
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile
- **Real-Time Updates**: Instant feedback as you add ingredients
- **Interactive Chatbot**: Floating chat assistant always available

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- Ollama with `llama2:7b` model installed

### Installation

1. **Clone and install dependencies:**
```bash
git clone <repository-url>
cd InstaDish
npm run install:all
```

2. **Start Ollama with llama2:7b:**
```bash
ollama serve
# In another terminal:
ollama pull llama2:7b
```

3. **Start the application:**
```bash
# Development mode (both backend and frontend)
npm run dev:full

# Or start individually:
npm run dev        # Backend only
npm run client     # Frontend only
```

4. **Open your browser:**
- Frontend: http://localhost:3001
- Backend API: http://localhost:3000

## 🏗️ Architecture

### Backend (Node.js + Express)
```
backend/
├── config/           # Configuration and constants
├── controllers/      # Request handlers
├── services/         # Business logic
├── models/           # Data models
├── routes/           # API routes
└── server.js         # Main server file
```

### Frontend (React)
```
frontend/src/
├── components/       # React components
│   ├── common/       # Shared components
│   ├── recipe/       # Recipe-related components
│   ├── chatbot/      # Chat functionality
│   └── sustainability/ # Sustainability features
├── hooks/            # Custom React hooks
├── services/         # API communication
└── utils/            # Helper functions
```

## 📡 API Endpoints

### Recipes
- `GET /api/recipes` - Get all recipes (with optional filtering)
- `GET /api/recipes/:id` - Get specific recipe
- `POST /api/recipes/search` - Search recipes by ingredients
- `GET /api/recipes/categories` - Get recipe categories

### Chatbot
- `POST /api/chatbot` - Send message to AI assistant
- `GET /api/chatbot/status` - Check chatbot status
- `POST /api/chatbot/quick-questions` - Get contextual questions

### Sustainability
- `POST /api/sustainability/analyze` - Analyze recipe sustainability
- `POST /api/sustainability/food-waste-tips` - Get food waste tips
- `GET /api/sustainability/scores` - Get scoring system info
- `POST /api/sustainability/compare` - Compare ingredient sets

## 🎯 How to Use

1. **Add Ingredients**: Type ingredients you have available
2. **Find Recipes**: Click "Find Recipes" to see matching options
3. **View Details**: Click any recipe to see full instructions
4. **Get AI Help**: Use the floating chatbot for cooking advice
5. **Check Sustainability**: See environmental impact of your choices

## 🧪 Recipe Database

InstaDish includes 12 carefully curated recipes across multiple cuisines:

### Italian
- Classic Spaghetti Carbonara
- Creamy Mushroom Risotto
- One-Pot Pasta Primavera

### Asian
- Simple Chicken Stir Fry
- Vegetable Pad Thai

### Mediterranean
- Mediterranean Quinoa Bowl
- Greek Lemon Chicken

### American
- Classic Beef Burger
- BBQ Pulled Pork

### Healthy
- Veggie Power Bowl
- Creamy Tomato Basil Soup

### Quick & Easy
- Quick Veggie Omelet

## 🌱 Sustainability Features

### Scoring System
- **Sustainability Score**: Based on carbon footprint and environmental impact
- **Health Score**: Evaluates nutritional value and health benefits
- **Grades**: A+ to F rating system with color coding

### Carbon Footprint Data
- Beef/Lamb: 27-21 kg CO₂/kg (highest impact)
- Cheese: 21 kg CO₂/kg
- Chicken: 7 kg CO₂/kg
- Vegetables/Fruits: 1-2 kg CO₂/kg (lowest impact)

### Smart Tips
- Ingredient-specific sustainability advice
- Food waste reduction strategies
- Plant-based alternatives
- Seasonal eating recommendations

## 🛠️ Development

### Available Scripts
```bash
npm start          # Start production server
npm run dev        # Start development server with nodemon
npm run client     # Start React development server
npm run dev:full   # Start both backend and frontend
npm run build      # Build React app for production
npm run install:all # Install all dependencies
```

### Environment Variables
```bash
PORT=3000                    # Server port
NODE_ENV=development         # Environment
OLLAMA_URL=http://localhost:11434  # Ollama API URL
OLLAMA_MODEL=llama2:7b      # AI model to use
OLLAMA_TEMPERATURE=0.7      # AI response creativity
OLLAMA_MAX_TOKENS=600       # Max response length
```

## 🤖 AI Integration

### Ollama Configuration
- **Model**: `llama2:7b` (optimized for cooking advice)
- **Temperature**: 0.7 (balanced creativity and accuracy)
- **Context**: Includes user ingredients and recipe database
- **Fallback**: Graceful degradation when Ollama is unavailable

### Smart Features
- **Ingredient Recognition**: Automatically suggests recipes based on ingredients
- **Contextual Responses**: AI knows what ingredients you have selected
- **Cooking Expertise**: Provides professional cooking tips and techniques
- **Sustainability Education**: Explains environmental impact of food choices

## 📱 Responsive Design

- **Desktop**: Full-featured experience with sidebar and detailed views
- **Tablet**: Optimized layout with touch-friendly interactions
- **Mobile**: Compact design with collapsible sections and swipe gestures

## 🔧 Customization

### Adding New Recipes
Edit `backend/models/Recipe.js` to add new recipes to the database.

### Modifying Sustainability Scores
Update `backend/config/index.js` to adjust scoring algorithms.

### Styling Changes
Modify `frontend/src/App.css` for visual customizations.

## 🚀 Deployment

### Production Build
```bash
npm run build
npm start
```

### Environment Setup
- Set `NODE_ENV=production`
- Configure Ollama service URL
- Set up reverse proxy (nginx recommended)
- Enable HTTPS for security

## 📄 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 🆘 Support

If you encounter any issues:

1. Check that Ollama is running with `llama2:7b`
2. Verify all dependencies are installed
3. Check the console for error messages
4. Ensure ports 3000 and 3001 are available

---

**Made with ❤️ for cooking enthusiasts and sustainability advocates**