const express = require('express');
const router = express.Router();
const RecipeController = require('../controllers/RecipeController');

// GET /api/recipes - Get all recipes (with optional filtering)
router.get('/', RecipeController.getAllRecipes);

// GET /api/recipes/categories - Get all recipe categories
router.get('/categories', RecipeController.getCategories);

// GET /api/recipes/:id - Get specific recipe by ID
router.get('/:id', RecipeController.getRecipeById);

// POST /api/recipes/search - Search recipes by ingredients
router.post('/search', RecipeController.searchRecipes);

module.exports = router;