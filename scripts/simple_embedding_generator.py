#!/usr/bin/env python3
"""
Simple InstaDish Recipe Data Processor
Creates a basic search index from CSV data without heavy ML dependencies
"""

import json
import csv
import os
from pathlib import Path
import re

class SimpleRecipeProcessor:
    def __init__(self):
        self.recipes = []
        
    def load_recipe_data(self, csv_file_path):
        """
        Load recipe data from CSV file
        """
        print(f"Loading recipe data from {csv_file_path}...")
        
        recipes = []
        with open(csv_file_path, 'r', encoding='utf-8') as f:
            # Read CSV without header
            reader = csv.reader(f)
            
            for idx, row in enumerate(reader):
                if len(row) < 4:
                    continue
                    
                try:
                    recipe = self._parse_recipe_row(idx, row)
                    if recipe:
                        recipes.append(recipe)
                except Exception as e:
                    print(f"Error parsing recipe at row {idx}: {e}")
                    continue
        
        print(f"Successfully loaded {len(recipes)} recipes")
        return recipes
    
    def _parse_recipe_row(self, idx, row):
        """
        Parse a single recipe row from CSV
        """
        try:
            # Clean and parse recipe name
            name = str(row[0]).strip()
            if not name or name == 'nan':
                return None
            
            # Parse ingredients (JSON array)
            ingredients_raw = str(row[1])
            ingredients = self._parse_json_array(ingredients_raw)
            
            # Parse instructions (JSON array)
            instructions_raw = str(row[2])
            instructions = self._parse_json_array(instructions_raw)
            
            # Parse ingredient tags (JSON array)
            ingredient_tags_raw = str(row[3])
            ingredient_tags = self._parse_json_array(ingredient_tags_raw)
            
            recipe = {
                'id': idx + 1,
                'name': name,
                'ingredients': ingredients,
                'instructions': instructions,
                'ingredient_tags': ingredient_tags,
                'ingredient_count': len(ingredients),
                'instruction_count': len(instructions),
                'search_text': self._create_search_text(name, ingredients, instructions, ingredient_tags)
            }
            
            return recipe
            
        except Exception as e:
            print(f"Error parsing recipe row {idx}: {e}")
            return None
    
    def _parse_json_array(self, json_str):
        """
        Parse JSON array string, handling various formats
        """
        if not json_str or json_str == 'nan':
            return []
        
        try:
            # Try to parse as JSON first
            import ast
            return ast.literal_eval(json_str)
        except:
            try:
                # Try to parse with json module
                return json.loads(json_str)
            except:
                # Fallback: try to extract array-like content
                # Remove outer brackets and split by quotes
                cleaned = json_str.strip('[]')
                if cleaned:
                    # Split by quotes and filter out empty strings
                    items = [item.strip('"').strip() for item in cleaned.split('"') if item.strip()]
                    return items
                return []
    
    def _create_search_text(self, name, ingredients, instructions, ingredient_tags):
        """
        Create searchable text for the recipe
        """
        text_parts = [
            name,
            ' '.join(ingredients),
            ' '.join(instructions),
            ' '.join(ingredient_tags)
        ]
        return ' '.join(text_parts).lower()
    
    def create_search_index(self, recipes):
        """
        Create a simple search index
        """
        print("Creating search index...")
        
        # Create word-based index
        word_index = {}
        recipe_index = {}
        
        for recipe in recipes:
            recipe_id = recipe['id']
            recipe_index[recipe_id] = recipe
            
            # Index words from search text
            words = re.findall(r'\b\w+\b', recipe['search_text'])
            for word in words:
                if len(word) > 2:  # Ignore short words
                    if word not in word_index:
                        word_index[word] = []
                    word_index[word].append(recipe_id)
        
        return {
            'word_index': word_index,
            'recipe_index': recipe_index,
            'total_recipes': len(recipes)
        }
    
    def save_data(self, recipes, search_index, output_dir):
        """
        Save recipes and search index to files
        """
        output_dir = Path(output_dir)
        output_dir.mkdir(parents=True, exist_ok=True)
        
        print(f"Saving data to {output_dir}...")
        
        # Save recipe metadata
        with open(output_dir / 'recipe_metadata.json', 'w', encoding='utf-8') as f:
            json.dump(recipes, f, indent=2, ensure_ascii=False)
        
        # Save search index
        with open(output_dir / 'search_index.json', 'w', encoding='utf-8') as f:
            json.dump(search_index, f, indent=2, ensure_ascii=False)
        
        # Save index configuration
        index_config = {
            'type': 'simple_word_index',
            'total_recipes': len(recipes),
            'total_words': len(search_index['word_index']),
            'description': 'Simple word-based search index for recipe data'
        }
        
        with open(output_dir / 'index_config.json', 'w', encoding='utf-8') as f:
            json.dump(index_config, f, indent=2)
        
        print(f"✅ Saved data to {output_dir}")
        print(f"📊 Total recipes: {len(recipes)}")
        print(f"🔍 Total indexed words: {len(search_index['word_index'])}")
    
    def process_recipes(self, csv_file_path, output_dir):
        """
        Complete pipeline to process recipes
        """
        print("=" * 60)
        print("InstaDish Simple Recipe Processor")
        print("=" * 60)
        
        # Load recipe data
        recipes = self.load_recipe_data(csv_file_path)
        
        if not recipes:
            print("❌ No recipes found in CSV file!")
            return None, None
        
        print(f"✅ Loaded {len(recipes)} recipes")
        
        # Create search index
        search_index = self.create_search_index(recipes)
        
        # Save everything
        self.save_data(recipes, search_index, output_dir)
        
        print("\n🎉 Recipe processing complete!")
        return recipes, search_index

def main():
    """Main function to run the recipe processing"""
    
    # Paths
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    csv_file = project_root / 'recipes_small.csv'
    output_dir = project_root / 'data' / 'embeddings'
    
    print(f"📁 Recipe CSV file: {csv_file}")
    print(f"📁 Output directory: {output_dir}")
    print()
    
    # Check if CSV file exists
    if not csv_file.exists():
        print(f"❌ Error: CSV file not found at {csv_file}")
        return
    
    # Initialize processor
    processor = SimpleRecipeProcessor()
    
    # Process recipes
    try:
        processor.process_recipes(csv_file, output_dir)
        print("\n✅ Recipe processing completed successfully!")
        print(f"📁 Files saved to: {output_dir}")
        print("📋 Generated files:")
        print("  - recipe_metadata.json (recipe information)")
        print("  - search_index.json (word-based search index)")
        print("  - index_config.json (index configuration)")
        
    except Exception as e:
        print(f"❌ Error during recipe processing: {e}")
        raise

if __name__ == "__main__":
    main()

