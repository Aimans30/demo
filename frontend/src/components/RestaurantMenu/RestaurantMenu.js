import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import './RestaurantMenu.css';
import Loader from '../Loader/Loader'; // Import the Loader component

function RestaurantMenu({ addToCart }) {
  const [restaurant, setRestaurant] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { id } = useParams();
  const [popupVisible, setPopupVisible] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true); // Added loading state
  const [loaderTimeout, setLoaderTimeout] = useState(null); // Added timeout state

  useEffect(() => {
    const fetchRestaurant = async () => {
      setLoading(true); // Set loading to true before fetching

      // Set a timeout to hide the loader after 30min 
      const timeout = setTimeout(() => {
        setLoading(false);
        setError('Request timed out. Please try again.');
      }, 1860000); // 30min
      setLoaderTimeout(timeout);

      try {
        const token = localStorage.getItem('token');
        const config = {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        };

        const response = await axios.get(`http://localhost:5000/api/restaurants/${id}`, config);
        const restaurantData = response.data;

        const updatedMenu = restaurantData.menu.map(item => {
          const sizes = Object.keys(item.sizes);
          if (sizes.length === 1) {
            return {
              ...item,
              selectedSize: sizes[0],
              quantity: 1
            };
          } else {
            return {
              ...item,
              selectedSize: 'Small',
              quantity: 1
            };
          }
        });

        setRestaurant({
          ...restaurantData,
          menu: updatedMenu
        });
        setError(null);
      } catch (error) {
        console.error('Error fetching restaurant:', error);
        setError(error.response?.data?.message || 'Error fetching restaurant details');
      } finally {
        setLoading(false); // Set loading to false after data fetch or error
        clearTimeout(loaderTimeout); // Clear the timeout
      }
    };

    fetchRestaurant();

    // Cleanup function to clear the timeout if the component unmounts
    return () => {
      if (loaderTimeout) {
        clearTimeout(loaderTimeout);
      }
    };
  }, [id]);

  const handleSizeChange = (itemId, size) => {
    setRestaurant(prevState => ({
      ...prevState,
      menu: prevState.menu.map(menuItem => {
        if (menuItem._id === itemId) {
          return {
            ...menuItem,
            selectedSize: size,
          };
        }
        return menuItem;
      }),
    }));
  };

  const handleQuantityChange = (itemId, increment) => {
    setRestaurant(prevState => ({
      ...prevState,
      menu: prevState.menu.map(menuItem => {
        if (menuItem._id === itemId) {
          const newQuantity = (menuItem.quantity || 0) + increment;
          return {
            ...menuItem,
            quantity: Math.max(newQuantity, 0),
          };
        }
        return menuItem;
      }),
    }));
  };

  const handleAddToCart = (item) => {
    if (item.selectedSize) {
      const itemToCart = {
        id: item._id,
        name: item.itemName,
        price: item.sizes[item.selectedSize],
        quantity: item.quantity || 1,
        size: item.selectedSize,
        restaurantId: id,
        restaurantName: restaurant.name
      };

      addToCart(itemToCart);
      handleQuantityChange(item._id, -item.quantity);
      setPopupVisible(true);
      setTimeout(() => setPopupVisible(false), 3000);
    } else {
      alert('Please select a size before adding to cart.');
    }
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const filteredMenu = restaurant ? restaurant.menu.filter(item =>
    item.itemName.toLowerCase().includes(searchQuery.toLowerCase())
  ) : [];

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (loading && !restaurant) {
    return <Loader />; // Show loader only if loading is true and restaurant data is not yet available
  }

  return (
    <div className="restaurant-menu-page">
      <h2>{restaurant.name}</h2>
      {restaurant.image && (
        <img 
          src={restaurant.image} 
          alt={restaurant.name} 
          className="restaurant-image"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = '/api/placeholder/400/300';
          }}
        />
      )}
      <p>{restaurant.address}</p>

      <div className="search-bar">
        <input
          type="text"
          placeholder="Search for items..."
          value={searchQuery}
          onChange={handleSearchChange}
          className="search-input"
        />
      </div>

      <h3>Menu:</h3>
      <div className="menu-list">
        {filteredMenu.length > 0 ? (
          filteredMenu.map(item => (
            <div key={item._id} className="menu-card">
              <h4>{item.itemName}</h4>
              <p>₹{item.sizes[item.selectedSize] || Object.values(item.sizes)[0]}</p>

              <div className="dropdown-selector">
                <label htmlFor={`size-${item._id}`}>Size:</label>
                <select
                  id={`size-${item._id}`}
                  value={item.selectedSize || ''}
                  onChange={(e) => handleSizeChange(item._id, e.target.value)}
                >
                  {Object.keys(item.sizes).map(size => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
              </div>

              <div className="quantity-counter">
                <button
                  className="quantity-btn"
                  disabled={!item.quantity || item.quantity <= 0}
                  onClick={() => handleQuantityChange(item._id, -1)}
                >
                  -
                </button>
                <input
                  type="text"
                  value={item.quantity || 0}
                  readOnly
                  className="quantity-input"
                />
                <button 
                  className="quantity-btn"
                  onClick={() => handleQuantityChange(item._id, 1)}
                >
                  +
                </button>
              </div>
              <div className="add-to-cart-container">
                <button
                  className="add-to-cart"
                  onClick={() => handleAddToCart(item)}
                  disabled={!item.quantity || item.quantity <= 0}
                >
                  Add to Cart
                </button>
              </div>
            </div>
          ))
        ) : (
          <p className="no-items">No menu items found</p>
        )}
      </div>

      {popupVisible && (
        <div className="popup show">
          <p>Item added to cart!</p>
        </div>
      )}
    </div>
  );
}

export default RestaurantMenu;