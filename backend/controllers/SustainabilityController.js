const SustainabilityService = require('../services/SustainabilityService');

class SustainabilityController {
  // POST /api/sustainability/analyze - Analyze recipe sustainability
  static async analyzeRecipe(req, res) {
    try {
      const { ingredients } = req.body;
      
      if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Invalid input',
          message: 'Ingredients array is required and must not be empty'
        });
      }
      
      // Calculate scores
      const sustainabilityScore = SustainabilityService.calculateSustainabilityScore(ingredients);
      const healthScore = SustainabilityService.calculateHealthScore(ingredients);
      const carbonFootprint = SustainabilityService.calculateCarbonFootprint(ingredients);
      
      // Get grades
      const sustainabilityGrade = SustainabilityService.getSustainabilityGrade(sustainabilityScore);
      const healthGrade = SustainabilityService.getHealthGrade(healthScore);
      
      // Get tips and benefits
      const sustainabilityTips = SustainabilityService.getSustainabilityTips(ingredients);
      const healthBenefits = SustainabilityService.getHealthBenefits(ingredients);
      const nutritionalInfo = SustainabilityService.getNutritionalInfo(ingredients);
      
      res.json({
        success: true,
        data: {
          sustainability: {
            score: sustainabilityScore,
            grade: sustainabilityGrade.grade,
            color: sustainabilityGrade.color,
            label: sustainabilityGrade.label,
            carbonFootprint: carbonFootprint,
            tips: sustainabilityTips
          },
          health: {
            score: healthScore,
            grade: healthGrade.grade,
            color: healthGrade.color,
            label: healthGrade.label,
            nutritionalInfo: nutritionalInfo,
            benefits: healthBenefits
          },
          ingredients: {
            count: ingredients.length,
            list: ingredients
          }
        }
      });
    } catch (error) {
      console.error('Error analyzing recipe:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to analyze recipe sustainability'
      });
    }
  }

  // POST /api/sustainability/food-waste-tips - Get food waste reduction tips
  static async getFoodWasteTips(req, res) {
    try {
      const { ingredients = [] } = req.body;
      
      const tips = SustainabilityService.getFoodWasteReductionTips();
      
      // Add ingredient-specific tips
      const ingredientTips = [];
      const ing = ingredients.map(i => i.toLowerCase()).join(' ');
      
      if (ing.includes('vegetable') || ing.includes('leafy')) {
        ingredientTips.push("🥬 Store leafy greens wrapped in damp paper towels");
      }
      
      if (ing.includes('tomato')) {
        ingredientTips.push("🍅 Store tomatoes at room temperature until ripe, then refrigerate");
      }
      
      if (ing.includes('herb')) {
        ingredientTips.push("🌿 Keep herbs fresh by storing them in water like flowers");
      }
      
      if (ing.includes('banana')) {
        ingredientTips.push("🍌 Freeze overripe bananas for smoothies or banana bread");
      }
      
      res.json({
        success: true,
        data: {
          generalTips: tips,
          ingredientSpecificTips: ingredientTips,
          totalTips: tips.length + ingredientTips.length
        }
      });
    } catch (error) {
      console.error('Error getting food waste tips:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to get food waste tips'
      });
    }
  }

  // GET /api/sustainability/scores - Get sustainability scoring system info
  static async getScoringSystem(req, res) {
    try {
      const config = require('../config');
      
      res.json({
        success: true,
        data: {
          sustainabilityScores: config.sustainability.scores,
          carbonFootprints: config.sustainability.carbonFootprints,
          healthyIngredients: config.health.healthyIngredients,
          unhealthyIngredients: config.health.unhealthyIngredients,
          description: "Sustainability scores range from -25 to +20, with higher scores being better for the environment. Carbon footprints are measured in kg CO₂ per kg of food."
        }
      });
    } catch (error) {
      console.error('Error getting scoring system:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to get scoring system'
      });
    }
  }

  // POST /api/sustainability/compare - Compare multiple ingredient sets
  static async compareIngredients(req, res) {
    try {
      const { ingredientSets } = req.body;
      
      if (!ingredientSets || !Array.isArray(ingredientSets) || ingredientSets.length < 2) {
        return res.status(400).json({
          success: false,
          error: 'Invalid input',
          message: 'At least 2 ingredient sets are required for comparison'
        });
      }
      
      const comparisons = ingredientSets.map((ingredients, index) => {
        const sustainabilityScore = SustainabilityService.calculateSustainabilityScore(ingredients);
        const healthScore = SustainabilityService.calculateHealthScore(ingredients);
        const carbonFootprint = SustainabilityService.calculateCarbonFootprint(ingredients);
        
        return {
          setIndex: index,
          ingredients,
          sustainability: {
            score: sustainabilityScore,
            grade: SustainabilityService.getSustainabilityGrade(sustainabilityScore)
          },
          health: {
            score: healthScore,
            grade: SustainabilityService.getHealthGrade(healthScore)
          },
          carbonFootprint
        };
      });
      
      // Find the best options
      const bestSustainability = comparisons.reduce((best, current) => 
        current.sustainability.score > best.sustainability.score ? current : best
      );
      
      const bestHealth = comparisons.reduce((best, current) => 
        current.health.score > best.health.score ? current : best
      );
      
      const lowestCarbon = comparisons.reduce((best, current) => 
        current.carbonFootprint < best.carbonFootprint ? current : best
      );
      
      res.json({
        success: true,
        data: {
          comparisons,
          recommendations: {
            bestSustainability,
            bestHealth,
            lowestCarbon
          }
        }
      });
    } catch (error) {
      console.error('Error comparing ingredients:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to compare ingredients'
      });
    }
  }
}

module.exports = SustainabilityController;