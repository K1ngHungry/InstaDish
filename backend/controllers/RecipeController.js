const Recipe = require('../models/Recipe');

class RecipeController {
  // GET /api/recipes - Get all recipes
  static async getAllRecipes(req, res) {
    try {
      const { category, search } = req.query;
      let recipes = Recipe.getAll();

      // Filter by category if provided
      if (category) {
        recipes = Recipe.findByCategory(category);
      }

      // Search by title if provided
      if (search) {
        recipes = Recipe.searchByTitle(search);
      }

      res.json({
        success: true,
        data: recipes,
        count: recipes.length
      });
    } catch (error) {
      console.error('Error fetching recipes:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to fetch recipes'
      });
    }
  }

  // GET /api/recipes/:id - Get specific recipe
  static async getRecipeById(req, res) {
    try {
      const { id } = req.params;
      const recipe = Recipe.findById(id);
      
      if (!recipe) {
        return res.status(404).json({
          success: false,
          error: 'Recipe not found',
          message: `No recipe found with ID ${id}`
        });
      }
      
      // Add estimated calories
      const recipeWithCalories = {
        ...recipe,
        estimatedCalories: recipe.getEstimatedCalories()
      };
      
      res.json({
        success: true,
        data: recipeWithCalories
      });
    } catch (error) {
      console.error('Error fetching recipe:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to fetch recipe'
      });
    }
  }

  // POST /api/recipes/search - Search recipes by ingredients
  static async searchRecipes(req, res) {
    try {
      const { ingredients, limit = 10 } = req.body;
      
      if (!ingredients || !Array.isArray(ingredients)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid input',
          message: 'Ingredients array is required'
        });
      }

      if (ingredients.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Invalid input',
          message: 'At least one ingredient is required'
        });
      }
      
      const recipes = Recipe.getAll();
      const results = recipes
        .map(recipe => {
          const match = recipe.calculateMatch(ingredients);
          return {
            ...recipe,
            match,
            estimatedCalories: recipe.getEstimatedCalories()
          };
        })
        .filter(recipe => recipe.match.matches > 0)
        .sort((a, b) => {
          // Sort by match percentage, then by number of matches
          if (b.match.percentage !== a.match.percentage) {
            return b.match.percentage - a.match.percentage;
          }
          return b.match.matches - a.match.matches;
        })
        .slice(0, parseInt(limit));
      
      res.json({
        success: true,
        data: results,
        count: results.length,
        searchCriteria: {
          ingredients,
          totalMatches: results.length
        }
      });
    } catch (error) {
      console.error('Error searching recipes:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to search recipes'
      });
    }
  }

  // GET /api/recipes/categories - Get all recipe categories
  static async getCategories(req, res) {
    try {
      const recipes = Recipe.getAll();
      const categories = [...new Set(recipes.map(recipe => recipe.category))];
      
      res.json({
        success: true,
        data: categories,
        count: categories.length
      });
    } catch (error) {
      console.error('Error fetching categories:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to fetch categories'
      });
    }
  }
}

module.exports = RecipeController;