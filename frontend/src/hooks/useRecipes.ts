import { useState, useCallback } from 'react';

interface Recipe {
  id: number;
  name: string;
  ingredients: string[];
  instructions: string[];
  category: string;
  prep_time: string;
  cook_time: string;
  difficulty: string;
  match: {
    matches: number;
    total: number;
    percentage: number;
    weighted_percentage: number;
    missing: string[];
    critical_missing: string[];
    important_missing: string[];
    replaceable_missing: string[];
    substitution_suggestions: { [key: string]: string[] };
    hasAllIngredients: boolean;
    hasAllCriticalIngredients: boolean;
  };
  sustainability?: {
    score: number;
    level: string;
    carbon_footprint: number;
    water_usage: number;
    breakdown: Array<{
      ingredient: string;
      level: string;
      score: number;
      carbon: number;
      water: number;
    }>;
  };
  health?: {
    score: number;
    level: string;
    breakdown: {
      nutritional_density: number;
      macro_balance: number;
      health_risk: number;
    };
    nutritional_info?: {
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
      fiber: number;
      sugar: number;
      sodium: number;
    };
    fallback: boolean;
  };
}

export const useRecipes = () => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchRecipes = useCallback(async (
    ingredients: string[], 
    sortBy: string = 'match', 
    sortOrder: string = 'desc'
  ) => {
    if (ingredients.length === 0) {
      setRecipes([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000/api'}/recipes/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ingredients,
          limit: 9,
          sort_by: sortBy,
          sort_order: sortOrder
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setRecipes(data.data);
        } else {
          setError(data.message || 'Failed to search recipes');
        }
      } else {
        setError('Failed to search recipes');
      }
    } catch (err) {
      console.error('Error searching recipes:', err);
      setError('Sorry, there was an error searching for recipes.');
    } finally {
      setLoading(false);
    }
  }, []);

  const clearRecipes = useCallback(() => {
    setRecipes([]);
    setError(null);
  }, []);

  return {
    recipes,
    loading,
    error,
    searchRecipes,
    clearRecipes
  };
};
