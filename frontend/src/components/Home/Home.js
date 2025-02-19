import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './Home.css';
import placeholderImage from './placeholder.jpg'; // Import the fallback placeholder image

const Home = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchRestaurants = async () => {
      setLoading(true);
      try {
        const response = await axios.get('http://localhost:5000/api/restaurants');
        const openRestaurants = response.data.filter(restaurant => restaurant.isActive);
        // Sort the restaurants so "chaiza" appears first
        const sortedRestaurants = openRestaurants.sort((a, b) => {
          if (a.name.toLowerCase() === "chaizza") return -1; // Bring "chaizza" to the top
          if (b.name.toLowerCase() === "chaizza") return 1;  // Push other items down
          return 0; // Keep the rest unchanged
        });
        setRestaurants(sortedRestaurants);
        setError(null);
      } catch (err) {
        console.error('Error fetching restaurants:', err.response ? err.response.data : err.message);
        setError('Error fetching restaurant data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurants();
  }, []);

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  // Apply filter only if searchQuery is not empty
  const filteredRestaurants = searchQuery
    ? restaurants.filter(restaurant =>
        restaurant.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : restaurants;

  return (
    <div className="home-page">
      <div className="search-container">
        <form className="form">
          <label htmlFor="searchInput">
            <input
              required=""
              placeholder="Search restaurants by name or location..."
              id="searchInput"
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
            />
            <div className="icon">
              <svg
                strokeWidth="2"
                stroke="currentColor"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="swap-on"
              >
                <path
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                ></path>
              </svg>
              <svg
                strokeWidth="2"
                stroke="currentColor"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="swap-off"
              >
                <path
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                ></path>
              </svg>
            </div>
            <button type="reset" className="close-btn">
              <svg viewBox="0 0 20 20" className="h-5 w-5" xmlns="http://www.w3.org/2000/svg">
                <path
                  clipRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  fillRule="evenodd"
                ></path>
              </svg>
            </button>
          </label>
        </form>
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div>Loading restaurants...</div>
      ) : (
        <div className="restaurant-list">
          {filteredRestaurants.length === 0 ? (
            <div className="no-restaurants">No restaurants available</div>
          ) : (
            filteredRestaurants.map((restaurant) => (
              <Link to={`/restaurant/${restaurant._id}`} key={restaurant._id} className="restaurant-card">
                <img
                  src={restaurant.imageUrl || placeholderImage} // Use restaurant.imageUrl or fallback to placeholder
                  alt={restaurant.name}
                  onError={(e) => {
                    e.target.src = placeholderImage; // Fallback if imageUrl is broken
                  }}
                />
                <div className="restaurant-info">
                  <h3>{restaurant.name}</h3>
                  <p>{restaurant.address}</p>
                </div>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default Home;