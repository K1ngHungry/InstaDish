const config = require('../config');

class SustainabilityService {
  static calculateSustainabilityScore(ingredients) {
    let score = 100;
    const usedIngredients = new Set();
    
    ingredients.forEach(ingredient => {
      const ing = ingredient.toLowerCase().trim();
      
      // Avoid double-counting similar ingredients
      if (usedIngredients.has(ing)) return;
      usedIngredients.add(ing);
      
      for (const [food, points] of Object.entries(config.sustainability.scores)) {
        if (ing.includes(food)) {
          score += points;
          break;
        }
      }
    });
    
    return Math.max(0, Math.min(100, score));
  }

  static calculateHealthScore(ingredients) {
    let score = 50;
    let healthyCount = 0;
    let unhealthyCount = 0;
    
    ingredients.forEach(ingredient => {
      const ing = ingredient.toLowerCase();
      
      if (config.health.healthyIngredients.some(healthy => ing.includes(healthy))) {
        healthyCount++;
      }
      
      if (config.health.unhealthyIngredients.some(unhealthy => ing.includes(unhealthy))) {
        unhealthyCount++;
      }
    });
    
    score += (healthyCount * 8);
    score -= (unhealthyCount * 12);
    
    return Math.max(0, Math.min(100, score));
  }

  static calculateCarbonFootprint(ingredients) {
    let totalFootprint = 0;
    const usedIngredients = new Set();
    
    ingredients.forEach(ingredient => {
      const ing = ingredient.toLowerCase().trim();
      
      if (usedIngredients.has(ing)) return;
      usedIngredients.add(ing);
      
      for (const [food, footprint] of Object.entries(config.sustainability.carbonFootprints)) {
        if (ing.includes(food)) {
          totalFootprint += footprint;
          break;
        }
      }
    });
    
    return Math.round(totalFootprint * 10) / 10; // Round to 1 decimal place
  }

  static getSustainabilityTips(ingredients) {
    const tips = [];
    const ing = ingredients.map(i => i.toLowerCase()).join(' ');
    
    // High-impact ingredient tips
    if (ing.includes('beef') || ing.includes('lamb')) {
      tips.push("🌱 Consider plant-based proteins like beans or lentils to reduce carbon footprint by 80-90%");
    }
    
    if (ing.includes('cheese')) {
      tips.push("🌱 Try nutritional yeast, cashew cream, or plant-based cheese alternatives");
    }
    
    if (ing.includes('chicken') && !ing.includes('beef')) {
      tips.push("🌱 Great choice! Chicken has 75% lower carbon footprint than beef");
    }
    
    if (ing.includes('vegetables') && !ing.includes('meat')) {
      tips.push("🌱 Excellent! Plant-based meals have 50% lower environmental impact");
    }
    
    if (ing.includes('rice')) {
      tips.push("🌱 Consider brown rice for extra nutrition and sustainability");
    }
    
    // General sustainability tips
    tips.push("🌱 Buy local and seasonal ingredients when possible");
    tips.push("🌱 Use vegetable scraps for homemade broth to reduce food waste");
    tips.push("🌱 Plan meals to use ingredients before they expire");
    
    return tips.slice(0, 5); // Limit to 5 tips
  }

  static getHealthBenefits(ingredients) {
    const benefits = [];
    const ing = ingredients.map(i => i.toLowerCase()).join(' ');
    
    if (ing.includes('vegetables') || ing.includes('spinach') || ing.includes('broccoli')) {
      benefits.push("🥬 Rich in vitamins, minerals, and fiber for optimal health");
    }
    
    if (ing.includes('garlic') || ing.includes('onion')) {
      benefits.push("🧄 Contains antioxidants and immune-boosting compounds");
    }
    
    if (ing.includes('olive oil') || ing.includes('avocado')) {
      benefits.push("🫒 Heart-healthy monounsaturated fats");
    }
    
    if (ing.includes('quinoa') || ing.includes('brown rice')) {
      benefits.push("🌾 Complete protein and complex carbohydrates for sustained energy");
    }
    
    if (ing.includes('salmon') || ing.includes('fish')) {
      benefits.push("🐟 High in omega-3 fatty acids for brain and heart health");
    }
    
    if (ing.includes('berries') || ing.includes('blueberries')) {
      benefits.push("🫐 Packed with antioxidants and vitamin C");
    }
    
    if (ing.includes('nuts') || ing.includes('almonds')) {
      benefits.push("🥜 Healthy fats and protein for satiety");
    }
    
    return benefits.slice(0, 4); // Limit to 4 benefits
  }

  static getNutritionalInfo(ingredients) {
    let estimatedCalories = 200;
    let proteinSources = 0;
    let vegetableSources = 0;
    let grainSources = 0;
    
    ingredients.forEach(ingredient => {
      const ing = ingredient.toLowerCase();
      
      if (ing.includes('meat') || ing.includes('chicken') || ing.includes('beef') || 
          ing.includes('fish') || ing.includes('eggs') || ing.includes('beans') || 
          ing.includes('tofu') || ing.includes('cheese')) {
        proteinSources++;
        estimatedCalories += 120;
      } else if (ing.includes('vegetable') || ing.includes('broccoli') || 
                 ing.includes('spinach') || ing.includes('carrot')) {
        vegetableSources++;
        estimatedCalories += 25;
      } else if (ing.includes('rice') || ing.includes('pasta') || 
                 ing.includes('bread') || ing.includes('quinoa')) {
        grainSources++;
        estimatedCalories += 100;
      } else {
        estimatedCalories += 30;
      }
    });
    
    return {
      estimatedCalories: Math.round(estimatedCalories),
      protein: proteinSources * 12,
      fiber: (vegetableSources * 4) + (grainSources * 2),
      vitamins: "A, C, K, B-complex, E",
      minerals: "Iron, Calcium, Magnesium, Potassium"
    };
  }

  static getFoodWasteReductionTips() {
    return [
      "♻️ Store vegetables in airtight containers to extend freshness",
      "♻️ Use vegetable peels and scraps for homemade stock",
      "♻️ Plan meals to use ingredients before they expire",
      "♻️ Freeze leftover portions for quick future meals",
      "♻️ Compost food scraps to reduce landfill waste",
      "♻️ Buy only what you need and store properly",
      "♻️ Use the 'first in, first out' method for ingredients"
    ];
  }

  static getSustainabilityGrade(score) {
    if (score >= 85) return { grade: 'A+', color: '#4CAF50', label: 'Excellent' };
    if (score >= 75) return { grade: 'A', color: '#66BB6A', label: 'Very Good' };
    if (score >= 65) return { grade: 'B', color: '#FFA726', label: 'Good' };
    if (score >= 55) return { grade: 'C', color: '#FF7043', label: 'Fair' };
    if (score >= 45) return { grade: 'D', color: '#EF5350', label: 'Poor' };
    return { grade: 'F', color: '#D32F2F', label: 'Very Poor' };
  }

  static getHealthGrade(score) {
    if (score >= 85) return { grade: 'A+', color: '#4CAF50', label: 'Excellent' };
    if (score >= 75) return { grade: 'A', color: '#66BB6A', label: 'Very Good' };
    if (score >= 65) return { grade: 'B', color: '#FFA726', label: 'Good' };
    if (score >= 55) return { grade: 'C', color: '#FF7043', label: 'Fair' };
    if (score >= 45) return { grade: 'D', color: '#EF5350', label: 'Poor' };
    return { grade: 'F', color: '#D32F2F', label: 'Very Poor' };
  }
}

module.exports = SustainabilityService;