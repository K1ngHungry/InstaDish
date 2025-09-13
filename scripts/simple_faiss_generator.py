#!/usr/bin/env python3
"""
Simple FAISS index generator for InstaDish
Creates a FAISS index that can be loaded by faiss-node
"""

import pandas as pd
import numpy as np
import json
import faiss
from sentence_transformers import SentenceTransformer
from pathlib import Path
import argparse

class SimpleFAISSGenerator:
    def __init__(self, model_name='all-MiniLM-L6-v2'):
        self.model_name = model_name
        self.model = SentenceTransformer(model_name)
        self.embedding_dim = self.model.get_sentence_embedding_dimension()
        print(f"Model loaded: {model_name}, embedding dimension: {self.embedding_dim}")
    
    def load_recipes(self, csv_path):
        """Load recipes from CSV file"""
        print(f"Loading recipes from {csv_path}...")
        # Read CSV without headers
        df = pd.read_csv(csv_path, header=None, names=['Recipe Name', 'Ingredients', 'Instructions', 'Ingredient List'])
        
        recipes = []
        for idx, row in df.iterrows():
            try:
                # Parse JSON columns
                ingredients = json.loads(row['Ingredients']) if isinstance(row['Ingredients'], str) else row['Ingredients']
                instructions = json.loads(row['Instructions']) if isinstance(row['Instructions'], str) else row['Instructions']
                ingredient_tags = json.loads(row['Ingredient List']) if isinstance(row['Ingredient List'], str) else row['Ingredient List']
                
                recipe = {
                    'id': idx,
                    'name': row['Recipe Name'].strip(),
                    'ingredients': ingredients,
                    'instructions': instructions,
                    'ingredient_tags': ingredient_tags
                }
                recipes.append(recipe)
                
            except Exception as e:
                print(f"Error parsing recipe {idx}: {e}")
                continue
        
        print(f"Loaded {len(recipes)} recipes")
        return recipes
    
    def create_recipe_text(self, recipe):
        """Create searchable text for a recipe"""
        # Combine name, ingredients, and instructions
        text_parts = [
            recipe['name'],
            ' '.join(recipe['ingredients']),
            ' '.join(recipe['instructions']),
            ' '.join(recipe['ingredient_tags'])
        ]
        return ' '.join(text_parts)
    
    def generate_embeddings(self, recipes):
        """Generate embeddings for all recipes"""
        print("Generating embeddings...")
        
        texts = []
        metadata = []
        
        for recipe in recipes:
            text = self.create_recipe_text(recipe)
            texts.append(text)
            metadata.append(recipe)
        
        # Generate embeddings in batches
        batch_size = 32
        embeddings = []
        
        for i in range(0, len(texts), batch_size):
            batch_texts = texts[i:i + batch_size]
            batch_embeddings = self.model.encode(batch_texts, convert_to_numpy=True)
            embeddings.append(batch_embeddings)
            print(f"Processed batch {i//batch_size + 1}/{(len(texts) + batch_size - 1)//batch_size}")
        
        embeddings = np.vstack(embeddings)
        print(f"Generated embeddings shape: {embeddings.shape}")
        
        return embeddings, texts, metadata
    
    def create_faiss_index(self, embeddings):
        """Create FAISS index"""
        print("Creating FAISS index...")
        
        # Normalize embeddings for cosine similarity
        faiss.normalize_L2(embeddings)
        
        # Create index
        if len(embeddings) > 1000:
            # Use IVF index for large datasets
            nlist = min(100, len(embeddings) // 10)
            quantizer = faiss.IndexFlatIP(self.embedding_dim)
            index = faiss.IndexIVFFlat(quantizer, self.embedding_dim, nlist)
            
            # Train the index
            print("Training FAISS index...")
            index.train(embeddings)
        else:
            # Use flat index for small datasets
            index = faiss.IndexFlatIP(self.embedding_dim)
        
        # Add vectors to index
        index.add(embeddings)
        
        print(f"FAISS index created with {index.ntotal} vectors")
        return index
    
    def save_index(self, index, metadata, texts, output_dir):
        """Save FAISS index and metadata"""
        output_dir = Path(output_dir)
        output_dir.mkdir(parents=True, exist_ok=True)
        
        print(f"Saving to {output_dir}...")
        
        # Save FAISS index (LangChain expects this name)
        faiss.write_index(index, str(output_dir / 'faiss.index'))
        
        # Create docstore for LangChain
        docstore = {}
        for i, (meta, text) in enumerate(zip(metadata, texts)):
            doc_id = str(i)
            docstore[doc_id] = {
                "page_content": text,
                "metadata": meta
            }
        
        # Save docstore
        with open(output_dir / 'docstore.json', 'w') as f:
            json.dump(docstore, f, indent=2)
        
        # Save metadata (for our own use)
        with open(output_dir / 'recipe_metadata.json', 'w') as f:
            json.dump(metadata, f, indent=2)
        
        # Save texts (for our own use)
        with open(output_dir / 'recipe_texts.json', 'w') as f:
            json.dump(texts, f, indent=2)
        
        # Save config
        config = {
            'model_name': self.model_name,
            'embedding_dim': self.embedding_dim,
            'num_recipes': len(metadata),
            'index_type': 'IndexIVFFlat' if len(metadata) > 1000 else 'IndexFlatIP'
        }
        
        with open(output_dir / 'index_config.json', 'w') as f:
            json.dump(config, f, indent=2)
        
        print("Files saved:")
        print("  - faiss.index (for LangChain)")
        print("  - docstore.json (for LangChain)")
        print("  - recipe_metadata.json")
        print("  - recipe_texts.json")
        print("  - index_config.json")

def main():
    parser = argparse.ArgumentParser(description='Generate FAISS index for InstaDish recipes')
    parser.add_argument('--csv', type=str, help='Path to CSV file', default='../recipes_small.csv')
    parser.add_argument('--output', type=str, help='Output directory', default='../data/embeddings')
    parser.add_argument('--model', type=str, help='Sentence transformer model', default='all-MiniLM-L6-v2')
    
    args = parser.parse_args()
    
    # Paths
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    csv_file = project_root / args.csv
    output_dir = project_root / args.output
    
    print(f"CSV file: {csv_file}")
    print(f"Output directory: {output_dir}")
    print(f"Model: {args.model}")
    print()
    
    if not csv_file.exists():
        print(f"Error: CSV file not found at {csv_file}")
        return
    
    # Generate index
    generator = SimpleFAISSGenerator(args.model)
    recipes = generator.load_recipes(csv_file)
    
    if not recipes:
        print("No recipes found!")
        return
    
    embeddings, texts, metadata = generator.generate_embeddings(recipes)
    index = generator.create_faiss_index(embeddings)
    generator.save_index(index, metadata, texts, output_dir)
    
    print("\n✅ FAISS index generation completed!")

if __name__ == "__main__":
    main()
