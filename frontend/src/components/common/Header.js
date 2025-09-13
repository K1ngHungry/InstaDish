import React from 'react';

const Header = () => {
  return (
    <header className="header">
      <div className="container">
        <div className="header-content">
          <div className="header-logo">
            <h1>🍽️ InstaDish</h1>
            <p>AI-powered recipe discovery with sustainability insights</p>
          </div>
          <div className="header-features">
            <div className="feature-badge">
              <span className="badge-icon">🤖</span>
              <span>AI Assistant</span>
            </div>
            <div className="feature-badge">
              <span className="badge-icon">🌱</span>
              <span>Sustainability</span>
            </div>
            <div className="feature-badge">
              <span className="badge-icon">⚡</span>
              <span>Instant Matching</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
