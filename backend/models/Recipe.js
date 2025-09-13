const ragService = require('../services/RAGService');

class Recipe {
  constructor(id, name, ingredients, instructions, ingredientTags) {
    this.id = id;
    this.name = name;
    this.ingredients = ingredients;
    this.instructions = instructions;
    this.ingredientTags = ingredientTags;
    this.category = this._determineCategory();
    this.prepTime = this._estimatePrepTime();
    this.cookTime = this._estimateCookTime();
    this.difficulty = this._estimateDifficulty();
  }

  /**
   * Determine category based on recipe name and ingredients
   */
  _determineCategory() {
    const name = this.name.toLowerCase();
    const ingredients = this.ingredients.join(' ').toLowerCase();
    
    if (name.includes('italian') || name.includes('pasta') || name.includes('risotto') || ingredients.includes('pasta')) {
      return 'Italian';
    }
    if (name.includes('chinese') || name.includes('stir fry') || name.includes('asian') || ingredients.includes('soy sauce')) {
      return 'Asian';
    }
    if (name.includes('mexican') || name.includes('taco') || name.includes('salsa') || ingredients.includes('tortilla')) {
      return 'Mexican';
    }
    if (name.includes('indian') || name.includes('curry') || name.includes('masala') || ingredients.includes('curry')) {
      return 'Indian';
    }
    if (name.includes('french') || name.includes('quiche') || name.includes('ratatouille')) {
      return 'French';
    }
    if (name.includes('southern') || name.includes('biscuit') || name.includes('grits')) {
      return 'Southern';
    }
    if (name.includes('breakfast') || name.includes('pancake') || name.includes('waffle') || name.includes('omelet')) {
      return 'Breakfast';
    }
    if (name.includes('dessert') || name.includes('cake') || name.includes('cookie') || name.includes('pie')) {
      return 'Dessert';
    }
    if (name.includes('soup') || name.includes('stew') || name.includes('chowder')) {
      return 'Soup';
    }
    if (name.includes('salad') || name.includes('dressing')) {
      return 'Salad';
    }
    
    return 'Main Course';
  }

  /**
   * Estimate prep time based on ingredient count and complexity
   */
  _estimatePrepTime() {
    const ingredientCount = this.ingredients.length;
    const instructionCount = this.instructions.length;
    
    if (ingredientCount <= 3 && instructionCount <= 2) {
      return '5 min';
    } else if (ingredientCount <= 6 && instructionCount <= 4) {
      return '10 min';
    } else if (ingredientCount <= 10 && instructionCount <= 6) {
      return '15 min';
    } else {
      return '20 min';
    }
  }

  /**
   * Estimate cook time based on cooking methods in instructions
   */
  _estimateCookTime() {
    const instructions = this.instructions.join(' ').toLowerCase();
    
    if (instructions.includes('bake') && instructions.includes('hour')) {
      return '1+ hours';
    } else if (instructions.includes('bake') || instructions.includes('roast')) {
      return '30 min';
    } else if (instructions.includes('simmer') || instructions.includes('boil')) {
      return '20 min';
    } else if (instructions.includes('fry') || instructions.includes('sauté')) {
      return '15 min';
    } else {
      return '10 min';
    }
  }

  /**
   * Estimate difficulty based on instruction complexity
   */
  _estimateDifficulty() {
    const instructionCount = this.instructions.length;
    const instructions = this.instructions.join(' ').toLowerCase();
    
    // Check for complex techniques
    const complexTechniques = ['knead', 'fold', 'temper', 'emulsify', 'caramelize', 'braise'];
    const hasComplexTechniques = complexTechniques.some(technique => instructions.includes(technique));
    
    if (hasComplexTechniques || instructionCount > 8) {
      return 'Hard';
    } else if (instructionCount > 5) {
      return 'Medium';
    } else {
      return 'Easy';
    }
  }

  /**
   * Get all recipes from RAG service
   */
  static getAll() {
    if (!ragService.isReady()) {
      console.warn('RAG service not ready, returning empty array');
      return [];
    }
    
    const recipes = ragService.getAllRecipes();
    return recipes.map(recipe => new Recipe(
      recipe.id,
      recipe.name,
      recipe.ingredients,
      recipe.instructions,
      recipe.ingredient_tags
    ));
  }

  static findById(id) {
    if (!ragService.isReady()) {
      return null;
    }
    
    const recipe = ragService.getRecipeById(parseInt(id));
    if (!recipe) {
      return null;
    }
    
    return new Recipe(
      recipe.id,
      recipe.name,
      recipe.ingredients,
      recipe.instructions,
      recipe.ingredient_tags
    );
  }

  static findByCategory(category) {
    const recipes = this.getAll();
    return recipes.filter(recipe => 
      recipe.category.toLowerCase() === category.toLowerCase()
    );
  }

  static searchByTitle(searchTerm) {
    const recipes = this.getAll();
    return recipes.filter(recipe =>
      recipe.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  calculateMatch(userIngredients) {
    const userIngredientSet = new Set(
      userIngredients.map(ing => ing.toLowerCase().trim())
    );
    
    // Use ingredient tags for matching (simplified ingredient names)
    const recipeIngredientSet = new Set(
      this.ingredientTags.map(ing => ing.toLowerCase().trim())
    );
    
    const matches = [...userIngredientSet].filter(ing => 
      recipeIngredientSet.has(ing)
    );
    const missing = [...recipeIngredientSet].filter(ing => 
      !userIngredientSet.has(ing)
    );
    
    const matchPercentage = Math.round(
      (matches.length / this.ingredientTags.length) * 100
    );
    
    return {
      matches: matches.length,
      total: this.ingredientTags.length,
      percentage: matchPercentage,
      missing: missing,
      hasAllIngredients: missing.length === 0
    };
  }

  getEstimatedCalories() {
    // Rough calorie estimation based on ingredient count and type
    let baseCalories = 200;
    this.ingredients.forEach(ingredient => {
      const ing = ingredient.toLowerCase();
      if (ing.includes('meat') || ing.includes('beef') || ing.includes('pork') || ing.includes('chicken')) {
        baseCalories += 150;
      } else if (ing.includes('cheese') || ing.includes('cream') || ing.includes('butter')) {
        baseCalories += 100;
      } else if (ing.includes('oil') || ing.includes('butter')) {
        baseCalories += 80;
      } else if (ing.includes('pasta') || ing.includes('rice') || ing.includes('bread') || ing.includes('flour')) {
        baseCalories += 120;
      } else if (ing.includes('potato') || ing.includes('sweet potato')) {
        baseCalories += 80;
      } else if (ing.includes('egg')) {
        baseCalories += 70;
      } else {
        baseCalories += 20;
      }
    });
    return Math.round(baseCalories);
  }
}

module.exports = Recipe;