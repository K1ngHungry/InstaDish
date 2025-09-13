const OllamaService = require('../services/OllamaService');

class ChatbotController {
  // POST /api/chatbot - Handle chatbot requests
  static async handleChatbotRequest(req, res) {
    try {
      const { message, conversationHistory = [], userIngredients = [] } = req.body;
      
      if (!message || typeof message !== 'string' || message.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Invalid input',
          message: 'Message is required and must be a non-empty string'
        });
      }

      // Check if Ollama is available
      const isOllamaAvailable = await OllamaService.isOllamaAvailable();
      
      if (!isOllamaAvailable) {
        return res.json({
          success: false,
          response: "I'm having trouble connecting to my AI brain right now. Please make sure Ollama is running with the llama2:7b model. I can still help you with basic recipe suggestions though!",
          recipes: OllamaService.getSuggestedRecipes(userIngredients),
          error: 'Ollama service unavailable'
        });
      }

      // Get AI response from Ollama
      const aiResponse = await OllamaService.generateResponse(
        message, 
        conversationHistory, 
        userIngredients
      );
      
      // Get suggested recipes based on user ingredients
      const suggestedRecipes = OllamaService.getSuggestedRecipes(userIngredients);
      
      res.json({
        success: true,
        response: aiResponse,
        recipes: suggestedRecipes,
        metadata: {
          model: 'llama2:7b',
          userIngredients: userIngredients.length,
          suggestedRecipes: suggestedRecipes.length
        }
      });
      
    } catch (error) {
      console.error('Chatbot error:', error);
      
      // Fallback response if Ollama fails
      res.json({
        success: false,
        response: "I'm having trouble connecting to my AI brain right now, but I can still help! What cooking question do you have, or what ingredients are you working with?",
        recipes: OllamaService.getSuggestedRecipes(req.body.userIngredients || []),
        error: error.message
      });
    }
  }

  // GET /api/chatbot/status - Check chatbot status
  static async getChatbotStatus(req, res) {
    try {
      const isOllamaAvailable = await OllamaService.isOllamaAvailable();
      const models = await OllamaService.getAvailableModels();
      
      res.json({
        success: true,
        data: {
          ollamaAvailable: isOllamaAvailable,
          availableModels: models.map(model => model.name),
          currentModel: 'llama2:7b',
          status: isOllamaAvailable ? 'operational' : 'offline'
        }
      });
    } catch (error) {
      console.error('Error checking chatbot status:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to check chatbot status'
      });
    }
  }

  // POST /api/chatbot/quick-questions - Get contextual quick questions
  static async getQuickQuestions(req, res) {
    try {
      const { userIngredients = [] } = req.body;
      
      const quickQuestions = userIngredients.length > 0 ? [
        "What recipes can I make with my ingredients?",
        "How can I make my meal more sustainable?",
        "What substitutions can I make?",
        "What's missing from my ingredients?",
        "How do I store these ingredients properly?"
      ] : [
        "How do I know when chicken is cooked?",
        "What can I substitute for eggs?",
        "How do I reduce food waste?",
        "What's the most sustainable protein?",
        "How do I meal prep efficiently?"
      ];
      
      res.json({
        success: true,
        data: quickQuestions
      });
    } catch (error) {
      console.error('Error getting quick questions:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to get quick questions'
      });
    }
  }
}

module.exports = ChatbotController;