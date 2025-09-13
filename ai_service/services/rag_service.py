import os
import json
import pandas as pd
import numpy as np
import faiss
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
        
    async def initialize(self):
        """Initialize the RAG service with FAISS index and embeddings"""
        print("🔄 Loading sentence transformer model...")
        
        # Load sentence transformer model
        self.model = SentenceTransformer('all-MiniLM-L6-v2')
        print("✅ Sentence transformer model loaded")
        
        # Check if we have cached embeddings
        if self._has_cached_embeddings():
            print("🔄 Loading cached embeddings and FAISS index...")
            await self._load_cached_embeddings()
            print(f"✅ RAG service ready with {len(self.recipe_metadata)} recipes (cached)")
        else:
            print("🔄 No cached embeddings found, generating new ones...")
            # Load recipes from CSV
            print("🔄 Loading recipes from CSV...")
            await self._load_recipes()
            
            # Generate embeddings and create FAISS index
            print("🔄 Generating embeddings and creating FAISS index...")
            await self._create_faiss_index()
            
            # Save embeddings to disk
            print("🔄 Saving embeddings to disk...")
            await self._save_embeddings()
            
            print(f"✅ RAG service ready with {len(self.recipe_metadata)} recipes (new)")
        
    async def _load_recipes(self):
        """Load recipes from CSV file"""
        csv_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '..', 'recipes_small.csv')
        
        if not os.path.exists(csv_path):
            raise FileNotFoundError(f"CSV file not found at {csv_path}")
        
        # Read CSV without headers
        df = pd.read_csv(csv_path, header=None, names=['Recipe Name', 'Ingredients', 'Instructions', 'Ingredient List'])
        
        self.recipe_metadata = []
        self.recipe_texts = []
        
        for idx, row in df.iterrows():
            recipe_id = idx + 1
            
            # Parse ingredients
            ingredients = []
            if pd.notna(row['Ingredients']):
                ingredients = [ing.strip() for ing in str(row['Ingredients']).split(',') if ing.strip()]
            
            # Parse instructions
            instructions = []
            if pd.notna(row['Instructions']):
                instructions = [inst.strip() for inst in str(row['Instructions']).split('.') if inst.strip()]
            
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
        
        print(f"📊 Loaded {len(self.recipe_metadata)} recipes")
        
    async def _create_faiss_index(self):
        """Create FAISS index from recipe texts"""
        # Generate embeddings
        print("🔄 Generating embeddings...")
        embeddings = await self._generate_embeddings(self.recipe_texts)
        
        # Create FAISS index
        dimension = embeddings.shape[1]
        self.index = faiss.IndexFlatIP(dimension)  # Inner product for cosine similarity
        
        # Normalize embeddings for cosine similarity
        faiss.normalize_L2(embeddings)
        
        # Add embeddings to index
        self.index.add(embeddings.astype('float32'))
        
        print(f"✅ FAISS index created with {self.index.ntotal} vectors")
        
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
        
        # Search FAISS index
        scores, indices = self.index.search(query_embedding, min(limit * 2, len(self.recipe_metadata)))
        
        # Get results and calculate ingredient matches
        results = []
        for score, idx in zip(scores[0], indices[0]):
            if idx == -1:  # Invalid index
                continue
                
            recipe = self.recipe_metadata[idx].copy()
            
            # Calculate ingredient match
            match_info = self._calculate_ingredient_match(recipe, user_ingredients or [])
            recipe['match'] = match_info
            
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
        
        user_ingredients_lower = [ing.lower().strip() for ing in user_ingredients]
        recipe_tags_lower = [tag.lower().strip() for tag in recipe['ingredient_tags']]
        
        matches = 0
        missing = []
        
        for tag in recipe_tags_lower:
            if any(user_ing in tag or tag in user_ing for user_ing in user_ingredients_lower):
                matches += 1
            else:
                missing.append(tag)
        
        total = len(recipe_tags_lower)
        percentage = (matches / total * 100) if total > 0 else 0
        
        return {
            "matches": matches,
            "total": total,
            "percentage": round(percentage, 1),
            "missing": missing,
            "hasAllIngredients": matches == total
        }
        
    def _determine_category(self, ingredients: List[str]) -> str:
        """Determine recipe category based on ingredients"""
        if not ingredients:
            return "Other"
            
        ingredients_lower = ' '.join(ingredients).lower()
        
        if any(word in ingredients_lower for word in ['chicken', 'beef', 'pork', 'lamb', 'turkey']):
            return "Main Course"
        elif any(word in ingredients_lower for word in ['cake', 'cookie', 'pie', 'dessert', 'sugar', 'chocolate']):
            return "Dessert"
        elif any(word in ingredients_lower for word in ['soup', 'broth', 'stock']):
            return "Soup"
        elif any(word in ingredients_lower for word in ['salad', 'lettuce', 'spinach']):
            return "Salad"
        elif any(word in ingredients_lower for word in ['bread', 'pasta', 'rice', 'noodle']):
            return "Side Dish"
        elif any(word in ingredients_lower for word in ['sauce', 'dressing', 'marinade']):
            return "Sauce"
        else:
            return "Main Course"
            
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
    
    async def get_all_recipes(self) -> List[Dict[str, Any]]:
        """Get all recipes"""
        return self.recipe_metadata.copy()
    
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
    
    def _has_cached_embeddings(self) -> bool:
        """Check if cached embeddings exist and are valid"""
        required_files = [
            self.embeddings_file,
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
                
            # Check if the number of recipes matches (we'll validate this after loading)
            # For now, just check if the config is valid
                
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
            print(f"❌ Error loading cached embeddings: {e}")
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
            
            print(f"✅ Saved embeddings and index to {self.data_dir}")
            
        except Exception as e:
            print(f"❌ Error saving embeddings: {e}")
            raise
