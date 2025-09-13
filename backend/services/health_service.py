import asyncio
import httpx
import json
import hashlib
import hmac
import base64
import urllib.parse
from typing import List, Dict, Any, Optional
import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from root .env file
load_dotenv(dotenv_path=Path(__file__).parent.parent.parent / ".env")

class HealthService:
    def __init__(self):
        self.client_id = os.getenv('FATSECRET_CLIENT_ID')
        self.client_secret = os.getenv('FATSECRET_CLIENT_SECRET')
        self.base_url = "https://platform.fatsecret.com/rest/server.api"
        self.token_url = "https://oauth.fatsecret.com/connect/token"
        self.access_token = None
        self.token_expires_at = 0
        
        if not self.client_id or not self.client_secret:
            print("⚠️ Warning: FatSecret API credentials not found. Health scores will use fallback estimation.")
            self.api_available = False
        else:
            self.api_available = True
            print("✅ FatSecret API credentials loaded (OAuth 2.0)")
    
    async def calculate_recipe_health_score(self, recipe: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate health score for a recipe using FatSecret API"""
        if not self.api_available:
            return self._get_fallback_health_score(recipe)
        
        try:
            # Extract ingredients from recipe
            ingredients = self._extract_ingredients_for_api(recipe)
            
            if not ingredients:
                return self._get_fallback_health_score(recipe)
            
            # Call FatSecret API
            nutritional_data = await self._call_fatsecret_api(ingredients)
            
            if nutritional_data and nutritional_data.get('calories', 0) > 0:
                # Calculate health score
                health_score = self._compute_health_score(nutritional_data)
                # Check if the API result is reasonable (not all zeros)
                if health_score['score'] > 10:  # If score is too low, likely API failure
                    return health_score
                else:
                    print(f"API returned low score ({health_score['score']}), using fallback for {recipe.get('name', 'Unknown')}")
                    return self._get_fallback_health_score(recipe)
            else:
                print(f"No nutritional data from API, using fallback for {recipe.get('name', 'Unknown')}")
                return self._get_fallback_health_score(recipe)
                
        except Exception as e:
            print(f"Health score calculation failed for {recipe.get('name', 'Unknown')}: {e}")
            return self._get_fallback_health_score(recipe)
    
    async def _get_access_token(self) -> Optional[str]:
        """Get OAuth 2.0 access token"""
        import time
        
        # Check if token is still valid
        if self.access_token and time.time() < self.token_expires_at:
            return self.access_token
        
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                # Prepare OAuth 2.0 token request
                auth = (self.client_id, self.client_secret)
                data = {
                    'grant_type': 'client_credentials',
                    'scope': 'basic'
                }
                
                response = await client.post(
                    self.token_url,
                    auth=auth,
                    data=data,
                    headers={'Content-Type': 'application/x-www-form-urlencoded'}
                )
                
                if response.status_code == 200:
                    token_data = response.json()
                    self.access_token = token_data['access_token']
                    # Set expiration time (subtract 60 seconds for safety)
                    self.token_expires_at = time.time() + token_data['expires_in'] - 60
                    print("✅ FatSecret OAuth 2.0 token obtained")
                    return self.access_token
                else:
                    print(f"Token request failed: {response.status_code} - {response.text}")
                    return None
                    
        except Exception as e:
            print(f"Error getting access token: {e}")
            return None
    
    def _extract_ingredients_for_api(self, recipe: Dict[str, Any]) -> List[str]:
        """Extract clean ingredient names for API calls"""
        ingredients = []
        for ingredient_string in recipe.get('ingredient_tags', []):
            # Clean the ingredient string (remove JSON formatting)
            cleaned = ingredient_string.strip('[]"')
            if cleaned and len(cleaned) > 1:  # Filter out single characters
                ingredients.append(cleaned)
        return ingredients
    
    async def _call_fatsecret_api(self, ingredients: List[str]) -> Optional[Dict[str, Any]]:
        """Call FatSecret API for nutritional data"""
        if not self.api_available:
            return None
        
        try:
            # Group ingredients to minimize API calls
            grouped_ingredients = self._group_ingredients_efficiently(ingredients)
            
            nutritional_data = {
                'calories': 0,
                'protein': 0,
                'carbs': 0,
                'fat': 0,
                'fiber': 0,
                'sugar': 0,
                'sodium': 0
            }
            
            async with httpx.AsyncClient(timeout=10.0) as client:
                for group_name, group_ingredients in grouped_ingredients.items():
                    if group_ingredients:
                        # Use the first ingredient as representative for the group
                        representative_ingredient = group_ingredients[0]
                        
                        # Make API call for this ingredient
                        api_data = await self._search_food_item(client, representative_ingredient)
                        
                        if api_data:
                            # Scale nutritional data by number of ingredients in group
                            scale_factor = len(group_ingredients)
                            for nutrient, value in api_data.items():
                                if isinstance(value, (int, float)):
                                    nutritional_data[nutrient] += value * scale_factor
            
            return nutritional_data
            
        except Exception as e:
            print(f"FatSecret API call failed: {e}")
            return None
    
    async def _search_food_item(self, client: httpx.AsyncClient, ingredient: str) -> Optional[Dict[str, Any]]:
        """Search for a specific food item in FatSecret API using OAuth 2.0"""
        try:
            # Get access token
            access_token = await self._get_access_token()
            if not access_token:
                print(f"No access token available for {ingredient}")
                return None
            
            # Step 1: Search for food items
            search_params = {
                'method': 'foods.search',
                'search_expression': ingredient,
                'format': 'json'
            }
            
            headers = {
                'Authorization': f'Bearer {access_token}',
                'Content-Type': 'application/json'
            }
            
            print(f"Searching for '{ingredient}'...")
            
            search_response = await client.get(self.base_url, params=search_params, headers=headers)
            
            if search_response.status_code != 200:
                print(f"Search failed with status {search_response.status_code}")
                return None
            
            search_data = search_response.json()
            
            # Check for API errors
            if 'error' in search_data:
                error_code = search_data['error'].get('code', 'unknown')
                error_message = search_data['error'].get('message', 'Unknown error')
                
                if error_code == 21:  # Invalid IP address
                    print(f"⚠️ FatSecret API: IP address not whitelisted. Using fallback scoring.")
                    print(f"   To use the API, add your IP address to the FatSecret app settings.")
                else:
                    print(f"API Error {error_code}: {error_message}")
                return None
            
            # Step 2: Get detailed nutritional info for the first food item
            foods = search_data.get('foods', {}).get('food', [])
            if not foods:
                print(f"No foods found for '{ingredient}'")
                return None
            
            # Get the first food item
            food = foods[0] if isinstance(foods, list) else foods
            food_id = food.get('food_id')
            
            if not food_id:
                print(f"No food_id found for '{ingredient}'")
                return None
            
            # Step 3: Get detailed nutritional information
            nutrition_params = {
                'method': 'food.get.v2',
                'food_id': food_id,
                'format': 'json'
            }
            
            print(f"Getting nutrition for food_id {food_id}...")
            
            nutrition_response = await client.get(self.base_url, params=nutrition_params, headers=headers)
            
            if nutrition_response.status_code != 200:
                print(f"Nutrition request failed with status {nutrition_response.status_code}")
                return None
            
            nutrition_data = nutrition_response.json()
            
            if 'error' in nutrition_data:
                print(f"Nutrition API Error: {nutrition_data['error']}")
                return None
            
            return self._parse_nutritional_data(nutrition_data)
                
        except Exception as e:
            print(f"Error searching for {ingredient}: {e}")
            import traceback
            traceback.print_exc()
            return None
    
    def _group_ingredients_efficiently(self, ingredients: List[str]) -> Dict[str, List[str]]:
        """Group ingredients to minimize API calls"""
        groups = {
            'protein': [],
            'vegetables': [],
            'grains': [],
            'dairy': [],
            'other': []
        }
        
        for ingredient in ingredients:
            ingredient_lower = ingredient.lower()
            if any(protein in ingredient_lower for protein in ['chicken', 'beef', 'pork', 'fish', 'egg', 'turkey', 'lamb']):
                groups['protein'].append(ingredient)
            elif any(veg in ingredient_lower for veg in ['onion', 'garlic', 'carrot', 'tomato', 'spinach', 'pepper', 'mushroom', 'broccoli']):
                groups['vegetables'].append(ingredient)
            elif any(grain in ingredient_lower for grain in ['rice', 'pasta', 'bread', 'flour', 'noodle', 'quinoa']):
                groups['grains'].append(ingredient)
            elif any(dairy in ingredient_lower for dairy in ['milk', 'cheese', 'butter', 'cream', 'yogurt']):
                groups['dairy'].append(ingredient)
            else:
                groups['other'].append(ingredient)
        
        # Return only non-empty groups
        return {k: v for k, v in groups.items() if v}
    
    def _parse_nutritional_data(self, api_response: Dict[str, Any]) -> Dict[str, Any]:
        """Parse nutritional data from FatSecret API response"""
        try:
            # Handle both search response and detailed food response
            if 'foods' in api_response:
                # This is a search response - we shouldn't be here anymore
                print("Warning: Received search response in _parse_nutritional_data")
                return None
            
            # This should be a detailed food response
            food = api_response.get('food', {})
            if not food:
                print("No food data in response")
                return None
            
            servings = food.get('servings', {}).get('serving', [])
            
            if not servings:
                print("No servings data found")
                return None
            
            # Get the first serving (usually 100g or 1 serving)
            serving = servings[0] if isinstance(servings, list) else servings
            
            # Parse nutritional values
            nutritional_data = {
                'calories': float(serving.get('calories', 0)),
                'protein': float(serving.get('protein', 0)),
                'carbs': float(serving.get('carbohydrate', 0)),
                'fat': float(serving.get('fat', 0)),
                'fiber': float(serving.get('fiber', 0)),
                'sugar': float(serving.get('sugar', 0)),
                'sodium': float(serving.get('sodium', 0))
            }
            
            print(f"Parsed nutritional data: {nutritional_data}")
            return nutritional_data
            
        except Exception as e:
            print(f"Error parsing nutritional data: {e}")
            import traceback
            traceback.print_exc()
            return None
    
    def _compute_health_score(self, nutritional_data: Dict[str, Any]) -> Dict[str, Any]:
        """Compute health score from nutritional data"""
        # Extract key nutritional values
        calories = nutritional_data.get('calories', 0)
        protein = nutritional_data.get('protein', 0)
        carbs = nutritional_data.get('carbs', 0)
        fat = nutritional_data.get('fat', 0)
        fiber = nutritional_data.get('fiber', 0)
        sugar = nutritional_data.get('sugar', 0)
        sodium = nutritional_data.get('sodium', 0)
        
        # Calculate component scores
        nutritional_density = self._calculate_nutritional_density(protein, fiber, calories)
        macro_balance = self._calculate_macro_balance(protein, carbs, fat, calories)
        health_risk = self._calculate_health_risk(sodium, sugar, fat)
        
        # Overall score
        overall_score = (nutritional_density * 0.4 + macro_balance * 0.3 + health_risk * 0.3)
        
        return {
            'score': round(overall_score, 1),
            'level': self._get_health_level(overall_score),
            'breakdown': {
                'nutritional_density': round(nutritional_density, 1),
                'macro_balance': round(macro_balance, 1),
                'health_risk': round(health_risk, 1)
            },
            'nutritional_info': {
                'calories': round(calories, 1),
                'protein': round(protein, 1),
                'carbs': round(carbs, 1),
                'fat': round(fat, 1),
                'fiber': round(fiber, 1),
                'sugar': round(sugar, 1),
                'sodium': round(sodium, 1)
            },
            'fallback': False
        }
    
    def _calculate_nutritional_density(self, protein: float, fiber: float, calories: float) -> float:
        """Calculate nutritional density score"""
        if calories == 0:
            return 0
        
        # More balanced nutritional density calculation
        # Base score for having nutrients
        base_score = 60
        
        # Add points for protein density
        protein_density = (protein * 4) / calories * 100 if calories > 0 else 0
        protein_bonus = min(20, protein_density * 0.5)
        
        # Add points for fiber density
        fiber_density = (fiber * 2) / calories * 100 if calories > 0 else 0
        fiber_bonus = min(20, fiber_density * 0.5)
        
        density_score = base_score + protein_bonus + fiber_bonus
        return min(100, max(0, density_score))
    
    def _calculate_macro_balance(self, protein: float, carbs: float, fat: float, calories: float) -> float:
        """Calculate macro nutrient balance score"""
        if calories == 0:
            return 0
        
        # Ideal ratios: 25% protein, 45% carbs, 30% fat
        protein_calories = protein * 4
        carb_calories = carbs * 4
        fat_calories = fat * 9
        
        ideal_protein = calories * 0.25
        ideal_carbs = calories * 0.45
        ideal_fat = calories * 0.30
        
        protein_score = 100 - abs(protein_calories - ideal_protein) / ideal_protein * 100 if ideal_protein > 0 else 0
        carb_score = 100 - abs(carb_calories - ideal_carbs) / ideal_carbs * 100 if ideal_carbs > 0 else 0
        fat_score = 100 - abs(fat_calories - ideal_fat) / ideal_fat * 100 if ideal_fat > 0 else 0
        
        return max(0, (protein_score + carb_score + fat_score) / 3)
    
    def _calculate_health_risk(self, sodium: float, sugar: float, fat: float) -> float:
        """Calculate health risk score (higher is better)"""
        risk_score = 100
        
        # More lenient sodium limits (>800mg per serving)
        if sodium > 800:
            risk_score -= min(20, (sodium - 800) / 15)  # Reduced penalty
        
        # More lenient sugar limits (>20g per serving)
        if sugar > 20:
            risk_score -= min(15, (sugar - 20) * 1.5)  # Reduced penalty
        
        # More lenient fat limits (>8g per serving)
        if fat > 8:
            risk_score -= min(15, (fat - 8) * 2)  # Reduced penalty
        
        return max(0, risk_score)
    
    def _get_health_level(self, score: float) -> str:
        """Get health level based on score"""
        if score >= 90:
            return 'excellent'
        elif score >= 80:
            return 'very_good'
        elif score >= 70:
            return 'good'
        elif score >= 60:
            return 'fair'
        elif score >= 50:
            return 'poor'
        else:
            return 'very_poor'
    
    def _get_fallback_health_score(self, recipe: Dict[str, Any]) -> Dict[str, Any]:
        """Provide basic health estimation when API fails"""
        ingredients = self._extract_ingredients_for_api(recipe)
        
        # More balanced heuristic-based scoring
        score = 70  # Higher base score - most home cooking is reasonably healthy
        
        # Add points for healthy ingredients
        healthy_ingredients = ['vegetable', 'onion', 'garlic', 'tomato', 'spinach', 'carrot', 'broccoli', 'pepper', 'mushroom', 'lettuce', 'cucumber', 'celery']
        if any(any(healthy in ing.lower() for healthy in healthy_ingredients) for ing in ingredients):
            score += 15
        
        # Add points for lean proteins
        lean_proteins = ['chicken', 'fish', 'turkey', 'egg', 'tofu', 'beans', 'lentils']
        if any(any(protein in ing.lower() for protein in lean_proteins) for ing in ingredients):
            score += 10
        
        # Add points for whole grains
        whole_grains = ['brown rice', 'quinoa', 'oats', 'whole wheat', 'barley']
        if any(any(grain in ing.lower() for grain in whole_grains) for ing in ingredients):
            score += 8
        
        # Add points for healthy fats
        healthy_fats = ['olive oil', 'avocado', 'nuts', 'seeds']
        if any(any(fat in ing.lower() for fat in healthy_fats) for ing in ingredients):
            score += 5
        
        # Moderate penalties for less healthy ingredients (not too harsh)
        if any('butter' in ing.lower() or 'cream' in ing.lower() or 'cheese' in ing.lower() for ing in ingredients):
            score -= 8  # Reduced from 10
        if any('sugar' in ing.lower() or 'honey' in ing.lower() for ing in ingredients):
            score -= 5  # Reduced from 5
        if any('bacon' in ing.lower() or 'sausage' in ing.lower() for ing in ingredients):
            score -= 6  # Moderate penalty for processed meats
        
        # Ensure score stays within reasonable bounds
        score = max(40, min(95, score))  # Minimum 40, maximum 95
        
        return {
            'score': score,
            'level': self._get_health_level(score),
            'breakdown': {
                'nutritional_density': score,
                'macro_balance': score,
                'health_risk': score
            },
            'nutritional_info': None,
            'fallback': True
        }
    
