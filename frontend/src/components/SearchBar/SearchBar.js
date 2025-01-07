import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './SearchBar.css';

function SearchBar({ restaurantId = null }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [isFocused, setIsFocused] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    setSearchTerm(''); // Clear search term on page change
    setResults([]);
  }, [location]);

  const handleChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleSearch = async () => {
    try {
      let response;
      if (restaurantId) {
        // Search within a specific restaurant's menu
        response = await axios.get(`/api/restaurants/${restaurantId}/menu/search?q=${searchTerm}`);
        setResults(response.data);
      } else {
        // Search for restaurants
        response = await axios.get(`/api/restaurants/search?q=${searchTerm}`);
        setResults(response.data);
      }
    } catch (error) {
      console.error('Error searching:', error);
      setResults([]);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    handleSearch();
  };

  const clearSearch = () => {
    setSearchTerm('');
    setResults([]);
    setIsFocused(false);
  };

  const handleResultClick = (result) => {
    if (restaurantId) {
      // Handle clicking on a menu item (e.g., highlight it)
      console.log('Menu item clicked:', result);
    } else {
      // Navigate to the restaurant's page
      navigate(`/restaurant/${result._id}`);
    }
  };

  return (
    <div className="search-bar-container">
      <form className="form" onSubmit={handleSubmit}>
        <label htmlFor="search-input">
          <input
            type="text"
            id="search-input"
            value={searchTerm}
            onChange={handleChange}
            onFocus={() => setIsFocused(true)}
            required
            placeholder="Search..."
          />
          <div className="icon" onClick={handleSearch}>
            {/* Search Icon */}
            <svg
              viewBox="0 0 512 512"
              className={`swap-on ${isFocused ? 'active' : ''}`}
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M416 208c0 45.9-14.9 88.3-40 122.7L502.6 457.4c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L330.7 376c-34.4 25.2-76.8 40-122.7 40C93.1 416 0 322.9 0 208S93.1 0 208 0S416 93.1 416 208zM208 352a144 144 0 1 0 0-288 144 144 0 1 0 0 288z"
                fill="currentColor"
              />
            </svg>
            {/* Close Icon */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 512 512"
              className={`swap-off ${isFocused ? 'active' : ''}`}
            >
              <path
                d="M504.1 256C504.1 119 393 7.9 256 7.9S7.9 119 7.9 256 119 504.1 256 504.1 504.1 393 504.1 256zM256 440c-70.7 0-128-57.3-128-128s57.3-128 128-128 128 57.3 128 128-57.3 128-128 128zm75.3-187.3c4.7-4.7 4.7-12.3 0-17l-20.7-20.7c-4.7-4.7-12.3-4.7-17 0L256 282.7l-54.3-54.3c-4.7-4.7-12.3-4.7-17 0l-20.7 20.7c-4.7 4.7-4.7 12.3 0 17l54.3 54.3-54.3 54.3c-4.7 4.7-4.7 12.3 0 17l20.7 20.7c4.7 4.7 12.3 4.7 17 0l54.3-54.3 54.3 54.3c4.7 4.7 12.3 4.7 17 0l20.7-20.7c4.7-4.7 4.7-12.3 0-17l-54.3-54.3 54.3-54.3z"
                fill="currentColor"
              />
            </svg>
          </div>
          <button type="button" className="close-btn" onClick={clearSearch}>
            X
          </button>
        </label>
      </form>

      {/* Display search results */}
      {results.length > 0 && (
        <ul className="search-results">
          {results.map((result) => (
            <li key={result._id} onClick={() => handleResultClick(result)}>
              {result.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default SearchBar;