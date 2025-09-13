import os
import json
import pandas as pd
import numpy as np
import faiss
import re
from sentence_transformers import SentenceTransformer
from typing import List, Dict, Any, Optional
import asyncio
from concurrent.futures import ThreadPoolExecutor
import pickle
from pathlib import Path

class RAGService:
    def __init__(self):
        self.model = None
        self.index = None
        self.recipe_metadata = []
        self.recipe_texts = []
        self.executor = ThreadPoolExecutor(max_workers=4)
        
        # Set up data directory for persistent storage
        self.data_dir = Path(__file__).parent.parent / "data"
        self.data_dir.mkdir(exist_ok=True)
        
        # File paths for persistent storage
        self.embeddings_file = self.data_dir / "embeddings.npy"
        self.faiss_index_file = self.data_dir / "faiss_index.faiss"
        self.metadata_file = self.data_dir / "recipe_metadata.json"
        self.texts_file = self.data_dir / "recipe_texts.json"
        self.config_file = self.data_dir / "index_config.json"
        
        # Load ingredient data from JSON files
        self.ingredient_aliases = self._load_ingredient_data("ingredient_aliases.json")
        self.critical_ingredients = self._load_ingredient_data("critical_ingredients.json")
        self.ingredient_substitutions = self._load_ingredient_data("ingredient_substitutions.json")
        
        # Pattern-based criticality analysis
        self.ingredient_patterns = {}  # Cache for learned patterns
        self.recipe_groups = {}  # Cache for similar recipe groups
        
        # Health service for FatSecret API integration
        from .health_service import HealthService
        self.health_service = HealthService()
    
    def _load_ingredient_data(self, filename: str) -> dict:
        """Load ingredient data from JSON file"""
        file_path = self.data_dir / filename
        try:
            with open(file_path, 'r') as f:
                return json.load(f)
        except FileNotFoundError:
            print(f"Warning: {filename} not found, using empty data")
            return {}
        except json.JSONDecodeError as e:
            print(f"Error loading {filename}: {e}")
            return {}
        
    async def initialize(self):
        """Initialize the RAG service with FAISS index and embeddings"""
        print("Loading sentence transformer model...")
        
        # Load sentence transformer model
        self.model = SentenceTransformer('all-MiniLM-L6-v2')
        print("Sentence transformer model loaded")
        
        # Check if we have cached embeddings
        if self._has_cached_embeddings():
            print("✅ Found cached embeddings, loading from disk...")
            await self._load_cached_embeddings()
            print(f"✅ RAG service ready with {len(self.recipe_metadata)} recipes (loaded from cache)")
        else:
            print("No cached embeddings found, generating new ones...")
            # Load recipes from CSV
            print("Loading recipes from CSV...")
            await self._load_recipes()

            # Generate embeddings and create FAISS index
            print("Generating embeddings and creating FAISS index...")
            await self._create_faiss_index()

            # Save embeddings to disk
            print("Saving embeddings to disk...")
            await self._save_embeddings()

            print(f"RAG service ready with {len(self.recipe_metadata)} recipes (new)")
        
        # Pre-load pattern analysis for better performance
        await self.preload_pattern_analysis()
        
    def _clean_ingredient_list(self, ingredient_string):
        """Parse ingredient string from CSV as JSON array"""
        if pd.isna(ingredient_string):
            return []
        
        try:
            import json
            # Try to parse as JSON first
            ingredients = json.loads(ingredient_string)
            if isinstance(ingredients, list):
                return ingredients
        except:
            pass
        
        # If JSON parsing fails, try to split by comma and clean
        try:
            # Remove brackets and quotes, then split by comma
            cleaned = str(ingredient_string).strip()
            if cleaned.startswith('[') and cleaned.endswith(']'):
                cleaned = cleaned[1:-1]
            
            # Split by comma and clean each item
            ingredients = []
            for item in cleaned.split(','):
                item = item.strip()
                # Remove quotes
                if item.startswith('"') and item.endswith('"'):
                    item = item[1:-1]
                elif item.startswith("'") and item.endswith("'"):
                    item = item[1:-1]
                
                if item and item.strip():
                    ingredients.append(item.strip())
            
            return ingredients
        except Exception as e:
            print(f"Failed to parse ingredients: {e}")
            return []

    def _clean_instruction_list(self, instruction_string):
        """Parse instruction string from CSV as JSON array"""
        if pd.isna(instruction_string):
            return []
        
        try:
            import json
            # Try to parse as JSON first
            instructions = json.loads(instruction_string)
            if isinstance(instructions, list):
                return instructions
        except:
            pass
        
        # If JSON parsing fails, try to split by comma and clean
        try:
            # Remove brackets and quotes, then split by comma
            cleaned = str(instruction_string).strip()
            if cleaned.startswith('[') and cleaned.endswith(']'):
                cleaned = cleaned[1:-1]
            
            # Split by comma and clean each item
            instructions = []
            for item in cleaned.split(','):
                item = item.strip()
                # Remove quotes
                if item.startswith('"') and item.endswith('"'):
                    item = item[1:-1]
                elif item.startswith("'") and item.endswith("'"):
                    item = item[1:-1]
                
                if item and item.strip():
                    instructions.append(item.strip())
            
            return instructions
        except Exception as e:
            print(f"Failed to parse instructions: {e}")
            return []

    async def _load_recipes(self):
        """Load recipes from CSV file"""
        csv_path = Path(__file__).parent.parent.parent / "recipes_small.csv"
        
        if not csv_path.exists():
            raise FileNotFoundError(f"CSV file not found at {csv_path}")
        
        # Read CSV without headers
        df = pd.read_csv(csv_path, header=None, names=['Recipe Name', 'Ingredients', 'Instructions', 'Ingredient List'])
        
        self.recipe_metadata = []
        self.recipe_texts = []
        
        for idx, row in df.iterrows():
            recipe_id = idx + 1
            
            # Parse ingredients with proper cleaning
            ingredients = self._clean_ingredient_list(row['Ingredients'])
            
            # Parse instructions with proper cleaning
            instructions = self._clean_instruction_list(row['Instructions'])
            
            # Create ingredient tags for matching
            ingredient_tags = []
            if pd.notna(row['Ingredient List']):
                ingredient_tags = [tag.strip().lower() for tag in str(row['Ingredient List']).split(',') if tag.strip()]
            
            # Create searchable text
            searchable_text = f"{row['Recipe Name']} {' '.join(ingredients)} {' '.join(instructions)}"
            
            recipe_data = {
                'id': recipe_id,
                'name': row['Recipe Name'] or f"Recipe {recipe_id}",
                'ingredients': ingredients,
                'instructions': instructions,
                'ingredient_tags': ingredient_tags,
                'category': self._determine_category(ingredients),
                'prep_time': self._estimate_prep_time(ingredients, instructions),
                'cook_time': self._estimate_cook_time(instructions),
                'difficulty': self._estimate_difficulty(ingredients, instructions)
            }
            
            self.recipe_metadata.append(recipe_data)
            self.recipe_texts.append(searchable_text)
        
        print(f" Loaded {len(self.recipe_metadata)} recipes")
        
    async def _create_faiss_index(self):
        """Create FAISS index from recipe texts"""
        # Generate embeddings
        print("Generating embeddings...")
        embeddings = await self._generate_embeddings(self.recipe_texts)
        
        # Create FAISS index
        dimension = embeddings.shape[1]
        self.index = faiss.IndexFlatIP(dimension)  # Inner product for cosine similarity
        
        # Normalize embeddings for cosine similarity
        faiss.normalize_L2(embeddings)
        
        # Add embeddings to index
        self.index.add(embeddings.astype('float32'))
        
        print(f" FAISS index created with {self.index.ntotal} vectors")
        
    async def _generate_embeddings(self, texts: List[str]) -> np.ndarray:
        """Generate embeddings for texts using sentence transformer"""
        def _embed_batch(batch_texts):
            return self.model.encode(batch_texts, convert_to_numpy=True)
        
        # Process in batches to avoid memory issues
        batch_size = 32
        all_embeddings = []
        
        for i in range(0, len(texts), batch_size):
            batch = texts[i:i + batch_size]
            batch_embeddings = await asyncio.get_event_loop().run_in_executor(
                self.executor, _embed_batch, batch
            )
            all_embeddings.append(batch_embeddings)
        
        return np.vstack(all_embeddings)
        
    async def search_recipes(self, query: str, limit: int = 5, user_ingredients: List[str] = None) -> List[Dict[str, Any]]:
        """Search for recipes using FAISS vector similarity"""
        if not self.index or not self.model:
            return []
        
        # Generate query embedding
        query_embedding = await asyncio.get_event_loop().run_in_executor(
            self.executor, self.model.encode, [query]
        )
        query_embedding = query_embedding.astype('float32')
        faiss.normalize_L2(query_embedding)
        
        # Search FAISS index with more candidates for better pattern analysis
        search_limit = min(limit * 4, len(self.recipe_metadata))  # Get more candidates
        scores, indices = self.index.search(query_embedding, search_limit)
        
        # Get results and calculate enhanced ingredient matches
        results = []
        for score, idx in zip(scores[0], indices[0]):
            if idx == -1:  # Invalid index
                continue
                
            recipe = self.recipe_metadata[idx].copy()
            
            # Use enhanced ingredient matching with pattern analysis
            match_info = self._calculate_enhanced_ingredient_match(recipe, user_ingredients or [])
            recipe['match'] = match_info
            
            # Calculate recipe sustainability
            sustainability_info = self._calculate_recipe_sustainability(recipe)
            recipe['sustainability'] = sustainability_info
            
            # Calculate health score for displayed recipes only
            health_info = await self.health_service.calculate_recipe_health_score(recipe)
            recipe['health'] = health_info
            
            results.append(recipe)
            
            if len(results) >= limit:
                break
        
        return results
        
    async def get_recipe_by_id(self, recipe_id: int) -> Optional[Dict[str, Any]]:
        """Get a specific recipe by ID"""
        for recipe in self.recipe_metadata:
            if recipe['id'] == recipe_id:
                return recipe.copy()
        return None
        
    async def get_all_recipes(self) -> List[Dict[str, Any]]:
        """Get all recipes"""
        return self.recipe_metadata.copy()
    
    def _calculate_ingredient_match(self, recipe: Dict[str, Any], user_ingredients: List[str]) -> Dict[str, Any]:
        """Calculate how well user ingredients match recipe ingredients"""
        if not user_ingredients:
            return {
                "matches": 0,
                "total": len(recipe['ingredient_tags']),
                "percentage": 0,
                "missing": recipe['ingredient_tags'],
                "hasAllIngredients": False
            }
        
        # Normalize ingredients using hybrid approach
        user_ingredients_normalized = [self._normalize_ingredient(ing) for ing in user_ingredients]
        recipe_tags_normalized = [self._normalize_ingredient(tag) for tag in recipe['ingredient_tags']]
        
        matches = 0
        missing = []
        
        critical_missing = []
        important_missing = []
        replaceable_missing = []
        
        for i, recipe_ingredient in enumerate(recipe_tags_normalized):
            original_ingredient = recipe['ingredient_tags'][i]
            if self._ingredients_match(recipe_ingredient, user_ingredients_normalized):
                matches += 1
            else:
                # Classify missing ingredient importance
                importance = self._classify_ingredient_importance(original_ingredient, recipe.get('category', ''))
                if importance == 'critical':
                    critical_missing.append(original_ingredient)
                elif importance == 'important':
                    important_missing.append(original_ingredient)
                else:
                    replaceable_missing.append(original_ingredient)
        
        # Combine missing ingredients with importance info
        missing = critical_missing + important_missing + replaceable_missing
        
        total = len(recipe_tags_normalized)
        percentage = (matches / total * 100) if total > 0 else 0
        
        # Calculate weighted score (critical ingredients count more)
        # Count actual matches by importance level
        critical_matches = 0
        important_matches = 0
        replaceable_matches = 0
        
        for i, recipe_ingredient in enumerate(recipe_tags_normalized):
            original_ingredient = recipe['ingredient_tags'][i]
            if self._ingredients_match(recipe_ingredient, user_ingredients_normalized):
                # This ingredient is matched, count it by importance
                importance = self._classify_ingredient_importance(original_ingredient, recipe.get('category', ''))
                if importance == 'critical':
                    critical_matches += 1
                elif importance == 'important':
                    important_matches += 1
                else:
                    replaceable_matches += 1
        
        # Calculate total possible weighted score
        total_critical = len(critical_missing) + critical_matches
        total_important = len(important_missing) + important_matches
        total_replaceable = len(replaceable_missing) + replaceable_matches
        
        # Weighted percentage (critical=3, important=2, replaceable=1)
        if total_critical + total_important + total_replaceable == 0:
            weighted_score = 0
        else:
            max_weighted_score = (total_critical * 3 + total_important * 2 + total_replaceable * 1)
            actual_weighted_score = (critical_matches * 3 + important_matches * 2 + replaceable_matches * 1)
            weighted_score = (actual_weighted_score / max_weighted_score) * 100
        
        # Generate substitution suggestions for missing ingredients
        substitution_suggestions = {}
        for ingredient in missing[:5]:  # Limit to first 5 missing ingredients
            subs = self._get_ingredient_substitution_suggestions(ingredient, recipe.get('category', ''))
            if subs:
                substitution_suggestions[ingredient] = subs
        
        return {
            "matches": matches,
            "total": total,
            "percentage": round(percentage, 1),
            "weighted_percentage": round(weighted_score, 1),
            "missing": missing,
            "critical_missing": critical_missing,
            "important_missing": important_missing,
            "replaceable_missing": replaceable_missing,
            "substitution_suggestions": substitution_suggestions,
            "hasAllIngredients": matches == total,
            "hasAllCriticalIngredients": len(critical_missing) == 0
        }
        
    def _determine_category(self, ingredients: List[str]) -> str:
        """Determine recipe category based on ingredients"""
        if not ingredients:
            return "Main Course"
            
        ingredients_lower = ' '.join(ingredients).lower()
        
        # Check for specific dish types first (more specific patterns)
        if any(word in ingredients_lower for word in ['soup', 'broth', 'stock', 'bouillon']):
            return "Soup"
        elif any(word in ingredients_lower for word in ['sauce', 'dressing', 'marinade', 'gravy']):
            return "Sauce"
        elif any(word in ingredients_lower for word in ['salad', 'lettuce', 'arugula', 'kale']):
            # Only classify as salad if it's clearly a salad (not just containing greens)
            if any(word in ingredients_lower for word in ['chicken', 'beef', 'pork', 'fish', 'egg', 'tofu']):
                return "Main Course"  # Protein + greens = main course
            return "Salad"
        elif any(word in ingredients_lower for word in ['bread', 'pasta', 'rice', 'noodle', 'quinoa']):
            # Only classify as side dish if it's clearly a side (not a main with protein)
            if any(word in ingredients_lower for word in ['chicken', 'beef', 'pork', 'fish', 'egg', 'tofu']):
                return "Main Course"  # Protein + starch = main course
            return "Side Dish"
        elif any(word in ingredients_lower for word in ['chicken', 'beef', 'pork', 'lamb', 'turkey', 'fish', 'salmon', 'tuna', 'egg', 'tofu']):
            return "Main Course"
        else:
            return "Main Course"  # Default to main course
            
    def _estimate_prep_time(self, ingredients: List[str], instructions: List[str]) -> str:
        """Estimate preparation time"""
        complexity = len(ingredients) + len(instructions)
        if complexity < 5:
            return "5 min"
        elif complexity < 10:
            return "15 min"
        else:
            return "30 min"
            
    def _estimate_cook_time(self, instructions: List[str]) -> str:
        """Estimate cooking time"""
        if not instructions:
            return "15 min"
            
        instructions_text = ' '.join(instructions).lower()
        
        if any(word in instructions_text for word in ['bake', 'roast', 'oven']):
            return "1+ hours"
        elif any(word in instructions_text for word in ['simmer', 'boil', 'cook']):
            return "30 min"
        else:
            return "15 min"
            
    def _estimate_difficulty(self, ingredients: List[str], instructions: List[str]) -> str:
        """Estimate recipe difficulty"""
        complexity = len(ingredients) + len(instructions)
        if complexity < 5:
            return "Easy"
        elif complexity < 10:
            return "Medium"
        else:
            return "Hard"
    
    def _estimate_calories(self, recipe: Dict[str, Any]) -> int:
        """Estimate calories for a recipe"""
        # Simple calorie estimation based on ingredients
        calorie_map = {
            'chicken': 165, 'beef': 250, 'pork': 242, 'fish': 206, 'salmon': 208,
            'rice': 130, 'pasta': 131, 'bread': 265, 'potato': 77, 'sweet potato': 86,
            'onion': 40, 'garlic': 149, 'tomato': 18, 'carrot': 41, 'broccoli': 34,
            'cheese': 113, 'milk': 42, 'egg': 155, 'butter': 717, 'oil': 884,
            'sugar': 387, 'flour': 364, 'chocolate': 546, 'nuts': 607
        }
        
        total_calories = 0
        for ingredient in recipe.get('ingredients', []):
            ingredient_lower = ingredient.lower()
            for key, calories in calorie_map.items():
                if key in ingredient_lower:
                    total_calories += calories
                    break
        
        # If no matches found, estimate based on ingredient count
        if total_calories == 0:
            total_calories = len(recipe.get('ingredients', [])) * 50
        
        return min(total_calories, 2000)  # Cap at 2000 calories
    
    def _calculate_recipe_sustainability(self, recipe: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate sustainability score for a recipe based on its ingredients"""
        sustainability_data = {
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
        
        carbon_footprint = {
            'high': 0.5,    # kg CO2 per kg
            'medium': 2.0,  # kg CO2 per kg
            'low': 8.0      # kg CO2 per kg
        }
        
        water_usage = {
            'high': 100,    # liters per kg
            'medium': 500,  # liters per kg
            'low': 2000     # liters per kg
        }
        
        ingredients = recipe.get('ingredient_tags', [])
        if not ingredients:
            return {
                'score': 0,
                'level': 'unknown',
                'carbon_footprint': 0,
                'water_usage': 0,
                'breakdown': []
            }
        
        sustainability_scores = []
        total_carbon = 0
        total_water = 0
        breakdown = []
        
        for ingredient in ingredients:
            ingredient_lower = ingredient.lower().strip()
            sustainability_level = 'medium'  # Default
            
            for level, ingredients_list in sustainability_data.items():
                if any(ing in ingredient_lower for ing in ingredients_list):
                    sustainability_level = level
                    break
            
            # Convert to score (high=3, medium=2, low=1)
            score_map = {'high': 3, 'medium': 2, 'low': 1}
            score = score_map[sustainability_level]
            sustainability_scores.append(score)
            
            # Calculate environmental impact
            carbon = carbon_footprint[sustainability_level]
            water = water_usage[sustainability_level]
            total_carbon += carbon
            total_water += water
            
            breakdown.append({
                'ingredient': ingredient,
                'level': sustainability_level,
                'score': score,
                'carbon': carbon,
                'water': water
            })
        
        # Calculate overall score
        overall_score = sum(sustainability_scores) / len(sustainability_scores) if sustainability_scores else 0
        
        # Determine overall sustainability level
        if overall_score >= 2.5:
            overall_level = 'high'
        elif overall_score >= 1.5:
            overall_level = 'medium'
        else:
            overall_level = 'low'
        
        return {
            'score': round(overall_score, 1),
            'level': overall_level,
            'carbon_footprint': round(total_carbon, 1),
            'water_usage': round(total_water, 1),
            'breakdown': breakdown
        }
    
    def _normalize_ingredient(self, ingredient: str) -> str:
        """Normalize ingredient by removing plurals, quantities, and descriptors"""
        if not ingredient:
            return ""
        
        # Convert to lowercase and strip
        normalized = ingredient.lower().strip()
        
        # Remove common quantity words and numbers
        quantity_words = [
            'cup', 'cups', 'tablespoon', 'tablespoons', 'tbsp', 'tsp', 'teaspoon', 'teaspoons',
            'pound', 'pounds', 'lb', 'lbs', 'ounce', 'ounces', 'oz', 'gram', 'grams', 'g',
            'kilogram', 'kilograms', 'kg', 'liter', 'liters', 'l', 'milliliter', 'milliliters', 'ml',
            'pinch', 'dash', 'handful', 'bunch', 'clove', 'cloves', 'slice', 'slices',
            'can', 'cans', 'jar', 'jars', 'bottle', 'bottles', 'package', 'packages',
            'large', 'medium', 'small', 'extra', 'fresh', 'dried', 'frozen', 'canned',
            'chopped', 'diced', 'sliced', 'minced', 'grated', 'shredded', 'crushed',
            'boneless', 'skinless', 'whole', 'halved', 'quartered', 'cubed'
        ]
        
        # Remove numbers and fractions
        import re
        normalized = re.sub(r'\d+/\d+|\d+\.\d+|\d+', '', normalized)
        
        # Remove quantity words
        words = normalized.split()
        words = [word for word in words if word not in quantity_words]
        normalized = ' '.join(words)
        
        # Remove common prefixes/suffixes
        normalized = re.sub(r'^(a|an|the)\s+', '', normalized)
        normalized = re.sub(r'\s+(and|or|with|without)\s+.*$', '', normalized)
        
        # Handle plurals - improved approach
        if normalized.endswith('ies'):
            normalized = normalized[:-3] + 'y'
        elif normalized.endswith('ches') or normalized.endswith('shes') or normalized.endswith('xes') or normalized.endswith('zes'):
            # Keep as is for words ending in ch, sh, x, z
            pass
        elif normalized.endswith('oes'):
            normalized = normalized[:-2]  # potatoes -> potato
        elif normalized.endswith('s') and len(normalized) > 3:
            normalized = normalized[:-1]  # eggs -> egg
        
        # Clean up extra spaces
        normalized = ' '.join(normalized.split())
        
        return normalized
    
    def _ingredients_match(self, recipe_ingredient: str, user_ingredients: list) -> bool:
        """Check if a recipe ingredient matches any user ingredient using hybrid approach"""
        if not recipe_ingredient or not user_ingredients:
            return False
        
        # 1. Exact match after normalization
        if recipe_ingredient in user_ingredients:
            return True
        
        # 2. Substring match (one contains the other)
        for user_ing in user_ingredients:
            if recipe_ingredient in user_ing or user_ing in recipe_ingredient:
                return True
        
        # 3. Fuzzy matching for close matches
        from difflib import SequenceMatcher
        
        for user_ing in user_ingredients:
            similarity = SequenceMatcher(None, recipe_ingredient, user_ing).ratio()
            if similarity >= 0.8:  # 80% similarity threshold
                return True
        
        # 4. Check ingredient aliases
        if self._check_ingredient_aliases(recipe_ingredient, user_ingredients):
            return True
        
        return False
    
    def _check_ingredient_aliases(self, recipe_ingredient: str, user_ingredients: list) -> bool:
        """Check if ingredients match through common aliases"""
        # Check if recipe ingredient matches any alias group
        for base_ingredient, alias_list in self.ingredient_aliases.items():
            if recipe_ingredient in alias_list:
                # Check if any user ingredient is in the same alias group
                for user_ing in user_ingredients:
                    if user_ing in alias_list:
                        return True
        
        return False
    
    def _is_critical_ingredient(self, ingredient: str, recipe_category: str) -> bool:
        """Check if an ingredient is critical for a recipe category"""
        # Normalize the ingredient
        normalized = self._normalize_ingredient(ingredient)
        
        # Get critical ingredients for this category from loaded data
        category_critical = self.critical_ingredients.get(recipe_category.lower(), [])
        
        # Check if ingredient matches any critical ingredient
        for critical in category_critical:
            if critical in normalized or normalized in critical:
                return True
        
        # Also check for primary proteins (always critical in main dishes)
        primary_proteins = ['chicken', 'beef', 'pork', 'fish', 'salmon', 'tuna', 'tofu', 'lamb', 'turkey']
        if any(protein in normalized for protein in primary_proteins):
            return True
        
        return False
    
    def _classify_ingredient_importance(self, ingredient: str, recipe_category: str) -> str:
        """Classify ingredient as critical, important, or replaceable"""
        if self._is_critical_ingredient(ingredient, recipe_category):
            return 'critical'
        
        # Check if it's important (secondary but still significant)
        important_ingredients = [
            'onion', 'garlic', 'tomato', 'cheese', 'milk', 'cream', 'butter', 'oil',
            'salt', 'pepper', 'herbs', 'spices', 'vegetable', 'carrot', 'celery'
        ]
        
        normalized = self._normalize_ingredient(ingredient)
        if any(important in normalized for important in important_ingredients):
            return 'important'
        
        return 'replaceable'
    
    def _get_ingredient_substitution_suggestions(self, ingredient: str, recipe_category: str) -> list:
        """Get substitution suggestions for an ingredient"""
        normalized = self._normalize_ingredient(ingredient)
        
        # Find substitutions for this ingredient from loaded data
        for key, subs in self.ingredient_substitutions.items():
            if key in normalized or normalized in key:
                return subs
        
        return []
    
    def reload_ingredient_data(self):
        """Reload ingredient data from JSON files (useful for updates)"""
        print("Reloading ingredient data from JSON files...")
        self.ingredient_aliases = self._load_ingredient_data("ingredient_aliases.json")
        self.critical_ingredients = self._load_ingredient_data("critical_ingredients.json")
        self.ingredient_substitutions = self._load_ingredient_data("ingredient_substitutions.json")
        print(f"✅ Reloaded: {len(self.ingredient_aliases)} aliases, {len(self.critical_ingredients)} categories, {len(self.ingredient_substitutions)} substitutions")
    
    def _find_similar_recipes_by_name(self, recipe_name: str, limit: int = 20) -> List[Dict[str, Any]]:
        """Find similar recipes by analyzing recipe names and ingredients"""
        if not self.recipe_metadata:
            return []
        
        recipe_name_lower = recipe_name.lower()
        similar_recipes = []
        
        # Extract key words from recipe name
        name_words = set(recipe_name_lower.split())
        
        for recipe in self.recipe_metadata:
            other_name = recipe.get('name', '').lower()
            other_words = set(other_name.split())
            
            # Calculate similarity based on common words
            common_words = name_words.intersection(other_words)
            if len(common_words) > 0:
                similarity_score = len(common_words) / max(len(name_words), len(other_words))
                if similarity_score > 0.3:  # 30% word overlap threshold
                    similar_recipes.append((recipe, similarity_score))
        
        # Sort by similarity and return top matches
        similar_recipes.sort(key=lambda x: x[1], reverse=True)
        return [recipe for recipe, score in similar_recipes[:limit]]
    
    def _analyze_ingredient_criticality(self, recipe_name: str, similar_recipes: List[Dict[str, Any]]) -> Dict[str, str]:
        """Analyze ingredient criticality based on frequency in similar recipes"""
        if not similar_recipes:
            return {}
        
        # Count ingredient frequencies
        ingredient_counts = {}
        total_recipes = len(similar_recipes)
        
        for recipe in similar_recipes:
            ingredients = recipe.get('ingredient_tags', [])
            for ingredient_string in ingredients:
                # Handle the split JSON format - each string is part of a JSON array
                # Remove quotes and brackets, then normalize
                cleaned_ingredient = ingredient_string.strip('[]"')
                if cleaned_ingredient:
                    normalized = self._normalize_ingredient(cleaned_ingredient)
                    if normalized:
                        ingredient_counts[normalized] = ingredient_counts.get(normalized, 0) + 1
        
        # Calculate criticality scores based on frequency
        criticality_scores = {}
        for ingredient, count in ingredient_counts.items():
            frequency = count / total_recipes
            
            if frequency >= 0.8:  # 80%+ = critical
                criticality_scores[ingredient] = 'critical'
            elif frequency >= 0.5:  # 50%+ = important
                criticality_scores[ingredient] = 'important'
            elif frequency >= 0.2:  # 20%+ = optional
                criticality_scores[ingredient] = 'optional'
            else:  # <20% = rare
                criticality_scores[ingredient] = 'rare'
        
        return criticality_scores
    
    def _get_pattern_based_criticality(self, recipe_name: str, ingredient: str) -> str:
        """Get criticality for a specific ingredient using pattern analysis"""
        # Check cache first
        cache_key = f"{recipe_name}_{ingredient}"
        if cache_key in self.ingredient_patterns:
            return self.ingredient_patterns[cache_key]
        
        # Find similar recipes
        similar_recipes = self._find_similar_recipes_by_name(recipe_name, limit=20)
        
        if not similar_recipes:
            return 'optional'  # Default if no similar recipes found
        
        # Analyze ingredient criticality
        criticality_scores = self._analyze_ingredient_criticality(recipe_name, similar_recipes)
        
        # Normalize the ingredient for lookup
        normalized_ingredient = self._normalize_ingredient(ingredient)
        criticality = criticality_scores.get(normalized_ingredient, 'optional')
        
        # Cache the result
        self.ingredient_patterns[cache_key] = criticality
        
        return criticality
    
    async def preload_pattern_analysis(self):
        """Pre-load pattern analysis for common recipes to improve performance"""
        print("Pre-loading pattern analysis...")
        
        # Get unique recipe names
        recipe_names = set(recipe.get('name', '') for recipe in self.recipe_metadata)
        
        # Pre-analyze patterns for each unique recipe name
        for recipe_name in list(recipe_names)[:100]:  # Limit to first 100 for performance
            if recipe_name:
                similar_recipes = self._find_similar_recipes_by_name(recipe_name, limit=20)
                if similar_recipes:
                    criticality_scores = self._analyze_ingredient_criticality(recipe_name, similar_recipes)
                    # Cache all ingredient criticalities for this recipe
                    for ingredient, criticality in criticality_scores.items():
                        cache_key = f"{recipe_name}_{ingredient}"
                        self.ingredient_patterns[cache_key] = criticality
        
        print(f"✅ Pre-loaded patterns for {len(self.ingredient_patterns)} ingredient-recipe combinations")
    
    def _calculate_enhanced_ingredient_match(self, recipe: Dict[str, Any], user_ingredients: List[str]) -> Dict[str, Any]:
        """Enhanced ingredient matching using pattern-based criticality"""
        if not user_ingredients or not recipe.get('ingredient_tags'):
            return {
                "matches": 0,
                "total": len(recipe.get('ingredient_tags', [])),
                "percentage": 0,
                "weighted_percentage": 0,
                "missing": recipe.get('ingredient_tags', []),
                "critical_missing": recipe.get('ingredient_tags', []),
                "important_missing": [],
                "replaceable_missing": [],
                "substitution_suggestions": {},
                "hasAllIngredients": False,
                "hasAllCriticalIngredients": False
            }
        
        # Normalize ingredients
        user_ingredients_normalized = [self._normalize_ingredient(ing) for ing in user_ingredients]
        recipe_tags_normalized = [self._normalize_ingredient(tag) for tag in recipe['ingredient_tags']]
        
        # Categorize missing ingredients by pattern-based criticality
        critical_missing = []
        important_missing = []
        optional_missing = []
        rare_missing = []
        
        matches = 0
        recipe_name = recipe.get('name', '')
        
        for i, recipe_ingredient in enumerate(recipe_tags_normalized):
            original_ingredient = recipe['ingredient_tags'][i]
            
            if self._ingredients_match(recipe_ingredient, user_ingredients_normalized):
                matches += 1
            else:
                # Get pattern-based criticality
                criticality = self._get_pattern_based_criticality(recipe_name, original_ingredient)
                
                if criticality == 'critical':
                    critical_missing.append(original_ingredient)
                elif criticality == 'important':
                    important_missing.append(original_ingredient)
                elif criticality == 'optional':
                    optional_missing.append(original_ingredient)
                else:  # rare
                    rare_missing.append(original_ingredient)
        
        # Combine missing ingredients
        missing = critical_missing + important_missing + optional_missing + rare_missing
        
        # Calculate scores
        total = len(recipe_tags_normalized)
        percentage = (matches / total * 100) if total > 0 else 0
        
        # Enhanced weighted scoring (critical=4, important=3, optional=2, rare=1)
        critical_matches = total - len(critical_missing)
        important_matches = total - len(important_missing) - len(critical_missing)
        optional_matches = total - len(optional_missing) - len(important_missing) - len(critical_missing)
        rare_matches = total - len(missing)
        
        if total > 0:
            max_weighted_score = (len(critical_missing) + critical_matches) * 4 + \
                               (len(important_missing) + important_matches) * 3 + \
                               (len(optional_missing) + optional_matches) * 2 + \
                               (len(rare_missing) + rare_matches) * 1
            
            actual_weighted_score = critical_matches * 4 + important_matches * 3 + optional_matches * 2 + rare_matches * 1
            weighted_score = (actual_weighted_score / max_weighted_score) * 100 if max_weighted_score > 0 else 0
        else:
            weighted_score = 0
        
        # Generate substitution suggestions
        substitution_suggestions = {}
        for ingredient in missing[:5]:
            subs = self._get_ingredient_substitution_suggestions(ingredient, recipe.get('category', ''))
            if subs:
                substitution_suggestions[ingredient] = subs
        
        return {
            "matches": matches,
            "total": total,
            "percentage": round(percentage, 1),
            "weighted_percentage": round(weighted_score, 1),
            "missing": missing,
            "critical_missing": critical_missing,
            "important_missing": important_missing,
            "replaceable_missing": optional_missing + rare_missing,
            "substitution_suggestions": substitution_suggestions,
            "hasAllIngredients": matches == total,
            "hasAllCriticalIngredients": len(critical_missing) == 0
        }
    
    def _has_cached_embeddings(self) -> bool:
        """Check if cached embeddings exist and are valid"""
        required_files = [
            self.faiss_index_file,
            self.metadata_file,
            self.texts_file,
            self.config_file
        ]
        
        # Check if all required files exist
        if not all(f.exists() for f in required_files):
            return False
        
        # Check if config file has valid data
        try:
            with open(self.config_file, 'r') as f:
                config = json.load(f)
            
            # Check if the config has the expected structure
            if not all(key in config for key in ['model_name', 'num_recipes', 'embedding_dim']):
                return False
                
            return True
        except (json.JSONDecodeError, KeyError):
            return False
    
    async def _load_cached_embeddings(self):
        """Load cached embeddings and FAISS index from disk"""
        try:
            # Load metadata and texts
            with open(self.metadata_file, 'r') as f:
                self.recipe_metadata = json.load(f)
            
            with open(self.texts_file, 'r') as f:
                self.recipe_texts = json.load(f)
            
            # Load FAISS index
            self.index = faiss.read_index(str(self.faiss_index_file))
            
            print(f"✅ Loaded {len(self.recipe_metadata)} recipes from cache")
            
        except Exception as e:
            print(f" Error loading cached embeddings: {e}")
            # Fall back to generating new embeddings
            await self._load_recipes()
            await self._create_faiss_index()
            await self._save_embeddings()
    
    async def _save_embeddings(self):
        """Save embeddings and FAISS index to disk"""
        try:
            # Save metadata and texts
            with open(self.metadata_file, 'w') as f:
                json.dump(self.recipe_metadata, f, indent=2)
            
            with open(self.texts_file, 'w') as f:
                json.dump(self.recipe_texts, f, indent=2)
            
            # Save FAISS index
            faiss.write_index(self.index, str(self.faiss_index_file))
            
            # Save configuration
            config = {
                'model_name': 'all-MiniLM-L6-v2',
                'num_recipes': len(self.recipe_metadata),
                'embedding_dim': self.index.d,
                'index_type': 'IndexFlatIP',
                'created_at': pd.Timestamp.now().isoformat()
            }
            
            with open(self.config_file, 'w') as f:
                json.dump(config, f, indent=2)
            
            print(f" Saved embeddings and index to {self.data_dir}")
            
        except Exception as e:
            print(f" Error saving embeddings: {e}")
            raise
