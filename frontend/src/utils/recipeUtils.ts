/**
 * Utility functions for cleaning and formatting recipe data
 */

/**
 * Clean ingredient strings (backend already does LLM cleaning, this is just a safety net)
 */
export const cleanIngredients = (ingredients: string[]): string[] => {
  return ingredients.filter(ing => ing && ing.trim().length > 0);
};

/**
 * Clean instruction strings (backend already does LLM cleaning, this is just a safety net)
 */
export const cleanInstructions = (instructions: string[]): string[] => {
  return instructions.filter(inst => inst && inst.trim().length > 0);
};

/**
 * Format ingredients for display (first N items with "more" indicator)
 */
export const formatIngredientsPreview = (ingredients: string[], maxItems: number = 3): string => {
  const cleanIngs = cleanIngredients(ingredients);
  const preview = cleanIngs.slice(0, maxItems).join(', ');
  const remaining = cleanIngs.length - maxItems;
  
  if (remaining > 0) {
    return `${preview} +${remaining} more`;
  }
  
  return preview;
};

/**
 * Format instructions for display (first N items with "more" indicator)
 */
export const formatInstructionsPreview = (instructions: string[], maxItems: number = 2): string => {
  const cleanInsts = cleanInstructions(instructions);
  const preview = cleanInsts.slice(0, maxItems).join('. ');
  const remaining = cleanInsts.length - maxItems;
  
  if (remaining > 0) {
    return `${preview}... +${remaining} more steps`;
  }
  
  return preview;
};

/**
 * Clean and format missing ingredients for display
 */
export const formatMissingIngredients = (missingIngredients: string[], maxItems: number = 2): string => {
  const cleaned = missingIngredients.filter(ing => ing && ing.trim().length > 0);
  
  const preview = cleaned.slice(0, maxItems).join(', ');
  const remaining = cleaned.length - maxItems;
  
  if (remaining > 0) {
    return `${preview} +${remaining} more`;
  }
  
  return preview;
};
