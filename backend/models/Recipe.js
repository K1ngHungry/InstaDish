class Recipe {
  constructor(id, title, ingredients, steps, category, prepTime, cookTime, difficulty) {
    this.id = id;
    this.title = title;
    this.ingredients = ingredients;
    this.steps = steps;
    this.category = category;
    this.prepTime = prepTime;
    this.cookTime = cookTime;
    this.difficulty = difficulty;
  }

  static getAll() {
    return [
      // Italian Recipes
      new Recipe(
        1,
        "Classic Spaghetti Carbonara",
        ["spaghetti", "eggs", "parmesan cheese", "bacon", "black pepper", "garlic", "olive oil"],
        [
          "Cook spaghetti according to package directions until al dente",
          "Fry bacon in a large pan until crispy, remove and chop",
          "Whisk eggs with grated parmesan and black pepper in a bowl",
          "Add hot pasta to the pan with bacon grease",
          "Quickly toss pasta with egg mixture, adding pasta water as needed",
          "Add bacon pieces and serve immediately with extra parmesan"
        ],
        "Italian",
        "10 min",
        "15 min",
        "Medium"
      ),

      new Recipe(
        2,
        "Creamy Mushroom Risotto",
        ["arborio rice", "mushrooms", "onion", "garlic", "white wine", "vegetable broth", "parmesan cheese", "butter", "olive oil"],
        [
          "Sauté mushrooms in butter until golden, set aside",
          "Cook onion and garlic in olive oil until translucent",
          "Add rice and stir for 2 minutes until lightly toasted",
          "Add wine and stir until absorbed",
          "Add warm broth one ladle at a time, stirring constantly",
          "When rice is creamy, stir in mushrooms, butter, and parmesan"
        ],
        "Italian",
        "15 min",
        "25 min",
        "Medium"
      ),

      // Asian Recipes
      new Recipe(
        3,
        "Simple Chicken Stir Fry",
        ["chicken breast", "broccoli", "soy sauce", "garlic", "ginger", "rice", "vegetable oil", "sesame oil"],
        [
          "Cut chicken into bite-sized pieces and season with salt",
          "Heat vegetable oil in a wok or large pan over high heat",
          "Cook chicken until golden brown, about 5-6 minutes",
          "Add garlic and ginger, cook for 30 seconds until fragrant",
          "Add broccoli and stir fry for 3-4 minutes until crisp-tender",
          "Add soy sauce and sesame oil, toss everything together",
          "Serve over steamed rice"
        ],
        "Asian",
        "15 min",
        "10 min",
        "Easy"
      ),

      new Recipe(
        4,
        "Vegetable Pad Thai",
        ["rice noodles", "tofu", "bean sprouts", "carrots", "eggs", "green onions", "peanuts", "lime", "fish sauce", "brown sugar"],
        [
          "Soak rice noodles in warm water for 10 minutes",
          "Cut tofu into cubes and pan-fry until golden",
          "Scramble eggs in the same pan, set aside",
          "Stir-fry carrots and green onions for 2 minutes",
          "Add noodles and sauce, toss everything together",
          "Add tofu, eggs, and bean sprouts",
          "Serve with crushed peanuts and lime wedges"
        ],
        "Asian",
        "20 min",
        "15 min",
        "Medium"
      ),

      // Mediterranean Recipes
      new Recipe(
        5,
        "Mediterranean Quinoa Bowl",
        ["quinoa", "cherry tomatoes", "cucumber", "kalamata olives", "feta cheese", "olive oil", "lemon", "red onion", "fresh herbs"],
        [
          "Cook quinoa according to package directions, let cool",
          "Dice tomatoes, cucumber, and red onion",
          "Mix quinoa with vegetables in a large bowl",
          "Add olives and crumbled feta cheese",
          "Drizzle with olive oil and fresh lemon juice",
          "Season with salt, pepper, and fresh herbs",
          "Toss gently and serve at room temperature"
        ],
        "Mediterranean",
        "10 min",
        "15 min",
        "Easy"
      ),

      new Recipe(
        6,
        "Greek Lemon Chicken",
        ["chicken thighs", "lemon", "oregano", "garlic", "olive oil", "potatoes", "onion", "olives"],
        [
          "Marinate chicken with lemon juice, oregano, garlic, and olive oil",
          "Preheat oven to 400°F (200°C)",
          "Place chicken and vegetables in a baking dish",
          "Add olives and remaining marinade",
          "Bake for 35-40 minutes until chicken is cooked through",
          "Serve with fresh lemon wedges"
        ],
        "Mediterranean",
        "20 min",
        "40 min",
        "Easy"
      ),

      // American Recipes
      new Recipe(
        7,
        "Classic Beef Burger",
        ["ground beef", "hamburger buns", "lettuce", "tomato", "onion", "cheese", "ketchup", "mustard", "pickles"],
        [
          "Season ground beef with salt and pepper",
          "Form into patties, slightly larger than buns",
          "Heat grill or pan over medium-high heat",
          "Cook burgers for 4-5 minutes per side",
          "Add cheese in the last minute of cooking",
          "Toast buns lightly",
          "Assemble with toppings and condiments"
        ],
        "American",
        "15 min",
        "10 min",
        "Easy"
      ),

      new Recipe(
        8,
        "BBQ Pulled Pork",
        ["pork shoulder", "bbq sauce", "brown sugar", "paprika", "garlic powder", "onion powder", "hamburger buns", "coleslaw"],
        [
          "Rub pork with spices and brown sugar",
          "Place in slow cooker with BBQ sauce",
          "Cook on low for 8 hours until tender",
          "Shred pork with two forks",
          "Mix with additional BBQ sauce",
          "Serve on buns with coleslaw"
        ],
        "American",
        "20 min",
        "8 hours",
        "Easy"
      ),

      // Healthy/Veggie Recipes
      new Recipe(
        9,
        "Veggie Power Bowl",
        ["quinoa", "sweet potato", "chickpeas", "spinach", "avocado", "pumpkin seeds", "tahini", "lemon", "olive oil"],
        [
          "Roast cubed sweet potato with olive oil and salt",
          "Cook quinoa according to package directions",
          "Roast chickpeas with spices until crispy",
          "Massage spinach with lemon juice",
          "Arrange all ingredients in bowls",
          "Drizzle with tahini dressing",
          "Top with pumpkin seeds and avocado"
        ],
        "Healthy",
        "20 min",
        "30 min",
        "Easy"
      ),

      new Recipe(
        10,
        "Creamy Tomato Basil Soup",
        ["tomatoes", "onion", "garlic", "basil", "heavy cream", "vegetable broth", "butter", "olive oil", "croutons"],
        [
          "Sauté onion and garlic in butter until soft",
          "Add tomatoes and cook until they break down",
          "Add vegetable broth and bring to a simmer",
          "Blend soup until smooth",
          "Return to pot and add cream and fresh basil",
          "Season with salt and pepper",
          "Serve with croutons and extra basil"
        ],
        "Soup",
        "15 min",
        "25 min",
        "Easy"
      ),

      // Quick & Easy Recipes
      new Recipe(
        11,
        "Quick Veggie Omelet",
        ["eggs", "mushrooms", "spinach", "cheese", "butter", "salt", "pepper", "herbs"],
        [
          "Beat eggs with salt, pepper, and herbs",
          "Sauté mushrooms and spinach in butter",
          "Pour eggs over vegetables in the pan",
          "Cook until edges start to set",
          "Add cheese to one half",
          "Fold omelet in half and serve"
        ],
        "Breakfast",
        "5 min",
        "5 min",
        "Easy"
      ),

      new Recipe(
        12,
        "One-Pot Pasta Primavera",
        ["pasta", "bell peppers", "zucchini", "cherry tomatoes", "garlic", "olive oil", "parmesan cheese", "herbs"],
        [
          "Heat olive oil in a large pot",
          "Sauté garlic and vegetables until tender",
          "Add pasta and enough water to cover",
          "Bring to a boil and cook pasta until al dente",
          "Add cherry tomatoes in the last few minutes",
          "Toss with olive oil, herbs, and parmesan",
          "Serve immediately"
        ],
        "Italian",
        "10 min",
        "15 min",
        "Easy"
      )
    ];
  }

  static findById(id) {
    const recipes = this.getAll();
    return recipes.find(recipe => recipe.id === parseInt(id));
  }

  static findByCategory(category) {
    const recipes = this.getAll();
    return recipes.filter(recipe => 
      recipe.category.toLowerCase() === category.toLowerCase()
    );
  }

  static searchByTitle(searchTerm) {
    const recipes = this.getAll();
    return recipes.filter(recipe =>
      recipe.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  calculateMatch(userIngredients) {
    const userIngredientSet = new Set(
      userIngredients.map(ing => ing.toLowerCase().trim())
    );
    const recipeIngredientSet = new Set(
      this.ingredients.map(ing => ing.toLowerCase().trim())
    );
    
    const matches = [...userIngredientSet].filter(ing => 
      recipeIngredientSet.has(ing)
    );
    const missing = [...recipeIngredientSet].filter(ing => 
      !userIngredientSet.has(ing)
    );
    
    const matchPercentage = Math.round(
      (matches.length / this.ingredients.length) * 100
    );
    
    return {
      matches: matches.length,
      total: this.ingredients.length,
      percentage: matchPercentage,
      missing: missing,
      hasAllIngredients: missing.length === 0
    };
  }

  getEstimatedCalories() {
    // Rough calorie estimation based on ingredient count and type
    let baseCalories = 200;
    this.ingredients.forEach(ingredient => {
      const ing = ingredient.toLowerCase();
      if (ing.includes('meat') || ing.includes('beef') || ing.includes('pork')) {
        baseCalories += 150;
      } else if (ing.includes('cheese') || ing.includes('cream')) {
        baseCalories += 100;
      } else if (ing.includes('oil') || ing.includes('butter')) {
        baseCalories += 80;
      } else if (ing.includes('pasta') || ing.includes('rice') || ing.includes('bread')) {
        baseCalories += 120;
      } else {
        baseCalories += 20;
      }
    });
    return Math.round(baseCalories);
  }
}

module.exports = Recipe;