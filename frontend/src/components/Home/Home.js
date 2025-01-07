import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Home.css';

function Home() {
  const [restaurants, setRestaurants] = useState([]);
  const [filteredRestaurants, setFilteredRestaurants] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/restaurants');
        setRestaurants(response.data);
        setFilteredRestaurants(response.data);
      } catch (error) {
        setError(error.message);
        console.error('Error fetching restaurants:', error);
      }
    };

    fetchRestaurants();
  }, []);

  useEffect(() => {
    const results = restaurants.filter(restaurant =>
      (restaurant.name && restaurant.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (restaurant.address && restaurant.address.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredRestaurants(results);
  }, [searchTerm, restaurants]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleCardClick = (restaurantId) => {
    navigate(`/restaurant/${restaurantId}`);
  };

  return (
    <div className="home-page">
      <div className="search-container">
      <form className="form" action="#!" role="search">
        <label htmlFor="search">
          <input
            required=""
            autoComplete="off"
            placeholder="Search restaurants by name or location..."
            id="search"
            type="search"
            name="search"
            value={searchTerm}
            onChange={handleSearch}
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
            <svg viewBox="0 0 20 20" height="20" width="20">
              <path d="M10,8.6 L16,14.5 M10,14.5 L16,8.6" strokeWidth="1.5" stroke="currentColor"></path>
            </svg>
          </button>
        </label>
      </form>
      </div>

      {error && <p className="error-message">Error: {error}</p>}

      <div className="restaurant-list">
        {filteredRestaurants.length > 0 ? (
          filteredRestaurants.map((restaurant) => (
            <div
              key={restaurant._id}
              className="restaurant-card"
              onClick={() => handleCardClick(restaurant._id)}
            >
              <img
                src={restaurant.image || 'https://via.placeholder.com/150'}
                alt={restaurant.name}
                className="restaurant-image"
              />
              <div className="restaurant-info">
                <h3>{restaurant.name}</h3>
                <p>{restaurant.address || 'Address not available'}</p>
              </div>
            </div>
          ))
        ) : (
          <p className="no-data">
            {searchTerm ? 'No restaurants found matching your search' : 'No restaurants available'}
          </p>
        )}
      </div>
    </div>
  );
}

export default Home;