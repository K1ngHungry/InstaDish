import httpx
import json
from typing import List, Dict, Any, Optional

class OllamaService:
    def __init__(self, base_url: str = "http://localhost:11434"):
        self.base_url = base_url
        self.model = "llama2:7b"
        
    async def generate_response(self, message: str, user_ingredients: List[str], relevant_recipes: List[Dict[str, Any]]) -> str:
        """Generate AI response using Ollama with RAG context"""
        try:
            # Build system prompt with recipe context
            system_prompt = self._build_system_prompt(user_ingredients, relevant_recipes)
            
            # Prepare the full prompt
            full_prompt = f"{system_prompt}\n\nUser: {message}\n\nAssistant:"
            
            # Call Ollama API
            async with httpx.AsyncClient(timeout=30.0) as client:
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
                    return f"I'm having trouble connecting to the AI service. Please try again later."
                    
        except Exception as e:
            return f"I'm sorry, I encountered an error: {str(e)}"
    
    def _build_system_prompt(self, user_ingredients: List[str], relevant_recipes: List[Dict[str, Any]]) -> str:
        """Build system prompt with recipe context"""
        prompt = """You are InstaDish, a friendly and helpful cooking assistant. You help users find recipes and cooking advice based on their available ingredients.

Your personality:
- Enthusiastic and encouraging about cooking
- Use emojis to make responses fun and engaging
- Give practical, actionable advice
- Be supportive of all skill levels

Current context:"""
        
        if user_ingredients:
            prompt += f"\n\nUser's available ingredients: {', '.join(user_ingredients)}"
        
        if relevant_recipes:
            prompt += "\n\nHere are some relevant recipes from the database:"
            for i, recipe in enumerate(relevant_recipes[:3], 1):
                prompt += f"\n\n{i}. {recipe['name']}"
                prompt += f"\n   Ingredients: {', '.join(recipe['ingredients'][:5])}"
                if len(recipe['ingredients']) > 5:
                    prompt += f" (and {len(recipe['ingredients']) - 5} more)"
                prompt += f"\n   Category: {recipe['category']}"
                prompt += f"\n   Difficulty: {recipe['difficulty']}"
                
                # Add match information
                if recipe.get('match'):
                    match = recipe['match']
                    if match['percentage'] > 0:
                        prompt += f"\n   Ingredient match: {match['percentage']}% ({match['matches']}/{match['total']} ingredients)"
                        if match['missing']:
                            prompt += f"\n   Missing: {', '.join(match['missing'][:3])}"
        
        prompt += """

Guidelines:
- Suggest specific recipes from the context when relevant
- Explain why certain recipes work well with their ingredients
- Offer cooking tips and variations
- If they don't have all ingredients, suggest substitutions
- Keep responses conversational and helpful
- Use emojis to make it fun! 🍳✨"""
        
        return prompt
    
    async def is_available(self) -> bool:
        """Check if Ollama service is available"""
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.get(f"{self.base_url}/api/tags")
                return response.status_code == 200
        except:
            return False
