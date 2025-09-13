import React from 'react';
import './App.css';
import { Header, IngredientInput } from './components/common';
import { RecipeResults, RecipeModal } from './components/recipe';
import { Chatbot } from './components/chatbot';
import { SustainabilityDashboard } from './components/sustainability';
import { useIngredients } from './hooks/useIngredients';
import { useRecipes } from './hooks/useRecipes';

function App() {
  const { selectedIngredients, addIngredient, removeIngredient } = useIngredients();
  const { recipes, loading, error, searchRecipes } = useRecipes();
  const [selectedRecipe, setSelectedRecipe] = React.useState(null);
  const [showModal, setShowModal] = React.useState(false);

  const handleSearch = async () => {
    await searchRecipes(selectedIngredients);
  };

  const handleRecipeClick = async (recipeId) => {
    try {
      const response = await fetch(`/api/recipes/${recipeId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSelectedRecipe(data.data);
          setShowModal(true);
        }
      }
    } catch (error) {
      console.error('Error fetching recipe details:', error);
      alert('Sorry, there was an error loading the recipe details.');
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedRecipe(null);
  };

  return (
    <div className="App">
      <Header />
      
      <main className="main-content">
        <IngredientInput 
          selectedIngredients={selectedIngredients}
          onAddIngredient={addIngredient}
          onRemoveIngredient={removeIngredient}
          onSearch={handleSearch}
          loading={loading}
        />

        <SustainabilityDashboard selectedIngredients={selectedIngredients} />
        
        <RecipeResults 
          recipes={recipes}
          loading={loading}
          error={error}
          onRecipeClick={handleRecipeClick}
        />
      </main>

      <Chatbot 
        onRecipeClick={handleRecipeClick} 
        selectedIngredients={selectedIngredients}
      />
      
      {showModal && selectedRecipe && (
        <RecipeModal 
          recipe={selectedRecipe}
          onClose={closeModal}
        />
      )}
    </div>
  );
}

export default App;