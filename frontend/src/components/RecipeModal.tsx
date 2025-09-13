import React from 'react';

interface Recipe {
  id: number;
  name: string;
  ingredients: string[];
  instructions: string[];
  category: string;
  prep_time: string;
  cook_time: string;
  difficulty: string;
  match?: {
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
  estimated_calories?: number;
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
}

interface RecipeModalProps {
  recipe: Recipe;
  onClose: () => void;
  onSelect?: (recipe: Recipe) => void;
}

const RecipeModal: React.FC<RecipeModalProps> = ({ recipe, onClose, onSelect }) => {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{recipe.name}</h2>
          <div className="modal-actions">
            {onSelect && (
              <button className="select-recipe-button" onClick={() => onSelect(recipe)}>
                📌 Select Recipe
              </button>
            )}
            <button className="close-button" onClick={onClose}>
              ×
            </button>
          </div>
        </div>

        <div className="modal-body">
          <div className="recipe-info">
            <div className="recipe-meta">
              <span className="category">📂 {recipe.category}</span>
              <span className="prep-time">⏱️ Prep: {recipe.prep_time}</span>
              <span className="cook-time">🔥 Cook: {recipe.cook_time}</span>
              <span className="difficulty">📊 {recipe.difficulty}</span>
              {recipe.estimated_calories && (
                <span className="calories">🔥 ~{recipe.estimated_calories} calories</span>
              )}
            </div>

            {recipe.sustainability && (
              <div className="recipe-sustainability-modal">
                <h3>🌱 Sustainability</h3>
                <div className="sustainability-overview">
                  <div className="sustainability-score">
                    <span className={`sustainability-level ${recipe.sustainability.level}`}>
                      {recipe.sustainability.level.toUpperCase()}
                    </span>
                    <span className="sustainability-details">
                      Score: {recipe.sustainability.score}/3
                    </span>
                  </div>
                  <div className="environmental-impact">
                    <div className="impact-item">
                      <span className="impact-label">Carbon Footprint:</span>
                      <span className="impact-value">{recipe.sustainability.carbon_footprint}kg CO₂</span>
                    </div>
                    <div className="impact-item">
                      <span className="impact-label">Water Usage:</span>
                      <span className="impact-value">{recipe.sustainability.water_usage}L</span>
                    </div>
                  </div>
                </div>
                <div className="sustainability-breakdown">
                  <h4>Ingredient Breakdown:</h4>
                  <div className="breakdown-list">
                    {recipe.sustainability.breakdown.map((item, index) => (
                      <div key={index} className="breakdown-item">
                        <span className="ingredient-name">{item.ingredient}</span>
                        <span className={`ingredient-level ${item.level}`}>
                          {item.level}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {recipe.match && (
            <div className="ingredient-classification">
              <h4>Ingredient Analysis</h4>
              
              {recipe.match.critical_missing.length > 0 && (
                <div className="classification-group">
                  <span className="classification-label critical">
                    ❌ Critical Missing ({recipe.match.critical_missing.length})
                  </span>
                  <div className="classification-items">
                    {recipe.match.critical_missing.map((ingredient, index) => (
                      <div key={index} className="classification-item">
                        {ingredient}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {recipe.match.important_missing.length > 0 && (
                <div className="classification-group">
                  <span className="classification-label important">
                    ⚠️ Important Missing ({recipe.match.important_missing.length})
                  </span>
                  <div className="classification-items">
                    {recipe.match.important_missing.map((ingredient, index) => (
                      <div key={index} className="classification-item">
                        {ingredient}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {recipe.match.replaceable_missing.length > 0 && (
                <div className="classification-group">
                  <span className="classification-label replaceable">
                    ✅ Replaceable Missing ({recipe.match.replaceable_missing.length})
                  </span>
                  <div className="classification-items">
                    {recipe.match.replaceable_missing.map((ingredient, index) => (
                      <div key={index} className="classification-item">
                        {ingredient}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {Object.keys(recipe.match.substitution_suggestions).length > 0 && (
                <div className="substitution-suggestions">
                  <h5>💡 Substitution Suggestions:</h5>
                  {Object.entries(recipe.match.substitution_suggestions).map(([ingredient, suggestions]) => (
                    <div key={ingredient} style={{ marginBottom: '0.5rem' }}>
                      <strong>{ingredient}:</strong>
                      <div className="substitution-list">
                        {suggestions.map((suggestion, index) => (
                          <span key={index} className="substitution-item">
                            {suggestion}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="recipe-content">
            <div className="ingredients-section">
              <h3>Ingredients</h3>
              <div className="ingredients-list">
                {recipe.ingredients && recipe.ingredients.map((ingredient, index) => (
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
                {recipe.instructions && recipe.instructions.map((step, index) => (
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
                  <span className="stat-value">{recipe.match.missing ? recipe.match.missing.length : 0}</span>
                  <span className="stat-label">Missing</span>
                </div>
              </div>
              
              {recipe.match.missing && recipe.match.missing.length > 0 && (
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
          <button className="close-modal-button" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecipeModal;
