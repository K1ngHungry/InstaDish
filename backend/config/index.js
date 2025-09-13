const config = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Ollama Configuration
  ollama: {
    url: process.env.OLLAMA_URL || 'http://localhost:11434',
    model: process.env.OLLAMA_MODEL || 'llama2:7b',
    temperature: parseFloat(process.env.OLLAMA_TEMPERATURE) || 0.7,
    maxTokens: parseInt(process.env.OLLAMA_MAX_TOKENS) || 300,
    timeout: parseInt(process.env.OLLAMA_TIMEOUT) || 60000
  },

  // Sustainability Scoring System
  sustainability: {
    scores: {
      // High carbon footprint (negative scores)
      beef: -25,
      lamb: -25,
      cheese: -20,
      pork: -15,
      chicken: -10,
      eggs: -5,
      
      // Neutral to positive scores
      rice: 5,
      grains: 5,
      wheat: 5,
      vegetables: 15,
      fruits: 15,
      legumes: 20,
      beans: 20,
      lentils: 20,
      tofu: 18,
      nuts: 12,
      seeds: 12
    },
    
    carbonFootprints: {
      beef: 27.0,
      lamb: 21.0,
      cheese: 21.0,
      pork: 12.0,
      chicken: 7.0,
      eggs: 5.0,
      rice: 4.0,
      vegetables: 2.0,
      fruits: 1.0,
      legumes: 1.0,
      beans: 1.0,
      lentils: 1.0,
      tofu: 3.0,
      nuts: 2.0,
      seeds: 2.0
    }
  },

  // Health Scoring System
  health: {
    healthyIngredients: [
      'vegetables', 'fruits', 'grains', 'lean protein', 'nuts', 'seeds',
      'olive oil', 'avocado', 'quinoa', 'brown rice', 'sweet potato',
      'broccoli', 'spinach', 'kale', 'berries', 'salmon', 'chicken breast'
    ],
    
    unhealthyIngredients: [
      'processed', 'sugar', 'sodium', 'trans fat', 'saturated fat',
      'artificial', 'preservatives', 'high fructose', 'refined'
    ]
  }
};

module.exports = config;