const axios = require('axios');

class AIService {
    constructor() {
        this.baseURL = process.env.AI_SERVICE_URL || 'http://localhost:8000';
        this.timeout = 30000; // 30 seconds
    }

    async healthCheck() {
        try {
            const response = await axios.get(`${this.baseURL}/health`, {
                timeout: 5000
            });
            return response.data;
        } catch (error) {
            console.error('AI Service health check failed:', error.message);
            return null;
        }
    }

    async searchRecipes(query, limit = 5, userIngredients = []) {
        try {
            const response = await axios.post(`${this.baseURL}/search/recipes`, {
                query,
                limit,
                user_ingredients: userIngredients
            }, {
                timeout: this.timeout
            });
            return response.data;
        } catch (error) {
            console.error('Recipe search failed:', error.message);
            throw new Error(`Recipe search failed: ${error.message}`);
        }
    }

    async chatWithAI(message, userIngredients = []) {
        try {
            const response = await axios.post(`${this.baseURL}/chat`, {
                message,
                user_ingredients: userIngredients
            }, {
                timeout: this.timeout
            });
            return response.data;
        } catch (error) {
            console.error('AI chat failed:', error.message);
            throw new Error(`AI chat failed: ${error.message}`);
        }
    }

    async getRecipeById(recipeId) {
        try {
            const response = await axios.get(`${this.baseURL}/recipes/${recipeId}`, {
                timeout: this.timeout
            });
            return response.data;
        } catch (error) {
            console.error('Get recipe failed:', error.message);
            throw new Error(`Get recipe failed: ${error.message}`);
        }
    }

    async isAvailable() {
        const health = await this.healthCheck();
        return health && health.status === 'healthy';
    }
}

module.exports = new AIService();
