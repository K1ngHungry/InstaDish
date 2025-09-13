import httpx
import json
from typing import List, Dict, Any, Optional

class OllamaService:
    def __init__(self, base_url: str = "http://localhost:11434"):
        self.base_url = base_url
        self.model = "llama2:7b"
        
    async def generate_response(self, message: str, user_ingredients: List[str], relevant_recipes: List[Dict[str, Any]], selected_recipe: Dict[str, Any] = None) -> str:
        """Generate AI response using Ollama with RAG context"""
        try:
            # Build system prompt with recipe context
            system_prompt = self._build_system_prompt(user_ingredients, relevant_recipes, selected_recipe)
            
            # Prepare the full prompt
            full_prompt = f"{system_prompt}\n\nUser: {message}\n\nAssistant:"
            
            # Call Ollama API
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    f"{self.base_url}/api/generate",
                    json={
                        "model": self.model,
                        "prompt": full_prompt,
                        "stream": False,
                        "options": {
                            "temperature": 0.7,
                            "top_p": 0.9,
                            "max_tokens": 500
                        }
                    }
                )
                
                if response.status_code == 200:
                    result = response.json()
                    return result.get("response", "I'm sorry, I couldn't generate a response.")
                else:
                    return f"I'm having trouble connecting to the AI service (Status: {response.status_code}). Please try again later."
                    
        except httpx.TimeoutException:
            return "I'm taking a bit longer to respond. Please try again with a shorter message."
        except httpx.ConnectError:
            return "I'm having trouble connecting to the AI service. Please make sure Ollama is running."
        except Exception as e:
            return f"I'm sorry, I encountered an error: {str(e)}"
    
    def _build_system_prompt(self, user_ingredients: List[str], relevant_recipes: List[Dict[str, Any]], selected_recipe: Dict[str, Any] = None) -> str:
        """Build system prompt with recipe context"""
        prompt = """You are InstaDish, a friendly cooking assistant. Help users with recipes and cooking advice. Don't be too chatty, just give the best recipe and advice.

Current context:"""
        
        if user_ingredients:
            prompt += f"\nUser's ingredients: {', '.join(user_ingredients)}"
        
        if selected_recipe:
            prompt += f"\n\n🎯 SELECTED RECIPE: {selected_recipe['name']}"
            prompt += f"\nCategory: {selected_recipe['category']}"
            prompt += f"\nPrep time: {selected_recipe['prep_time']}"
            prompt += f"\nCook time: {selected_recipe['cook_time']}"
            prompt += f"\nDifficulty: {selected_recipe['difficulty']}"
            if selected_recipe.get('ingredients'):
                prompt += f"\nIngredients: {', '.join(selected_recipe['ingredients'][:5])}"
            if selected_recipe.get('sustainability'):
                sustain = selected_recipe['sustainability']
                prompt += f"\nSustainability: {sustain['level'].upper()} (Score: {sustain['score']}/3)"
            prompt += "\n\nFocus your advice on this selected recipe! Provide cooking tips, substitutions, and detailed guidance. Also, consider similar recipes in case the user asks."
        
        if relevant_recipes and not selected_recipe:
            prompt += "\nRelevant recipes:"
            for i, recipe in enumerate(relevant_recipes[:2], 1):
                prompt += f"\n{i}. {recipe['name']} - {recipe['category']}"
                if recipe.get('match'):
                    match = recipe['match']
                    prompt += f" ({match['percentage']}% match)"
        
        prompt += "\n\nBe helpful and suggest recipes from the context! 🍳"
        
        return prompt
    
    async def is_available(self) -> bool:
        """Check if Ollama service is available"""
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.get(f"{self.base_url}/api/tags")
                return response.status_code == 200
        except:
            return False
