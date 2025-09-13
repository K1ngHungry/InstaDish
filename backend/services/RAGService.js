const fs = require('fs');
const path = require('path');
// Using text-based search with our generated data for now

class RAGService {
  constructor() {
    this.metadata = null;
    this.texts = null;
    this.config = null;
    this.isLoaded = false;
  }

  /**
   * Load the FAISS index and metadata
   */
  async loadIndex() {
    try {
      const dataDir = path.join(__dirname, '../../data/embeddings');
      
      // Check if required files exist
      const requiredFiles = [
        'recipe_metadata.json',
        'recipe_texts.json',
        'index_config.json'
      ];
      
      for (const file of requiredFiles) {
        const filePath = path.join(dataDir, file);
        if (!fs.existsSync(filePath)) {
          throw new Error(`Required file not found: ${filePath}`);
        }
      }
      
      console.log('Loading recipe metadata and texts...');
      
      // Load metadata
      this.metadata = JSON.parse(
        fs.readFileSync(path.join(dataDir, 'recipe_metadata.json'), 'utf8')
      );
      
      // Load texts
      this.texts = JSON.parse(
        fs.readFileSync(path.join(dataDir, 'recipe_texts.json'), 'utf8')
      );
      
      // Load config
      this.config = JSON.parse(
        fs.readFileSync(path.join(dataDir, 'index_config.json'), 'utf8')
      );
      
      this.isLoaded = true;
      
      console.log(`✅ RAG Service loaded successfully!`);
      console.log(`📊 Index contains ${this.metadata.length} recipes`);
      console.log(`⚙️ Using text-based search with ${this.config.index_type} embeddings`);
      
      return true;
      
    } catch (error) {
      console.error('❌ Error loading RAG index:', error);
      this.isLoaded = false;
      return false;
    }
  }

  /**
   * Check if the RAG service is ready
   */
  isReady() {
    return this.isLoaded && this.metadata;
  }

  /**
   * Search for similar recipes based on query
   * Note: This is a simplified search since we don't have the embedding model in Node.js
   * In production, you'd want to load the sentence transformer model here
   */
  async searchRecipes(query, k = 5) {
    if (!this.isReady()) {
      throw new Error('RAG service not loaded. Call loadIndex() first.');
    }

    try {
      // Use text-based search for now
      const results = this._textBasedSearch(query, k);
      return results;
      
    } catch (error) {
      console.error('Error searching recipes:', error);
      throw error;
    }
  }

  /**
   * Text-based search as fallback
   */
  _textBasedSearch(query, k) {
    const queryLower = query.toLowerCase();
    const results = [];

    for (let i = 0; i < this.metadata.length; i++) {
      const recipe = this.metadata[i];
      const text = this.texts[i];

      let score = 0;
      
      // Score based on name match
      if (recipe.name.toLowerCase().includes(queryLower)) {
        score += 10;
      }
      
      // Score based on ingredient matches
      const ingredientMatches = recipe.ingredients.filter(ing => 
        ing.toLowerCase().includes(queryLower)
      ).length;
      score += ingredientMatches * 3;
      
      // Score based on ingredient tags
      const tagMatches = recipe.ingredient_tags.filter(tag => 
        tag.toLowerCase().includes(queryLower)
      ).length;
      score += tagMatches * 2;
      
      // Score based on instruction matches
      const instructionMatches = recipe.instructions.filter(inst => 
        inst.toLowerCase().includes(queryLower)
      ).length;
      score += instructionMatches;
      
      // Score based on word matches in text
      const queryWords = queryLower.split(' ');
      const textWords = text.toLowerCase().split(' ');
      const wordMatches = queryWords.filter(word => 
        textWords.some(textWord => textWord.includes(word))
      ).length;
      score += wordMatches;

      if (score > 0) {
        results.push({
          recipe: recipe,
          score: score,
          text: text
        });
      }
    }

    // Sort by score and return top k
    results.sort((a, b) => b.score - a.score);
    return results.slice(0, k);
  }

  /**
   * Get recipe by ID
   */
  getRecipeById(id) {
    if (!this.isReady()) {
      return null;
    }
    return this.metadata.find(recipe => recipe.id === parseInt(id));
  }

  /**
   * Get all recipes
   */
  getAllRecipes() {
    if (!this.isReady()) {
      return [];
    }
    return this.metadata;
  }

  /**
   * Get unique categories from recipes
   */
  getCategories() {
    if (!this.isReady()) {
      return [];
    }
    
    const categories = new Set();
    this.metadata.forEach(recipe => {
      // Extract category from recipe name or create a simple one
      const name = recipe.name.toLowerCase();
      if (name.includes('pasta') || name.includes('spaghetti')) {
        categories.add('Italian');
      } else if (name.includes('curry') || name.includes('indian')) {
        categories.add('Indian');
      } else if (name.includes('chinese') || name.includes('stir fry')) {
        categories.add('Chinese');
      } else if (name.includes('mexican') || name.includes('taco') || name.includes('burrito')) {
        categories.add('Mexican');
      } else if (name.includes('cake') || name.includes('dessert') || name.includes('cookie')) {
        categories.add('Dessert');
      } else if (name.includes('salad')) {
        categories.add('Salad');
      } else if (name.includes('soup')) {
        categories.add('Soup');
      } else if (name.includes('bread') || name.includes('roll')) {
        categories.add('Bread');
      } else {
        categories.add('Other');
      }
    });
    
    return Array.from(categories);
  }

  /**
   * Get statistics about the loaded data
   */
  getStats() {
    if (!this.isReady()) {
      return { totalRecipes: 0, categories: 0 };
    }
    
    return {
      totalRecipes: this.metadata.length,
      categories: this.getCategories().length,
      indexType: this.config.index_type,
      modelName: this.config.model_name
    };
  }
}

module.exports = new RAGService();
