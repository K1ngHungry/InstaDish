import { useState, useCallback } from 'react';

export const useIngredients = () => {
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);

  const addIngredient = useCallback((ingredient: string) => {
    setSelectedIngredients(prev => 
      prev.includes(ingredient) ? prev : [...prev, ingredient]
    );
  }, []);

  const removeIngredient = useCallback((ingredient: string) => {
    setSelectedIngredients(prev => 
      prev.filter(ing => ing !== ingredient)
    );
  }, []);

  const clearIngredients = useCallback(() => {
    setSelectedIngredients([]);
  }, []);

  return {
    selectedIngredients,
    addIngredient,
    removeIngredient,
    clearIngredients
  };
};
