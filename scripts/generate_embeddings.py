#!/usr/bin/env python3
"""
InstaDish RAG Embedding Generator
Generates vector embeddings for recipe data from CSV using sentence-transformers and FAISS
"""

import json
import numpy as np
import faiss
import pandas as pd
from sentence_transformers import SentenceTransformer
import os
from pathlib import Path
import ast
import re
import argparse

class RecipeEmbeddingGenerator:
    def __init__(self, model_name='all-MiniLM-L6-v2'):
        """
        Initialize the embedding generator
        
        Args:
            model_name: Sentence transformer model to use for embeddings
        """
        self.model_name = model_name
        print(f"Loading sentence transformer model: {model_name}")
        self.model = SentenceTransformer(model_name)
        self.embedding_dim = self.model.get_sentence_embedding_dimension()
        print(f"Model loaded successfully. Embedding dimension: {self.embedding_dim}")
        
    def load_recipe_data(self, csv_file_path):
        """
        Load recipe data from CSV file
        
        Args:
            csv_file_path: Path to the recipes CSV file
        """
        print(f"Loading recipe data from {csv_file_path}...")
        
        # Read CSV file
        df = pd.read_csv(csv_file_path, header=None, names=['name', 'ingredients', 'instructions', 'ingredient_tags'])
        
        recipes = []
        for idx, row in df.iterrows():
            try:
                # Parse the recipe data
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
        
        Args:
            idx: Row index
            row: Pandas row data
            
        Returns:
            dict: Parsed recipe data
        """
        try:
            # Clean and parse recipe name
            name = str(row['name']).strip()
            if not name or name == 'nan':
                return None
            
            # Parse ingredients (JSON array)
            ingredients_raw = str(row['ingredients'])
            ingredients = self._parse_json_array(ingredients_raw)
            
            # Parse instructions (JSON array)
            instructions_raw = str(row['instructions'])
            instructions = self._parse_json_array(instructions_raw)
            
            # Parse ingredient tags (JSON array)
            ingredient_tags_raw = str(row['ingredient_tags'])
            ingredient_tags = self._parse_json_array(ingredient_tags_raw)
            
            recipe = {
                'id': idx + 1,
                'name': name,
                'ingredients': ingredients,
                'instructions': instructions,
                'ingredient_tags': ingredient_tags,
                'ingredient_count': len(ingredients),
                'instruction_count': len(instructions)
            }
            
            return recipe
            
        except Exception as e:
            print(f"Error parsing recipe row {idx}: {e}")
            return None
    
    def _parse_json_array(self, json_str):
        """
        Parse JSON array string, handling various formats
        
        Args:
            json_str: JSON array as string
            
        Returns:
            list: Parsed array
        """
        if not json_str or json_str == 'nan':
            return []
        
        try:
            # Try to parse as JSON first
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
    
    def create_recipe_text(self, recipe):
        """
        Create a comprehensive text representation of a recipe for embedding
        
        Args:
            recipe: Recipe dictionary
            
        Returns:
            str: Combined text representation
        """
        # Combine name, ingredients, instructions, and tags
        text_parts = [
            f"Recipe: {recipe['name']}",
            f"Ingredients: {', '.join(recipe['ingredients'])}",
            f"Instructions: {' '.join(recipe['instructions'])}",
            f"Ingredient Tags: {', '.join(recipe['ingredient_tags'])}"
        ]
        
        return " | ".join(text_parts)
    
    def generate_embeddings(self, recipes):
        """
        Generate embeddings for all recipes
        
        Args:
            recipes: List of recipe dictionaries
            
        Returns:
            tuple: (embeddings, recipe_texts, recipe_metadata)
        """
        recipe_texts = []
        recipe_metadata = []
        
        print(f"Generating embeddings for {len(recipes)} recipes...")
        
        for i, recipe in enumerate(recipes):
            recipe_text = self.create_recipe_text(recipe)
            recipe_texts.append(recipe_text)
            recipe_metadata.append({
                'id': recipe['id'],
                'name': recipe['name'],
                'ingredients': recipe['ingredients'],
                'instructions': recipe['instructions'],
                'ingredient_tags': recipe['ingredient_tags'],
                'ingredient_count': recipe['ingredient_count'],
                'instruction_count': recipe['instruction_count']
            })
            
            if (i + 1) % 100 == 0:
                print(f"Processed {i + 1}/{len(recipes)} recipes...")
        
        # Generate embeddings in batches to manage memory
        print("Generating vector embeddings...")
        batch_size = 32
        embeddings_list = []
        
        for i in range(0, len(recipe_texts), batch_size):
            batch = recipe_texts[i:i + batch_size]
            batch_embeddings = self.model.encode(batch, show_progress_bar=False)
            embeddings_list.append(batch_embeddings)
            print(f"Processed batch {i//batch_size + 1}/{(len(recipe_texts) + batch_size - 1)//batch_size}")
        
        # Concatenate all embeddings
        embeddings = np.vstack(embeddings_list)
        
        return embeddings, recipe_texts, recipe_metadata
    
    def create_faiss_index(self, embeddings):
        """
        Create FAISS index from embeddings
        
        Args:
            embeddings: numpy array of embeddings
            
        Returns:
            faiss.Index: FAISS index
        """
        print("Creating FAISS index...")
        
        # For larger datasets, use IndexIVFFlat for better performance
        if len(embeddings) > 1000:
            # Create quantizer
            quantizer = faiss.IndexFlatIP(self.embedding_dim)
            
            # Create IVF index with 100 clusters
            nlist = min(100, len(embeddings) // 10)
            index = faiss.IndexIVFFlat(quantizer, self.embedding_dim, nlist)
            
            # Normalize embeddings for cosine similarity
            faiss.normalize_L2(embeddings)
            
            # Train the index
            print("Training FAISS index...")
            index.train(embeddings.astype('float32'))
            
            # Add embeddings to index
            index.add(embeddings.astype('float32'))
            
            # Set search parameters
            index.nprobe = 10  # Search in 10 clusters
            
        else:
            # For smaller datasets, use simple flat index
            index = faiss.IndexFlatIP(self.embedding_dim)
            
            # Normalize embeddings for cosine similarity
            faiss.normalize_L2(embeddings)
            
            # Add embeddings to index
            index.add(embeddings.astype('float32'))
        
        return index
    
    def save_embeddings(self, embeddings, recipe_metadata, recipe_texts, output_dir):
        """
        Save embeddings and metadata to files
        
        Args:
            embeddings: numpy array of embeddings
            recipe_metadata: List of recipe metadata
            recipe_texts: List of recipe text representations
            output_dir: Directory to save files
        """
        output_dir = Path(output_dir)
        output_dir.mkdir(parents=True, exist_ok=True)
        
        print(f"Saving embeddings and metadata to {output_dir}...")
        
        # Save embeddings as numpy array
        np.save(output_dir / 'recipe_embeddings.npy', embeddings)
        
        # Save recipe metadata as JSON
        with open(output_dir / 'recipe_metadata.json', 'w', encoding='utf-8') as f:
            json.dump(recipe_metadata, f, indent=2, ensure_ascii=False)
        
        # Save recipe texts
        with open(output_dir / 'recipe_texts.json', 'w', encoding='utf-8') as f:
            json.dump(recipe_texts, f, indent=2, ensure_ascii=False)
        
        # Save FAISS index
        index = self.create_faiss_index(embeddings)
        faiss.write_index(index, str(output_dir / 'recipe_index.faiss'))
        
        # Save index configuration
        index_config = {
            'model_name': self.model_name,
            'embedding_dim': self.embedding_dim,
            'num_recipes': len(embeddings),
            'index_type': 'IndexIVFFlat' if len(embeddings) > 1000 else 'IndexFlatIP',
            'nlist': min(100, len(embeddings) // 10) if len(embeddings) > 1000 else None,
            'nprobe': 10 if len(embeddings) > 1000 else None
        }
        
        with open(output_dir / 'index_config.json', 'w', encoding='utf-8') as f:
            json.dump(index_config, f, indent=2)
        
        # Create docstore.json for LangChain compatibility
        self.create_langchain_docstore(recipe_metadata, recipe_texts, output_dir)
        
        # Create index.pkl for LangChain compatibility
        self.create_langchain_index_pkl(index, output_dir)
        
        print(f"Saved embeddings and metadata to {output_dir}")
        print(f"Embedding shape: {embeddings.shape}")
        print(f"FAISS index size: {index.ntotal} vectors")
        print(f"Index type: {index_config['index_type']}")
    
    def create_langchain_docstore(self, recipe_metadata, recipe_texts, output_dir):
        """
        Create docstore.json file for LangChain compatibility
        
        Args:
            recipe_metadata: List of recipe metadata
            recipe_texts: List of recipe text representations
            output_dir: Directory to save files
        """
        output_dir = Path(output_dir)
        
        # Create docstore in LangChain format
        docstore = {}
        
        for i, (metadata, text) in enumerate(zip(recipe_metadata, recipe_texts)):
            doc_id = str(i)
            docstore[doc_id] = {
                "page_content": text,
                "metadata": metadata
            }
        
        # Save docstore.json
        with open(output_dir / 'docstore.json', 'w', encoding='utf-8') as f:
            json.dump(docstore, f, indent=2, ensure_ascii=False)
        
        print(f"Created docstore.json with {len(docstore)} documents")
    
    def create_langchain_index_pkl(self, index, output_dir):
        """
        Create index.pkl file for LangChain compatibility
        
        Args:
            index: FAISS index
            output_dir: Directory to save files
        """
        import pickle
        
        output_dir = Path(output_dir)
        
        # Create index.pkl with the FAISS index
        with open(output_dir / 'index.pkl', 'wb') as f:
            pickle.dump(index, f)
        
        print(f"Created index.pkl with FAISS index")
    
    def process_recipes(self, csv_file_path, output_dir):
        """
        Complete pipeline to process recipes and generate embeddings
        
        Args:
            csv_file_path: Path to CSV file
            output_dir: Directory to save outputs
        """
        print("=" * 60)
        print("InstaDish RAG Embedding Generator")
        print("=" * 60)
        
        # Load recipe data
        recipes = self.load_recipe_data(csv_file_path)
        
        if not recipes:
            print("No recipes found in CSV file!")
            return None, None, None
        
        print(f"Loaded {len(recipes)} recipes")
        
        # Generate embeddings
        embeddings, recipe_texts, recipe_metadata = self.generate_embeddings(recipes)
        
        # Save everything
        self.save_embeddings(embeddings, recipe_metadata, recipe_texts, output_dir)
        
        print("\nEmbedding generation complete!")
        return embeddings, recipe_metadata, recipe_texts

def main():
    """Main function to run the embedding generation"""
    
    parser = argparse.ArgumentParser(description='Generate embeddings for InstaDish recipes')
    parser.add_argument('--csv', type=str, help='Path to CSV file', default='../recipes_small.csv')
    parser.add_argument('--output', type=str, help='Output directory', default='../data/embeddings')
    parser.add_argument('--model', type=str, help='Sentence transformer model', default='all-MiniLM-L6-v2')
    
    args = parser.parse_args()
    
    # Paths
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    csv_file = project_root / args.csv
    output_dir = project_root / args.output
    
    print(f"Recipe CSV file: {csv_file}")
    print(f"Output directory: {output_dir}")
    print(f"Model: {args.model}")
    print()
    
    # Check if CSV file exists
    if not csv_file.exists():
        print(f"Error: CSV file not found at {csv_file}")
        return
    
    # Initialize generator
    generator = RecipeEmbeddingGenerator(args.model)
    
    # Process recipes
    try:
        generator.process_recipes(csv_file, output_dir)
        print("\nEmbedding generation completed successfully!")
        print(f"Files saved to: {output_dir}")
        print("Generated files:")
        print("  - recipe_embeddings.npy (vector embeddings)")
        print("  - recipe_metadata.json (recipe information)")
        print("  - recipe_texts.json (text representations)")
        print("  - recipe_index.faiss (FAISS index)")
        print("  - index_config.json (index configuration)")
        
    except Exception as e:
        print(f"Error during embedding generation: {e}")
        raise

if __name__ == "__main__":
    main()