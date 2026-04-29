import { useState } from 'react';

export default function SearchBar({ onSearch, categories, selectedCategory, onCategoryChange }) {
  const [query, setQuery] = useState('');

  function handleInput(e) {
    setQuery(e.target.value);
    onSearch(e.target.value);
  }

  return (
    <div className="search-bar">
      <input
        type="text"
        placeholder="Search prompts by title, content, or tag..."
        value={query}
        onChange={handleInput}
        className="search-input"
      />
      <select
        value={selectedCategory}
        onChange={(e) => onCategoryChange(e.target.value)}
        className="category-filter"
      >
        <option value="">All Categories</option>
        {categories.map((cat) => (
          <option key={cat} value={cat}>{cat}</option>
        ))}
      </select>
    </div>
  );
}
