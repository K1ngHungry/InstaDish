const express = require('express');
const router = express.Router();
const SustainabilityController = require('../controllers/SustainabilityController');

// POST /api/sustainability/analyze - Analyze recipe sustainability
router.post('/analyze', SustainabilityController.analyzeRecipe);

// POST /api/sustainability/food-waste-tips - Get food waste reduction tips
router.post('/food-waste-tips', SustainabilityController.getFoodWasteTips);

// GET /api/sustainability/scores - Get sustainability scoring system
router.get('/scores', SustainabilityController.getScoringSystem);

// POST /api/sustainability/compare - Compare multiple ingredient sets
router.post('/compare', SustainabilityController.compareIngredients);

module.exports = router;