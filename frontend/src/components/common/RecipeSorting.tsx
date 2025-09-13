import React from 'react';

interface RecipeSortingProps {
  sortBy: string;
  sortOrder: string;
  onSortChange: (sortBy: string, sortOrder: string) => void;
}

const RecipeSorting: React.FC<RecipeSortingProps> = ({ 
  sortBy, 
  sortOrder, 
  onSortChange 
}) => {
  const sortOptions = [
    { value: 'match', label: 'Ingredient Match', icon: '' },
    { value: 'sustainability', label: 'Sustainability', icon: '' },
    { value: 'health', label: 'Health Score', icon: '' }
  ];

  const handleSortByChange = (newSortBy: string) => {
    onSortChange(newSortBy, sortOrder);
  };

  const handleSortOrderChange = (newSortOrder: string) => {
    onSortChange(sortBy, newSortOrder);
  };

  return (
    <div className="recipe-sorting">
      <div className="sorting-controls">
        <div className="sort-by-section">
          <label htmlFor="sort-by">Sort by:</label>
          <select
            id="sort-by"
            value={sortBy}
            onChange={(e) => handleSortByChange(e.target.value)}
            className="sort-select"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.icon} {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="sort-order-section">
          <label htmlFor="sort-order">Order:</label>
          <select
            id="sort-order"
            value={sortOrder}
            onChange={(e) => handleSortOrderChange(e.target.value)}
            className="sort-select"
          >
            <option value="desc">High to Low</option>
            <option value="asc">Low to High</option>
          </select>
        </div>
      </div>

      <div className="sorting-info">
        <span className="current-sort">
          Currently sorting by: <strong>{sortOptions.find(opt => opt.value === sortBy)?.icon} {sortOptions.find(opt => opt.value === sortBy)?.label}</strong> ({sortOrder === 'desc' ? 'High to Low' : 'Low to High'})
        </span>
      </div>
    </div>
  );
};

export default RecipeSorting;
