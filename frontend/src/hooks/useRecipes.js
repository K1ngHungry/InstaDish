import React from 'react';
import apiService from '../services/api';

export const useRecipes = () => {
  const [recipes, setRecipes] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  const searchRecipes = React.useCallback(async (ingredients, limit = 10) => {
    if (!ingredients || ingredients.length === 0) {
      setError('Please add at least one ingredient before searching!');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.searchRecipes(ingredients, limit);
      
      if (response.success) {
        setRecipes(response.data);
      } else {
        setError(response.message || 'Failed to search recipes');
      }
    } catch (err) {
      console.error('Error searching recipes:', err);
      setError(err.message || 'Sorry, there was an error finding recipes. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  const getAllRecipes = React.useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.getAllRecipes(filters);
      
      if (response.success) {
        setRecipes(response.data);
      } else {
        setError(response.message || 'Failed to fetch recipes');
      }
    } catch (err) {
      console.error('Error fetching recipes:', err);
      setError(err.message || 'Sorry, there was an error loading recipes. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  const clearRecipes = React.useCallback(() => {
    setRecipes([]);
    setError(null);
  }, []);

  const getRecipeById = React.useCallback(async (id) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.getRecipeById(id);
      
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Recipe not found');
      }
    } catch (err) {
      console.error('Error fetching recipe:', err);
      setError(err.message || 'Sorry, there was an error loading the recipe.');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    recipes,
    loading,
    error,
    searchRecipes,
    getAllRecipes,
    clearRecipes,
    getRecipeById,
    hasRecipes: recipes.length > 0
  };
};