import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import './RestaurantMenu.css';

function RestaurantMenu({ addToCart }) {
  const [restaurant, setRestaurant] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { id } = useParams();
  const [popupVisible, setPopupVisible] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRestaurant = async () => {
      try {
        const token = localStorage.getItem('token');
        const config = {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        };

        // Fetch restaurant data
        const response = await axios.get(`http://localhost:5000/api/restaurants/${id}`, config);
        const restaurantData = response.data;

        // Set default size for each menu item
        const updatedMenu = restaurantData.menu.map(item => {
          const sizes = Object.keys(item.sizes);
          if (sizes.length === 1) {
            // If there's only one size, set it to "1pc" and default quantity to 1
            return {
              ...item,
              selectedSize: sizes[0], // Set the single size as default
              quantity: 1 // Default quantity for single-size items
            };
          } else {
            // If multiple sizes, set default size to "Small" and quantity to 1
            return {
              ...item,
              selectedSize: 'Small', // Default size for multiple sizes
              quantity: 1 // Default quantity
            };
          }
        });

        // Update restaurant data with the modified menu
        setRestaurant({
          ...restaurantData,
          menu: updatedMenu
        });
        setError(null);
      } catch (error) {
        console.error('Error fetching restaurant:', error);
        setError(error.response?.data?.message || 'Error fetching restaurant details');
      }
    };

    fetchRestaurant();
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
      
      // Reset quantity after adding to cart
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

  if (!restaurant) {
    return <div className="loading-message">Loading...</div>;
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
                  {/* Removed the "Select Size" option */}
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