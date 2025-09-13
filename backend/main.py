from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import uvicorn
import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from root .env file
load_dotenv(dotenv_path=Path(__file__).parent.parent / ".env")

# Add the current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from services.rag_service import RAGService
from services.ollama_service import OllamaService
from services.sustainability_service import SustainabilityService
from services.health_service import HealthService

def _sort_recipes(recipes: List[Dict[str, Any]], sort_by: str, sort_order: str) -> List[Dict[str, Any]]:
    """Sort recipes based on the specified criteria"""
    if not recipes:
        return recipes
    
    # Define sorting key functions
    def get_sort_key(recipe):
        if sort_by == "match":
            return recipe.get('match', {}).get('weighted_percentage', 0)
        elif sort_by == "sustainability":
            return recipe.get('sustainability', {}).get('score', 0)
        elif sort_by == "health":
            return recipe.get('health', {}).get('score', 0)
        else:  # default to match
            return recipe.get('match', {}).get('weighted_percentage', 0)
    
    # Sort recipes
    reverse = sort_order.lower() == "desc"
    sorted_recipes = sorted(recipes, key=get_sort_key, reverse=reverse)
    
    return sorted_recipes

app = FastAPI(
    title="InstaDish API",
    description="AI-powered recipe search and chatbot service",
    version="2.0.0"
)

# CORS middleware - configurable via environment variables
cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:3001").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global services
rag_service = None
ollama_service = None
sustainability_service = None
health_service = None

# Pydantic models
class RecipeSearchRequest(BaseModel):
    query: Optional[str] = None
    ingredients: Optional[List[str]] = None
    sort_by: Optional[str] = "match"  # match, sustainability, health
    sort_order: Optional[str] = "desc"  # asc, desc
    limit: int = 9

class ChatRequest(BaseModel):
    message: str
    user_ingredients: Optional[List[str]] = None
    selected_recipe: Optional[Dict[str, Any]] = None

class SustainabilityRequest(BaseModel):
    ingredients: List[str]

class RecipeResponse(BaseModel):
    id: int
    name: str
    ingredients: List[str]
    instructions: List[str]
    ingredient_tags: List[str]
    category: str
    prep_time: str
    cook_time: str
    difficulty: str
    match: Dict[str, Any]
    estimated_calories: Optional[int] = None

class ChatResponse(BaseModel):
    success: bool
    response: str
    recipes: List[RecipeResponse]
    metadata: Dict[str, Any]

class SustainabilityResponse(BaseModel):
    success: bool
    data: Dict[str, Any]

@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    global rag_service, ollama_service, sustainability_service, health_service
    
    print("🚀 Starting InstaDish Backend...")
    
    try:
        # Initialize RAG service
        print("Initializing RAG service...")
        rag_service = RAGService()
        await rag_service.initialize()
        print("RAG service initialized successfully")
        
        # Initialize Ollama service
        print("Initializing Ollama service...")
        ollama_url = os.getenv("OLLAMA_URL", "http://localhost:11434")
        ollama_service = OllamaService(base_url=ollama_url)
        print(f"Ollama service initialized successfully (URL: {ollama_url})")
        
        # Initialize Sustainability service
        print("Initializing Sustainability service...")
        sustainability_service = SustainabilityService()
        print("Sustainability service initialized successfully")
        
        # Initialize Health service
        print("Initializing Health service...")
        health_service = HealthService()
        print("Health service initialized successfully")
        
        print("InstaDish Backend ready!")
        
    except Exception as e:
        print(f"Failed to initialize backend: {e}")
        raise

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "InstaDish Backend",
        "version": "2.0.0",
        "rag_ready": rag_service is not None,
        "ollama_ready": ollama_service is not None,
        "sustainability_ready": sustainability_service is not None
    }

# Recipe endpoints
@app.get("/api/recipes")
async def get_all_recipes(category: Optional[str] = None, search: Optional[str] = None, limit: int = 10):
    """Get all recipes with optional filtering"""
    if not rag_service:
        raise HTTPException(status_code=503, detail="RAG service not available")
    
    try:
        recipes = await rag_service.get_all_recipes()
        
        # Filter by category if provided
        if category:
            recipes = [r for r in recipes if r['category'].lower() == category.lower()]
        
        # Search by title if provided
        if search:
            search_lower = search.lower()
            recipes = [r for r in recipes if search_lower in r['name'].lower()]
        
        # Limit results
        recipes = recipes[:limit]
        
        return {
            "success": True,
            "data": recipes,
            "count": len(recipes)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch recipes: {str(e)}")

@app.get("/api/recipes/categories")
async def get_categories():
    """Get all recipe categories"""
    if not rag_service:
        raise HTTPException(status_code=503, detail="RAG service not available")
    
    try:
        recipes = await rag_service.get_all_recipes()
        categories = list(set(recipe['category'] for recipe in recipes))
        categories.sort()
        
        return {
            "success": True,
            "data": categories,
            "count": len(categories)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch categories: {str(e)}")

@app.post("/api/recipes/search")
async def search_recipes(request: RecipeSearchRequest):
    """Search for recipes using RAG"""
    if not rag_service:
        raise HTTPException(status_code=503, detail="RAG service not available")
    
    try:
        # Use query if provided, otherwise use ingredients
        search_query = request.query or ' '.join(request.ingredients or [])
        
        if not search_query:
            raise HTTPException(status_code=400, detail="Query or ingredients required")
        
        recipes = await rag_service.search_recipes(
            query=search_query,
            limit=request.limit,
            user_ingredients=request.ingredients or []
        )
        
        # Sort results based on user preference
        sorted_recipes = _sort_recipes(recipes, request.sort_by, request.sort_order)
        
        return {
            "success": True,
            "data": sorted_recipes,
            "count": len(sorted_recipes),
            "searchCriteria": {
                "query": search_query,
                "ingredients": request.ingredients or [],
                "sortBy": request.sort_by,
                "sortOrder": request.sort_order,
                "totalMatches": len(sorted_recipes)
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")

@app.get("/api/recipes/{recipe_id}")
async def get_recipe(recipe_id: int):
    """Get a specific recipe by ID"""
    if not rag_service:
        raise HTTPException(status_code=503, detail="RAG service not available")
    
    try:
        recipe = await rag_service.get_recipe_by_id(recipe_id)
        if not recipe:
            raise HTTPException(status_code=404, detail="Recipe not found")
        
        # Add estimated calories
        recipe['estimated_calories'] = rag_service._estimate_calories(recipe)
        
        return {
            "success": True,
            "data": recipe
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get recipe: {str(e)}")

# Chatbot endpoints
@app.post("/api/chatbot")
async def chat_with_ai(request: ChatRequest):
    """Chat with AI using RAG context"""
    if not rag_service or not ollama_service:
        raise HTTPException(status_code=503, detail="AI services not available")
    
    try:
        # Get relevant recipes using RAG
        relevant_recipes = await rag_service.search_recipes(
            query=request.message,
            limit=3,
            user_ingredients=request.user_ingredients or []
        )
        
        # Generate AI response
        response = await ollama_service.generate_response(
            message=request.message,
            user_ingredients=request.user_ingredients or [],
            relevant_recipes=relevant_recipes,
            selected_recipe=request.selected_recipe
        )
        
        return {
            "success": True,
            "response": response,
            "recipes": relevant_recipes,
            "metadata": {
                "model": "llama2:7b",
                "user_ingredients": len(request.user_ingredients or []),
                "suggested_recipes": len(relevant_recipes)
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat failed: {str(e)}")

@app.get("/api/chatbot/status")
async def get_chatbot_status():
    """Check chatbot status"""
    try:
        ollama_available = await ollama_service.is_available() if ollama_service else False
        
        return {
            "success": True,
            "data": {
                "ollamaAvailable": ollama_available,
                "currentModel": "llama2:7b",
                "status": "operational" if ollama_available else "offline"
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to check status: {str(e)}")

@app.post("/api/chatbot/quick-questions")
async def get_quick_questions(request: ChatRequest):
    """Get contextual quick questions"""
    try:
        user_ingredients = request.user_ingredients or []
        
        quick_questions = [
            "What recipes can I make with my ingredients?",
            "How can I make my meal more sustainable?",
            "What substitutions can I make?",
            "What's missing from my ingredients?",
            "How do I store these ingredients properly?"
        ] if user_ingredients else [
            "How do I know when chicken is cooked?",
            "What can I substitute for eggs?",
            "How do I reduce food waste?",
            "What's the most sustainable protein?",
            "How do I meal prep efficiently?"
        ]
        
        return {
            "success": True,
            "data": quick_questions
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get questions: {str(e)}")

# Sustainability endpoints
@app.post("/api/sustainability/analyze")
async def analyze_sustainability(request: SustainabilityRequest):
    """Analyze sustainability of ingredients"""
    if not sustainability_service:
        raise HTTPException(status_code=503, detail="Sustainability service not available")
    
    try:
        analysis = await sustainability_service.analyze_ingredients(request.ingredients)
        return {
            "success": True,
            "data": analysis
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Sustainability analysis failed: {str(e)}")

@app.post("/api/admin/reload-ingredients")
async def reload_ingredient_data():
    """Reload ingredient data from JSON files (admin endpoint)"""
    if not rag_service:
        raise HTTPException(status_code=503, detail="RAG service not available")
    
    try:
        rag_service.reload_ingredient_data()
        return {
            "success": True,
            "message": "Ingredient data reloaded successfully",
            "data": {
                "aliases_count": len(rag_service.ingredient_aliases),
                "critical_categories_count": len(rag_service.critical_ingredients),
                "substitutions_count": len(rag_service.ingredient_substitutions)
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to reload ingredient data: {str(e)}")

if __name__ == "__main__":
    # Get configuration from environment variables
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "8000"))
    reload = os.getenv("RELOAD", "true").lower() == "true"
    log_level = os.getenv("LOG_LEVEL", "info")
    
    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=reload,
        log_level=log_level
    )
