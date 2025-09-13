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
  if (!ingredients || ingredients.length === 0) {
    return '';
  }

  // Handle case where ingredients might be a JSON string
  let ingredientList: string[] = [];
  
  if (typeof ingredients === 'string') {
    try {
      const parsed = JSON.parse(ingredients);
      ingredientList = Array.isArray(parsed) ? parsed : [ingredients];
    } catch {
      // If JSON parsing fails, treat as single string
      ingredientList = [ingredients];
    }
  } else if (Array.isArray(ingredients)) {
    ingredientList = ingredients;
  } else {
    ingredientList = [String(ingredients)];
  }

  // Clean and filter ingredients
  const cleanIngs = ingredientList
    .filter(ing => ing && ing.trim().length > 0)
    .map(ing => {
      // Remove any remaining JSON artifacts
      const cleaned = String(ing).replace(/^\[?"|"\]?$/g, '').trim();
      return cleaned;
    })
    .filter(ing => ing.length > 0);

  if (cleanIngs.length === 0) {
    return '';
  }

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
  if (!instructions || instructions.length === 0) {
    return '';
  }

  // Handle case where instructions might be a JSON string
  let instructionList: string[] = [];
  
  if (typeof instructions === 'string') {
    try {
      const parsed = JSON.parse(instructions);
      instructionList = Array.isArray(parsed) ? parsed : [instructions];
    } catch {
      // If JSON parsing fails, treat as single string
      instructionList = [instructions];
    }
  } else if (Array.isArray(instructions)) {
    instructionList = instructions;
  } else {
    instructionList = [String(instructions)];
  }

  // Clean and filter instructions
  const cleanInsts = instructionList
    .filter(inst => inst && inst.trim().length > 0)
    .map(inst => {
      // Remove any remaining JSON artifacts
      const cleaned = String(inst).replace(/^\[?"|"\]?$/g, '').trim();
      return cleaned;
    })
    .filter(inst => inst.length > 0);

  if (cleanInsts.length === 0) {
    return '';
  }

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
  if (!missingIngredients || missingIngredients.length === 0) {
    return '';
  }

  // Handle case where missingIngredients might be a JSON string
  let ingredients: string[] = [];
  
  if (typeof missingIngredients === 'string') {
    try {
      const parsed = JSON.parse(missingIngredients);
      ingredients = Array.isArray(parsed) ? parsed : [missingIngredients];
    } catch {
      // If JSON parsing fails, treat as single string
      ingredients = [missingIngredients];
    }
  } else if (Array.isArray(missingIngredients)) {
    ingredients = missingIngredients;
  } else {
    ingredients = [String(missingIngredients)];
  }

  // Clean and filter ingredients
  const cleaned = ingredients
    .filter(ing => ing && ing.trim().length > 0)
    .map(ing => {
      // Remove any remaining JSON artifacts
      const cleaned = String(ing).replace(/^\[?"|"\]?$/g, '').trim();
      return cleaned;
    })
    .filter(ing => ing.length > 0);
  
  if (cleaned.length === 0) {
    return '';
  }
  
  const preview = cleaned.slice(0, maxItems).join(', ');
  const remaining = cleaned.length - maxItems;
  
  if (remaining > 0) {
    return `${preview} +${remaining} more`;
  }
  
  return preview;
};
