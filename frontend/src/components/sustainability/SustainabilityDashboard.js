import React from 'react';

const SustainabilityDashboard = ({ selectedIngredients }) => {
  const [analysis, setAnalysis] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    if (selectedIngredients.length > 0) {
      analyzeRecipe();
    } else {
      setAnalysis(null);
    }
  }, [selectedIngredients]);

  const analyzeRecipe = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/sustainability/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ingredients: selectedIngredients
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
  };

  const getScoreColor = (score) => {
    if (score >= 80) return '#4CAF50';
    if (score >= 60) return '#FF9800';
    return '#F44336';
  };

  const getScoreLabel = (score) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    return 'Needs Improvement';
  };

  if (selectedIngredients.length === 0) {
    return (
      <section className="sustainability-dashboard">
        <div className="container">
          <div className="dashboard-header">
            <h3>🌱 Sustainability & Health Dashboard</h3>
            <p>Add ingredients to see sustainability and health analysis</p>
          </div>
          <div className="empty-state">
            <div className="empty-icon">🌿</div>
            <p>No ingredients selected yet</p>
            <small>Select ingredients above to get sustainability insights</small>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="sustainability-dashboard">
      <div className="container">
        <div className="dashboard-header">
          <h3>🌱 Sustainability & Health Dashboard</h3>
          <p>Analysis for {selectedIngredients.length} ingredient{selectedIngredients.length !== 1 ? 's' : ''}</p>
        </div>
        
        {loading ? (
          <div className="loading">
            <div className="spinner"></div>
            <p>Analyzing your ingredients...</p>
          </div>
        ) : error ? (
          <div className="error-state">
            <div className="error-icon">⚠️</div>
            <p>{error}</p>
            <button className="btn" onClick={analyzeRecipe}>
              Try Again
            </button>
          </div>
        ) : analysis ? (
          <div className="analysis-grid">
            {/* Sustainability Score */}
            <div className="score-card sustainability">
              <div className="score-header">
                <h4>🌱 Sustainability Score</h4>
                <div 
                  className="score-circle" 
                  style={{ backgroundColor: analysis.sustainability.color }}
                >
                  {analysis.sustainability.grade}
                </div>
              </div>
              <p className="score-label">{analysis.sustainability.label}</p>
              <div className="score-details">
                <div className="carbon-footprint">
                  <span className="carbon-label">Carbon Footprint:</span>
                  <span className="carbon-value">{analysis.sustainability.carbonFootprint}kg CO₂</span>
                </div>
                <div className="score-number">
                  Score: {analysis.sustainability.score}/100
                </div>
              </div>
            </div>

            {/* Health Score */}
            <div className="score-card health">
              <div className="score-header">
                <h4>💚 Health Score</h4>
                <div 
                  className="score-circle" 
                  style={{ backgroundColor: analysis.health.color }}
                >
                  {analysis.health.grade}
                </div>
              </div>
              <p className="score-label">{analysis.health.label}</p>
              <div className="score-details">
                <div className="nutritional-info">
                  <span className="calories">~{analysis.health.nutritionalInfo.estimatedCalories} calories</span>
                </div>
                <div className="score-number">
                  Score: {analysis.health.score}/100
                </div>
              </div>
            </div>

            {/* Sustainability Tips */}
            <div className="tips-card">
              <h4>🌱 Sustainability Tips</h4>
              <ul className="tips-list">
                {analysis.sustainability.tips.map((tip, index) => (
                  <li key={index} className="tip-item">{tip}</li>
                ))}
              </ul>
            </div>

            {/* Health Benefits */}
            <div className="tips-card">
              <h4>💚 Health Benefits</h4>
              <ul className="tips-list">
                {analysis.health.benefits.map((benefit, index) => (
                  <li key={index} className="tip-item">{benefit}</li>
                ))}
              </ul>
            </div>

            {/* Nutritional Info */}
            <div className="nutrition-card">
              <h4>📊 Nutritional Information</h4>
              <div className="nutrition-grid">
                <div className="nutrition-item">
                  <span className="nutrition-label">Protein:</span>
                  <span className="nutrition-value">{analysis.health.nutritionalInfo.protein}g</span>
                </div>
                <div className="nutrition-item">
                  <span className="nutrition-label">Fiber:</span>
                  <span className="nutrition-value">{analysis.health.nutritionalInfo.fiber}g</span>
                </div>
                <div className="nutrition-item">
                  <span className="nutrition-label">Vitamins:</span>
                  <span className="nutrition-value">{analysis.health.nutritionalInfo.vitamins}</span>
                </div>
                <div className="nutrition-item">
                  <span className="nutrition-label">Minerals:</span>
                  <span className="nutrition-value">{analysis.health.nutritionalInfo.minerals}</span>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
};

export default SustainabilityDashboard;
