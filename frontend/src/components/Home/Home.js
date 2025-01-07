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
        // Assuming the response structure has a 'restaurants' field
        setRestaurants(response.data.restaurants || []); 
        setFilteredRestaurants(response.data.restaurants || []); 
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
        <input
          type="text"
          placeholder="Search restaurants by name or location..."
          value={searchTerm}
          onChange={handleSearch}
          className="search-input"
        />
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
