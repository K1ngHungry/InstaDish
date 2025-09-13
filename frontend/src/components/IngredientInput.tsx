import React, { useState } from 'react';

interface IngredientInputProps {
  onAddIngredient: (ingredient: string) => void;
  onRemoveIngredient: (ingredient: string) => void;
  selectedIngredients: string[];
}

const IngredientInput: React.FC<IngredientInputProps> = ({
  onAddIngredient,
  onRemoveIngredient,
  selectedIngredients
}) => {
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !selectedIngredients.includes(inputValue.trim())) {
      onAddIngredient(inputValue.trim());
      setInputValue('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  return (
    <div className="ingredient-input">
      <h2>What ingredients do you have?</h2>
      
      <form onSubmit={handleSubmit} className="ingredient-form">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Enter an ingredient..."
          className="ingredient-field"
        />
        <button type="submit" className="add-button">
          Add
        </button>
      </form>

      {selectedIngredients.length > 0 && (
        <div className="selected-ingredients">
          <h3>Selected Ingredients:</h3>
          <div className="ingredient-tags">
            {selectedIngredients.map((ingredient, index) => (
              <span key={index} className="ingredient-tag">
                {ingredient}
                <button
                  onClick={() => onRemoveIngredient(ingredient)}
                  className="remove-button"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default IngredientInput;
