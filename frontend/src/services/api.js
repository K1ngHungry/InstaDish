class ApiService {
  constructor() {
    this.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // Recipe API methods
  async getAllRecipes(filters = {}) {
    const params = new URLSearchParams();
    if (filters.category) params.append('category', filters.category);
    if (filters.search) params.append('search', filters.search);
    
    const queryString = params.toString();
    const endpoint = queryString ? `/recipes?${queryString}` : '/recipes';
    return this.request(endpoint);
  }

  async getRecipeById(id) {
    return this.request(`/recipes/${id}`);
  }

  async searchRecipes(ingredients, limit = 10, query = null, sortBy = 'match', sortOrder = 'desc') {
    return this.request('/recipes/search', {
      method: 'POST',
      body: JSON.stringify({ 
        ingredients, 
        limit, 
        query, 
        sort_by: sortBy, 
        sort_order: sortOrder 
      }),
    });
  }

  async getRecipeCategories() {
    return this.request('/recipes/categories');
  }

  // Chatbot API methods
  async sendChatMessage(message, userIngredients = []) {
    return this.request('/chatbot', {
      method: 'POST',
      body: JSON.stringify({
        message,
        userIngredients,
      }),
    });
  }

  async getChatbotStatus() {
    return this.request('/chatbot/status');
  }

  async getQuickQuestions(userIngredients = []) {
    return this.request('/chatbot/quick-questions', {
      method: 'POST',
      body: JSON.stringify({ message: '', userIngredients }),
    });
  }

  // Sustainability API methods
  async analyzeRecipe(ingredients) {
    return this.request('/sustainability/analyze', {
      method: 'POST',
      body: JSON.stringify({ ingredients }),
    });
  }

  async getFoodWasteTips(ingredients = []) {
    return this.request('/sustainability/food-waste-tips', {
      method: 'POST',
      body: JSON.stringify({ ingredients }),
    });
  }

  async getSustainabilityScoringSystem() {
    return this.request('/sustainability/scores');
  }

  async compareIngredients(ingredientSets) {
    return this.request('/sustainability/compare', {
      method: 'POST',
      body: JSON.stringify({ ingredientSets }),
    });
  }

  // Health check
  async getHealthStatus() {
    return this.request('/health');
  }
}

// Create and export a singleton instance
const apiService = new ApiService();
export default apiService;