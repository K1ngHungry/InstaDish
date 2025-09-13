import React, { useState, useEffect, useCallback } from 'react';

interface SustainabilityDashboardProps {
  selectedIngredients: string[];
}

interface SustainabilityAnalysis {
  overall_score: number;
  sustainability_level: string;
  carbon_footprint: number;
  water_usage: number;
  recommendations: string[];
  ingredient_analysis: Array<{
    ingredient: string;
    sustainability_level: string;
    carbon_footprint: number;
    water_usage: number;
    recommendation: string;
  }>;
}

const SustainabilityDashboard: React.FC<SustainabilityDashboardProps> = ({ selectedIngredients }) => {
  const [analysis, setAnalysis] = useState<SustainabilityAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeRecipe = useCallback(async (ingredients: string[] = selectedIngredients) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('http://localhost:8000/api/sustainability/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ingredients: ingredients
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setAnalysis(data.data);
        } else {
          setError(data.message || 'Failed to analyze ingredients');
        }
      } else {
        setError('Failed to analyze ingredients');
      }
    } catch (error) {
      console.error('Error analyzing recipe:', error);
      setError('Sorry, there was an error analyzing your ingredients.');
    } finally {
      setLoading(false);
    }
  }, [selectedIngredients]);

  useEffect(() => {
    if (selectedIngredients.length > 0) {
      // Limit ingredients to prevent header size issues
      const limitedIngredients = selectedIngredients.slice(0, 50);
      analyzeRecipe(limitedIngredients);
    } else {
      setAnalysis(null);
    }
  }, [selectedIngredients, analyzeRecipe]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#4CAF50';
    if (score >= 60) return '#FF9800';
    return '#F44336';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    return 'Needs Improvement';
  };

  if (selectedIngredients.length === 0) {
    return (
      <div className="sustainability-dashboard">
        <h2>🌱 Sustainability Analysis</h2>
        <p>Add some ingredients to see their environmental impact!</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="sustainability-dashboard">
        <h2>🌱 Sustainability Analysis</h2>
        <div className="loading">Analyzing ingredients...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="sustainability-dashboard">
        <h2>🌱 Sustainability Analysis</h2>
        <div className="error">Error: {error}</div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="sustainability-dashboard">
        <h2>🌱 Sustainability Analysis</h2>
        <p>No analysis available.</p>
      </div>
    );
  }

  return (
    <div className="sustainability-dashboard">
      <h2>🌱 Sustainability Analysis</h2>
      
      <div className="analysis-grid">
        {/* Sustainability Score */}
        <div className="score-card sustainability">
          <div className="score-header">
            <h4>🌱 Sustainability Score</h4>
            <div 
              className="score-circle" 
              style={{ backgroundColor: getScoreColor(analysis.overall_score * 33.33) }}
            >
              {Math.round(analysis.overall_score * 33.33)}%
            </div>
          </div>
          <p className="score-label">{getScoreLabel(analysis.overall_score * 33.33)}</p>
          <div className="score-details">
            <div className="carbon-footprint">
              <span className="carbon-label">Carbon Footprint:</span>
              <span className="carbon-value">{analysis.carbon_footprint}kg CO₂</span>
            </div>
            <div className="score-number">
              Score: {Math.round(analysis.overall_score * 33.33)}/100
            </div>
          </div>
        </div>

        {/* Sustainability Tips */}
        <div className="tips-card">
          <h4>🌱 Sustainability Tips</h4>
          <ul className="tips-list">
            {analysis.recommendations.map((tip, index) => (
              <li key={index} className="tip-item">{tip}</li>
            ))}
          </ul>
        </div>

        {/* Ingredient Analysis */}
        <div className="ingredients-card">
          <h4>🥬 Ingredient Analysis</h4>
          <div className="ingredients-grid">
            {analysis.ingredient_analysis.map((ingredient, index) => (
              <div key={index} className="ingredient-item">
                <span className="ingredient-name">{ingredient.ingredient}</span>
                <span className={`ingredient-level ${ingredient.sustainability_level}`}>
                  {ingredient.sustainability_level}
                </span>
                <span className="ingredient-recommendation">{ingredient.recommendation}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SustainabilityDashboard;
