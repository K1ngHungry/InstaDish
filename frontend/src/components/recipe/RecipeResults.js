import React from 'react';

const RecipeResults = ({ recipes, loading, error, onRecipeClick }) => {
  if (loading) {
    return (
      <section className="results-section">
        <div className="container">
          <div className="loading">
            <div className="spinner"></div>
            <p>Finding the best recipes for your ingredients...</p>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="results-section">
        <div className="container">
          <div className="error-state">
            <div className="error-icon">⚠️</div>
            <h3>Oops! Something went wrong</h3>
            <p>{error}</p>
            <button className="btn" onClick={() => window.location.reload()}>
              Try Again
            </button>
          </div>
        </div>
      </section>
    );
  }

  if (recipes.length === 0) {
    return null; // Don't show results section if no recipes
  }

  return (
    <section className="results-section">
      <div className="container">
        <div className="results-header">
          <h2>Recipes You Can Make</h2>
          <p>Found {recipes.length} recipe{recipes.length !== 1 ? 's' : ''} matching your ingredients</p>
        </div>
        
        <div className="results-grid">
          {recipes.map(recipe => (
            <div 
              key={recipe.id} 
              className="recipe-card" 
              onClick={() => onRecipeClick(recipe.id)}
            >
              <div className="recipe-header">
                <h3 className="recipe-title">{recipe.title}</h3>
                <div className="recipe-category">{recipe.category}</div>
              </div>
              
              <div className="match-info">
                <div className="match-percentage">
                  <span className="percentage-number">{recipe.match.percentage}%</span>
                  <span className="percentage-label">match</span>
                </div>
                <div className="match-stats">
                  {recipe.match.matches}/{recipe.match.total} ingredients
                </div>
              </div>

              <div className="recipe-details">
                <div className="recipe-meta">
                  <span className="prep-time">⏱️ {recipe.prepTime}</span>
                  <span className="cook-time">🔥 {recipe.cookTime}</span>
                  <span className="difficulty">📊 {recipe.difficulty}</span>
                </div>
                
                {recipe.estimatedCalories && (
                  <div className="calories">
                    🍽️ ~{recipe.estimatedCalories} calories
                  </div>
                )}
              </div>

              {recipe.match.missing.length > 0 && (
                <div className="missing-ingredients">
                  <h4>Missing ingredients:</h4>
                  <div className="missing-list">
                    {recipe.match.missing.slice(0, 3).map((ingredient, index) => (
                      <span key={index} className="missing-item">{ingredient}</span>
                    ))}
                    {recipe.match.missing.length > 3 && (
                      <span className="missing-item more">
                        +{recipe.match.missing.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              <div className="recipe-actions">
                <button className="btn recipe-btn">
                  View Recipe Details
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default RecipeResults;
