import React, { useState } from 'react';
import RecipeSorting from './common/RecipeSorting';
import { formatIngredientsPreview, formatMissingIngredients } from '../utils/recipeUtils';

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

interface RecipeResultsProps {
  recipes: Recipe[];
  loading: boolean;
  error: string | null;
  onRecipeClick: (recipeId: number) => void;
  onSortChange?: (sortBy: string, sortOrder: string) => void;
}

const RecipeResults: React.FC<RecipeResultsProps> = ({
  recipes,
  loading,
  error,
  onRecipeClick,
  onSortChange
}) => {
  const [sortBy, setSortBy] = useState('match');
  const [sortOrder, setSortOrder] = useState('desc');


  const handleSortChange = (newSortBy: string, newSortOrder: string) => {
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
    if (onSortChange) {
      onSortChange(newSortBy, newSortOrder);
    }
  };
  if (loading) {
    return (
      <div className="recipe-results">
        <h2>Searching for recipes...</h2>
        <div className="loading-spinner">⏳</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="recipe-results">
        <h2>Error</h2>
        <p className="error-message">{error}</p>
      </div>
    );
  }

  if (recipes.length === 0) {
    return (
      <div className="recipe-results">
        <h2>No recipes found</h2>
        <p>Try adding some ingredients to search for recipes!</p>
      </div>
    );
  }

  return (
    <div className="recipe-results">
      <div className="results-header">
        <h2>Found {recipes.length} recipes</h2>
        {onSortChange && (
          <RecipeSorting
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSortChange={handleSortChange}
          />
        )}
      </div>
      <div className="recipes-grid">
        {recipes.map((recipe) => (
          <div
            key={recipe.id}
            className="recipe-card"
            onClick={() => onRecipeClick(recipe.id)}
          >
            <div className="recipe-header">
              <h3 className="recipe-title">{recipe.name}</h3>
              <span className="recipe-category">{recipe.category}</span>
            </div>
            
            <div className="recipe-meta">
              <span className="recipe-time">⏱️ {recipe.prep_time} + {recipe.cook_time}</span>
              <span className="recipe-difficulty">📊 {recipe.difficulty}</span>
            </div>

            <div className="recipe-match">
              <div className="match-percentage">
                {recipe.match.weighted_percentage || recipe.match.percentage}% match
                {recipe.match.weighted_percentage && recipe.match.weighted_percentage !== recipe.match.percentage && (
                  <span className="weighted-indicator"> (weighted)</span>
                )}
              </div>
              <div className="match-details">
                {recipe.match.matches}/{recipe.match.total} ingredients
              </div>
              {!recipe.match.hasAllCriticalIngredients && recipe.match.critical_missing.length > 0 && (
                <div className="critical-missing">
                  ⚠️ Missing critical: {recipe.match.critical_missing.slice(0, 2).join(', ')}
                  {recipe.match.critical_missing.length > 2 && ` +${recipe.match.critical_missing.length - 2} more`}
                </div>
              )}
            </div>

            {recipe.sustainability && (
              <div className="recipe-sustainability">
                <div className="sustainability-score">
                  <span className={`sustainability-level ${recipe.sustainability.level}`}>
                    🌱 {recipe.sustainability.level.toUpperCase()}
                  </span>
                  <span className="sustainability-details">
                    {recipe.sustainability.carbon_footprint}kg CO₂
                  </span>
                </div>
              </div>
            )}

            {recipe.health && (
              <div className="recipe-health">
                <div className="health-score">
                  <span className={`health-level ${recipe.health.level}`}>
                    🏥 {recipe.health.level.replace('_', ' ').toUpperCase()}
                  </span>
                  <span className="health-details">
                    {recipe.health.score}/100
                    {recipe.health.fallback && <span className="fallback-indicator"> (est.)</span>}
                  </span>
                </div>
              </div>
            )}

            <div className="recipe-ingredients">
              <strong>Ingredients:</strong>
              <p>{formatIngredientsPreview(recipe.ingredients)}</p>
            </div>

            {recipe.match.missing.length > 0 && (
              <div className="missing-ingredients">
                <strong>Missing:</strong> {formatMissingIngredients(recipe.match.missing)}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecipeResults;
