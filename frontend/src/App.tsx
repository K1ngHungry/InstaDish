import React, { useState } from 'react';
import './App.css';
import Header from './components/Header';
import IngredientInput from './components/IngredientInput';
import RecipeResults from './components/RecipeResults';
import RecipeModal from './components/RecipeModal';
import Chatbot from './components/Chatbot';
import SustainabilityDashboard from './components/SustainabilityDashboard';
import { useIngredients } from './hooks/useIngredients';
import { useRecipes } from './hooks/useRecipes';

function App() {
  const { selectedIngredients, addIngredient, removeIngredient } = useIngredients();
  const { recipes, loading, error, searchRecipes } = useRecipes();
  const [selectedRecipe, setSelectedRecipe] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);

  const handleSearch = async () => {
    await searchRecipes(selectedIngredients);
  };

  const handleRecipeClick = async (recipeId: number) => {
    try {
      const response = await fetch(`http://localhost:8000/api/recipes/${recipeId}`);
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

  const handleSelectRecipe = (recipe: any) => {
    setSelectedRecipe(recipe);
    setShowModal(false);
    // You could also show a notification that the recipe was selected
  };

  return (
    <div className="App">
      <Header />
      
      <main className="main-content">
        <section className="ingredient-section">
          <IngredientInput 
            onAddIngredient={addIngredient}
            onRemoveIngredient={removeIngredient}
            selectedIngredients={selectedIngredients}
          />
          
          <div className="search-section">
            <button 
              className="search-button"
              onClick={handleSearch}
              disabled={loading || selectedIngredients.length === 0}
            >
              {loading ? 'Searching...' : 'Find Recipes'}
            </button>
          </div>
        </section>

        <section className="results-section">
          <RecipeResults 
            recipes={recipes}
            loading={loading}
            error={error}
            onRecipeClick={handleRecipeClick}
          />
        </section>

        <section className="sustainability-section">
          <SustainabilityDashboard selectedIngredients={selectedIngredients} />
        </section>

        <section className="chatbot-section">
          <Chatbot userIngredients={selectedIngredients} selectedRecipe={selectedRecipe} />
        </section>
      </main>

      {showModal && selectedRecipe && (
        <RecipeModal 
          recipe={selectedRecipe}
          onClose={closeModal}
          onSelect={handleSelectRecipe}
        />
      )}
    </div>
  );
}

export default App;