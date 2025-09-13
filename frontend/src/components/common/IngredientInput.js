import React from 'react';

const IngredientInput = ({ 
  selectedIngredients, 
  onAddIngredient, 
  onRemoveIngredient, 
  onSearch, 
  loading 
}) => {
  const [inputValue, setInputValue] = React.useState('');

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddIngredient();
    }
  };

  const handleAddIngredient = () => {
    if (inputValue.trim()) {
      const success = onAddIngredient(inputValue);
      if (success) {
        setInputValue('');
      } else {
        // Ingredient already exists
        setInputValue('');
      }
    }
  };

  const handleSearch = () => {
    if (selectedIngredients.length > 0) {
      onSearch();
    }
  };

  return (
    <section className="ingredient-input-section">
      <div className="container">
        <div className="ingredient-input-container">
          <div className="input-section">
            <h2>What ingredients do you have?</h2>
            <p>Add ingredients to find matching recipes and get AI-powered cooking advice</p>
            
            <div className="input-group">
              <input 
                type="text" 
                value={inputValue}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                placeholder="Type an ingredient and press Enter..."
                className="input ingredient-input"
                disabled={loading}
              />
              <button 
                onClick={handleAddIngredient}
                className="btn btn-secondary"
                disabled={loading || !inputValue.trim()}
              >
                Add
              </button>
            </div>
          </div>

          <div className="ingredients-display">
            <div className="ingredients-header">
              <h3>Selected Ingredients ({selectedIngredients.length})</h3>
              {selectedIngredients.length > 0 && (
                <button 
                  onClick={() => selectedIngredients.forEach(onRemoveIngredient)}
                  className="btn btn-warning"
                  disabled={loading}
                >
                  Clear All
                </button>
              )}
            </div>
            
            <div className="ingredient-tags">
              {selectedIngredients.length === 0 ? (
                <div className="empty-state">
                  <p>No ingredients selected yet</p>
                  <small>Start adding ingredients to find recipes!</small>
                </div>
              ) : (
                selectedIngredients.map((ingredient, index) => (
                  <div key={index} className="ingredient-tag">
                    <span>{ingredient}</span>
                    <button 
                      className="remove-btn" 
                      onClick={() => onRemoveIngredient(ingredient)}
                      disabled={loading}
                      aria-label={`Remove ${ingredient}`}
                    >
                      ×
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="search-section">
            <button 
              onClick={handleSearch}
              className="btn search-btn"
              disabled={loading || selectedIngredients.length === 0}
            >
              {loading ? (
                <>
                  <div className="spinner"></div>
                  Finding Recipes...
                </>
              ) : (
                <>
                  🔍 Find Recipes
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default IngredientInput;
