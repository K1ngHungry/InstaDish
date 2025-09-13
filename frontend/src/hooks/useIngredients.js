import React from 'react';

export const useIngredients = (initialIngredients = []) => {
  const [selectedIngredients, setSelectedIngredients] = React.useState(initialIngredients);

  const addIngredient = React.useCallback((ingredient) => {
    const normalizedIngredient = ingredient.trim().toLowerCase();
    if (normalizedIngredient && !selectedIngredients.includes(normalizedIngredient)) {
      setSelectedIngredients(prev => [...prev, normalizedIngredient]);
      return true; // Successfully added
    }
    return false; // Already exists or invalid
  }, [selectedIngredients]);

  const removeIngredient = React.useCallback((ingredient) => {
    setSelectedIngredients(prev => prev.filter(ing => ing !== ingredient));
  }, []);

  const clearIngredients = React.useCallback(() => {
    setSelectedIngredients([]);
  }, []);

  const setIngredients = React.useCallback((ingredients) => {
    if (Array.isArray(ingredients)) {
      setSelectedIngredients(ingredients);
    }
  }, []);

  const hasIngredient = React.useCallback((ingredient) => {
    return selectedIngredients.includes(ingredient.toLowerCase());
  }, [selectedIngredients]);

  const getIngredientCount = React.useCallback(() => {
    return selectedIngredients.length;
  }, [selectedIngredients]);

  return {
    selectedIngredients,
    addIngredient,
    removeIngredient,
    clearIngredients,
    setIngredients,
    hasIngredient,
    getIngredientCount,
    isEmpty: selectedIngredients.length === 0
  };
};