import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import './RestaurantMenu.css';

function RestaurantMenu({ addToCart }) {
  const [restaurant, setRestaurant] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { id } = useParams();
  const [popupVisible, setPopupVisible] = useState(false);

  useEffect(() => {
    const fetchRestaurant = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/restaurants/${id}`);
        setRestaurant(response.data);
      } catch (error) {
        console.error(error);
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

  if (!restaurant) {
    return <p>Loading...</p>;
  }

  return (
    <div className="restaurant-menu-page">
      <h2>{restaurant.name}</h2>
      <img src={restaurant.image} alt={restaurant.name} className="restaurant-image" />
      <p>{restaurant.address}</p>

      <div className="search-bar">
        <input
          type="text"
          placeholder="Search for items..."
          value={searchQuery}
          onChange={handleSearchChange}
        />
      </div>

      <h3>Menu:</h3>
      <div className="menu-list">
        {filteredMenu.map(item => (
          <div key={item._id} className="menu-card">
            <h4>{item.itemName}</h4>
            <p>₹{item.sizes[item.selectedSize]}</p>

            <div className="dropdown-selector">
              <label htmlFor={`size-${item._id}`}>Size:</label>
              <select
                id={`size-${item._id}`}
                value={item.selectedSize || ''}
                onChange={(e) => handleSizeChange(item._id, e.target.value)}
              >
                <option value="">Select Size</option>
                {Object.keys(item.sizes).map(size => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
            </div>

            <div className="quantity-counter">
              <button
                disabled={!item.quantity || item.quantity <= 0}
                onClick={() => handleQuantityChange(item._id, -1)}
              >
                -
              </button>
              <input
                type="text"
                value={item.quantity || 0}
                readOnly
              />
              <button onClick={() => handleQuantityChange(item._id, 1)}>
                +
              </button>
            </div>

            <button
              className="add-to-cart"
              onClick={() => handleAddToCart(item)}
              disabled={!item.quantity || item.quantity <= 0}
            >
              Add to Cart
            </button>
          </div>
        ))}
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
