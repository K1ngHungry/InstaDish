import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="header">
      <div className="header-content">
        <h1 className="logo">
          🍳 InstaDish
        </h1>
        <p className="tagline">
          AI-Powered Recipe Discovery & Sustainability Analysis
        </p>
      </div>
    </header>
  );
};

export default Header;
