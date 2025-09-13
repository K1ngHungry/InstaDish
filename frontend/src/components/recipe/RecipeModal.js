import React from 'react';

const RecipeModal = ({ recipe, onClose }) => {
  React.useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [onClose]);

  if (!recipe) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{recipe.title}</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close modal">
            ×
          </button>
        </div>

        <div className="modal-body">
          <div className="recipe-info">
            <div className="recipe-meta-grid">
              <div className="meta-item">
                <span className="meta-icon">🏷️</span>
                <span className="meta-label">Category</span>
                <span className="meta-value">{recipe.category}</span>
              </div>
              <div className="meta-item">
                <span className="meta-icon">⏱️</span>
                <span className="meta-label">Prep Time</span>
                <span className="meta-value">{recipe.prepTime}</span>
              </div>
              <div className="meta-item">
                <span className="meta-icon">🔥</span>
                <span className="meta-label">Cook Time</span>
                <span className="meta-value">{recipe.cookTime}</span>
              </div>
              <div className="meta-item">
                <span className="meta-icon">📊</span>
                <span className="meta-label">Difficulty</span>
                <span className="meta-value">{recipe.difficulty}</span>
              </div>
              {recipe.estimatedCalories && (
                <div className="meta-item">
                  <span className="meta-icon">🍽️</span>
                  <span className="meta-label">Calories</span>
                  <span className="meta-value">~{recipe.estimatedCalories}</span>
                </div>
              )}
            </div>
          </div>

          <div className="recipe-content">
            <div className="ingredients-section">
              <h3>Ingredients</h3>
              <div className="ingredients-list">
                {recipe.ingredients.map((ingredient, index) => (
                  <div key={index} className="ingredient-item">
                    <span className="ingredient-checkbox">☐</span>
                    <span className="ingredient-name">{ingredient}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="steps-section">
              <h3>Instructions</h3>
              <div className="steps-list">
                {recipe.steps.map((step, index) => (
                  <div key={index} className="step-item">
                    <div className="step-number">{index + 1}</div>
                    <div className="step-content">{step}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {recipe.match && (
            <div className="match-analysis">
              <h3>Ingredient Match Analysis</h3>
              <div className="match-stats">
                <div className="match-stat">
                  <span className="stat-value">{recipe.match.percentage}%</span>
                  <span className="stat-label">Match</span>
                </div>
                <div className="match-stat">
                  <span className="stat-value">{recipe.match.matches}</span>
                  <span className="stat-label">You Have</span>
                </div>
                <div className="match-stat">
                  <span className="stat-value">{recipe.match.missing.length}</span>
                  <span className="stat-label">Missing</span>
                </div>
              </div>
              
              {recipe.match.missing.length > 0 && (
                <div className="missing-ingredients-detailed">
                  <h4>Missing Ingredients:</h4>
                  <div className="missing-list-detailed">
                    {recipe.match.missing.map((ingredient, index) => (
                      <span key={index} className="missing-item-detailed">
                        {ingredient}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn" onClick={onClose}>
            Close
          </button>
          <button className="btn btn-secondary" onClick={() => window.print()}>
            Print Recipe
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecipeModal;
