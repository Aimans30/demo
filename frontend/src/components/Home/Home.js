import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Home.css';

function Home() {
 const [restaurants, setRestaurants] = useState([]);
 const [error, setError] = useState(null);
 const navigate = useNavigate();

 useEffect(() => {
   const fetchRestaurants = async () => {
     try {
       const response = await axios.get('http://localhost:5000/api/restaurants');
       setRestaurants(response.data);
     } catch (error) {
       setError(error.message);
       console.error('Error fetching restaurants:', error);
     }
   };

   fetchRestaurants();
 }, []);

 const handleCardClick = (restaurantId) => {
   navigate(`/restaurant/${restaurantId}`);
 };

 return (
   <div className="home-page">
     {error && <p className="error-message">Error: {error}</p>}
     <div className="restaurant-list">
       {restaurants.length > 0 ? (
         restaurants.map((restaurant) => (
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
         <p className="no-data">No restaurants available</p>
       )}
     </div>
   </div>
 );
}

export default Home;