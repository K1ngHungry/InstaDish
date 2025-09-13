const config = require('../config');
const Recipe = require('../models/Recipe');
const ragService = require('./RAGService');

class OllamaService {
  static async generateResponse(message, conversationHistory = [], userIngredients = []) {
    try {
      // Get relevant recipes using RAG
      const relevantRecipes = await this.getRelevantRecipes(message, userIngredients);
      
      const systemPrompt = this.buildSystemPrompt(userIngredients, relevantRecipes);
      const conversationContext = this.buildConversationContext(
        systemPrompt, 
        conversationHistory, 
        message
      );
      
      const response = await fetch(`${config.ollama.url}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: config.ollama.model,
          prompt: conversationContext,
          stream: false,
          options: {
            temperature: config.ollama.temperature,
            num_predict: config.ollama.maxTokens
          }
        }),
        signal: AbortSignal.timeout(config.ollama.timeout)
      });

      if (!response.ok) {
        throw new Error(`Ollama API request failed: ${response.status}`);
      }

      const data = await response.json();
      return data.response || 'Sorry, I had trouble generating a response.';
      
    } catch (error) {
      console.error('Ollama service error:', error);
      
      if (error.name === 'TimeoutError' || error.message.includes('timeout')) {
        throw new Error('AI response timed out. Please try again with a shorter question.');
      }
      
      throw error;
    }
  }

  static async getRelevantRecipes(message, userIngredients) {
    try {
      if (!ragService.isReady()) {
        console.warn('RAG service not ready, using fallback recipe search');
        return this.getSuggestedRecipes(userIngredients);
      }

      // Search for relevant recipes based on user message and ingredients
      const searchQuery = userIngredients.length > 0 
        ? `${message} ${userIngredients.join(' ')}`
        : message;
      
      const searchResults = await ragService.searchRecipes(searchQuery, 5);
      
      // Convert search results to Recipe objects
      return searchResults.map(result => {
        const recipe = result.recipe;
        return new Recipe(
          recipe.id,
          recipe.name,
          recipe.ingredients,
          recipe.instructions,
          recipe.ingredient_tags
        );
      });
      
    } catch (error) {
      console.error('Error getting relevant recipes:', error);
      return this.getSuggestedRecipes(userIngredients);
    }
  }

  static buildSystemPrompt(userIngredients, relevantRecipes = []) {
    const ingredientsContext = userIngredients.length > 0 
      ? `\n\nUSER'S CURRENT INGREDIENTS: ${userIngredients.join(', ')}\nUse this information to provide personalized recipe suggestions, substitutions, and cooking advice.`
      : '\n\nThe user hasn\'t selected any ingredients yet, so focus on general cooking advice and encourage them to add ingredients.';

    // Use relevant recipes from RAG if available, otherwise fallback to all recipes
    let recipeList = '';
    if (relevantRecipes.length > 0) {
      recipeList = relevantRecipes.map(recipe => 
        `- ${recipe.name} (${recipe.category}): ${recipe.ingredients.join(', ')}`
      ).join('\n');
    } else {
      const recipes = Recipe.getAll();
      recipeList = recipes.slice(0, 10).map(recipe => 
        `- ${recipe.name} (${recipe.category}): ${recipe.ingredients.join(', ')}`
      ).join('\n');
    }

    const recipeCount = relevantRecipes.length > 0 ? relevantRecipes.length : '1000+';
    
    return `You are InstaDish, an expert cooking assistant and sustainability educator. You help users with:

COOKING EXPERTISE:
- Cooking techniques and methods
- Ingredient substitutions and alternatives  
- Food safety and storage tips
- Recipe modifications and improvements
- Troubleshooting cooking problems
- Kitchen tips and tricks

SUSTAINABILITY EDUCATION:
- Environmental impact of food choices
- Sustainable cooking practices
- Food waste reduction
- Carbon footprint of ingredients
- Local and seasonal eating
- Plant-based alternatives

RELEVANT RECIPES (${recipeCount} recipes available):
${recipeList}
${ingredientsContext}

IMPORTANT INSTRUCTIONS:
1. Always consider the user's current ingredients when giving advice
2. Suggest specific recipes from our database that match their ingredients
3. Provide ingredient substitutions based on what they have available
4. Calculate and explain sustainability scores for their ingredient combinations
5. Be encouraging, educational, and explain the "why" behind suggestions
6. If they mention ingredients not in their list, suggest adding them for better matches
7. Provide specific cooking tips and techniques
8. Always mention sustainability impact when relevant

SUSTAINABILITY SCORING SYSTEM:
- Beef/Lamb: -25 points (very high carbon footprint: 27-21kg CO₂/kg)
- Cheese: -20 points (high carbon footprint: 21kg CO₂/kg)
- Pork: -15 points (medium-high carbon footprint: 12kg CO₂/kg)
- Chicken: -10 points (moderate carbon footprint: 7kg CO₂/kg)
- Eggs: -5 points (low carbon footprint: 5kg CO₂/kg)
- Rice/Grains: +5 points (low carbon footprint: 4kg CO₂/kg)
- Vegetables/Fruits: +15 points (very low carbon footprint: 1-2kg CO₂/kg)
- Legumes/Beans/Lentils: +20 points (excellent sustainability: 1kg CO₂/kg)

RESPONSE STYLE:
- Be conversational and friendly
- Use emojis appropriately (🍳🥗🌱♻️)
- Provide actionable advice
- Always explain the reasoning behind suggestions
- Keep responses informative but concise`;
  }

  static buildConversationContext(systemPrompt, conversationHistory, message) {
    let context = systemPrompt + "\n\nCONVERSATION:\n";
    
    if (conversationHistory && conversationHistory.length > 0) {
      conversationHistory.slice(-6).forEach(msg => {
        const role = msg.sender === 'user' ? 'User' : 'Assistant';
        context += `${role}: ${msg.text}\n`;
      });
    }
    
    context += `User: ${message}\nAssistant:`;
    
    return context;
  }

  static getSuggestedRecipes(userIngredients, limit = 3) {
    if (!userIngredients || userIngredients.length === 0) {
      return [];
    }

    const recipes = Recipe.getAll();
    
    const matchingRecipes = recipes.map(recipe => {
      const match = recipe.calculateMatch(userIngredients);
      return {
        ...recipe,
        match
      };
    })
    .filter(recipe => recipe.match.matches > 0)
    .sort((a, b) => b.match.percentage - a.match.percentage)
    .slice(0, limit);
    
    return matchingRecipes;
  }

  static async isOllamaAvailable() {
    try {
      const response = await fetch(`${config.ollama.url}/api/tags`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });
      return response.ok;
    } catch (error) {
      console.error('Ollama availability check failed:', error);
      return false;
    }
  }

  static async getAvailableModels() {
    try {
      const response = await fetch(`${config.ollama.url}/api/tags`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch models');
      }
      
      const data = await response.json();
      return data.models || [];
    } catch (error) {
      console.error('Error fetching Ollama models:', error);
      return [];
    }
  }
}

module.exports = OllamaService;