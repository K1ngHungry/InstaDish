from typing import List, Dict, Any
import asyncio

class SustainabilityService:
    def __init__(self):
        self.sustainability_data = {
            # High sustainability ingredients
            'high': [
                'beans', 'lentils', 'chickpeas', 'tofu', 'tempeh', 'quinoa', 'brown rice',
                'oats', 'barley', 'millet', 'spinach', 'kale', 'broccoli', 'carrots',
                'potatoes', 'sweet potatoes', 'onions', 'garlic', 'tomatoes', 'peppers',
                'cucumbers', 'lettuce', 'apples', 'bananas', 'oranges', 'berries',
                'nuts', 'seeds', 'olive oil', 'coconut oil', 'herbs', 'spices'
            ],
            # Medium sustainability ingredients
            'medium': [
                'chicken', 'turkey', 'eggs', 'dairy', 'milk', 'cheese', 'yogurt',
                'pork', 'lamb', 'fish', 'salmon', 'tuna', 'shrimp', 'crab',
                'wheat', 'corn', 'soy', 'avocado', 'mango', 'pineapple'
            ],
            # Low sustainability ingredients
            'low': [
                'beef', 'veal', 'lamb', 'goat', 'duck', 'goose', 'lobster',
                'processed meat', 'bacon', 'sausage', 'ham', 'hot dogs',
                'palm oil', 'coconut milk', 'almond milk', 'cashew milk'
            ]
        }
        
        self.carbon_footprint = {
            'high': 0.5,    # kg CO2 per kg
            'medium': 2.0,  # kg CO2 per kg
            'low': 8.0      # kg CO2 per kg
        }
        
        self.water_usage = {
            'high': 100,    # liters per kg
            'medium': 500,  # liters per kg
            'low': 2000     # liters per kg
        }
    
    async def analyze_ingredients(self, ingredients: List[str]) -> Dict[str, Any]:
        """Analyze sustainability of a list of ingredients"""
        if not ingredients:
            return {
                'overall_score': 0,
                'sustainability_level': 'unknown',
                'carbon_footprint': 0,
                'water_usage': 0,
                'recommendations': ['No ingredients provided for analysis'],
                'ingredient_analysis': []
            }
        
        ingredient_analysis = []
        total_carbon = 0
        total_water = 0
        sustainability_scores = []
        
        for ingredient in ingredients:
            ingredient_lower = ingredient.lower().strip()
            sustainability_level = self._get_sustainability_level(ingredient_lower)
            
            analysis = {
                'ingredient': ingredient,
                'sustainability_level': sustainability_level,
                'carbon_footprint': self.carbon_footprint[sustainability_level],
                'water_usage': self.water_usage[sustainability_level],
                'recommendation': self._get_recommendation(ingredient_lower, sustainability_level)
            }
            
            ingredient_analysis.append(analysis)
            total_carbon += self.carbon_footprint[sustainability_level]
            total_water += self.water_usage[sustainability_level]
            
            # Convert to score (high=3, medium=2, low=1)
            score_map = {'high': 3, 'medium': 2, 'low': 1}
            sustainability_scores.append(score_map[sustainability_level])
        
        # Calculate overall score
        overall_score = sum(sustainability_scores) / len(sustainability_scores) if sustainability_scores else 0
        
        # Determine overall sustainability level
        if overall_score >= 2.5:
            overall_level = 'high'
        elif overall_score >= 1.5:
            overall_level = 'medium'
        else:
            overall_level = 'low'
        
        # Generate recommendations
        recommendations = self._generate_recommendations(ingredient_analysis, overall_level)
        
        return {
            'overall_score': round(overall_score, 1),
            'sustainability_level': overall_level,
            'carbon_footprint': round(total_carbon, 1),
            'water_usage': round(total_water, 1),
            'recommendations': recommendations,
            'ingredient_analysis': ingredient_analysis
        }
    
    def _get_sustainability_level(self, ingredient: str) -> str:
        """Determine sustainability level of an ingredient"""
        for level, ingredients in self.sustainability_data.items():
            if any(ing in ingredient for ing in ingredients):
                return level
        return 'medium'  # Default to medium if not found
    
    def _get_recommendation(self, ingredient: str, level: str) -> str:
        """Get recommendation for an ingredient"""
        if level == 'high':
            return f"Great choice! {ingredient.title()} is highly sustainable."
        elif level == 'medium':
            return f"Good option. {ingredient.title()} has moderate environmental impact."
        else:
            return f"Consider alternatives. {ingredient.title()} has high environmental impact."
    
    def _generate_recommendations(self, ingredient_analysis: List[Dict], overall_level: str) -> List[str]:
        """Generate overall recommendations"""
        recommendations = []
        
        if overall_level == 'high':
            recommendations.append("Excellent! Your ingredients are very sustainable.")
            recommendations.append("Consider adding more plant-based proteins like beans or lentils.")
        elif overall_level == 'medium':
            recommendations.append("Good sustainability mix! Consider swapping some ingredients for more sustainable options.")
            recommendations.append("Try incorporating more plant-based proteins.")
        else:
            recommendations.append("Consider more sustainable alternatives for some ingredients.")
            recommendations.append("Plant-based proteins like beans, lentils, and tofu are great options.")
        
        # Specific recommendations based on ingredients
        low_sustainability = [ing for ing in ingredient_analysis if ing['sustainability_level'] == 'low']
        if low_sustainability:
            recommendations.append(f"Consider alternatives for: {', '.join([ing['ingredient'] for ing in low_sustainability[:3]])}")
        
        recommendations.append("Buy local and seasonal ingredients when possible.")
        recommendations.append("Reduce food waste by planning portions carefully.")
        
        return recommendations
