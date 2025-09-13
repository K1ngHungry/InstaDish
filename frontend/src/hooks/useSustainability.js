import React from 'react';
import apiService from '../services/api';

export const useSustainability = () => {
  const [analysis, setAnalysis] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  const analyzeIngredients = React.useCallback(async (ingredients) => {
    if (!ingredients || ingredients.length === 0) {
      setError('Please provide ingredients for analysis');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.analyzeRecipe(ingredients);
      
      if (response.success) {
        setAnalysis(response.data);
      } else {
        setError(response.message || 'Failed to analyze ingredients');
      }
    } catch (err) {
      console.error('Error analyzing ingredients:', err);
      setError(err.message || 'Sorry, there was an error analyzing your ingredients.');
    } finally {
      setLoading(false);
    }
  }, []);

  const getFoodWasteTips = React.useCallback(async (ingredients = []) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.getFoodWasteTips(ingredients);
      
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to get food waste tips');
      }
    } catch (err) {
      console.error('Error getting food waste tips:', err);
      setError(err.message || 'Sorry, there was an error getting tips.');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const compareIngredients = React.useCallback(async (ingredientSets) => {
    if (!ingredientSets || ingredientSets.length < 2) {
      setError('Please provide at least 2 ingredient sets for comparison');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.compareIngredients(ingredientSets);
      
      if (response.success) {
        return response.data;
      } else {
        setError(response.message || 'Failed to compare ingredients');
        return null;
      }
    } catch (err) {
      console.error('Error comparing ingredients:', err);
      setError(err.message || 'Sorry, there was an error comparing ingredients.');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getScoringSystem = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.getSustainabilityScoringSystem();
      
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to get scoring system');
      }
    } catch (err) {
      console.error('Error getting scoring system:', err);
      setError(err.message || 'Sorry, there was an error getting the scoring system.');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearAnalysis = React.useCallback(() => {
    setAnalysis(null);
    setError(null);
  }, []);

  return {
    analysis,
    loading,
    error,
    analyzeIngredients,
    getFoodWasteTips,
    compareIngredients,
    getScoringSystem,
    clearAnalysis,
    hasAnalysis: analysis !== null
  };
};
