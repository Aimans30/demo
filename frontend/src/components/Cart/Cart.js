import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Cart.css';
import Loader from '../Loader/Loader'; // Import the Loader component

const Cart = ({ cartItems, onClose, onPlaceOrder, updateQuantity }) => {
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [error, setError] = useState(null);
  const [address, setAddress] = useState('');
  const [showAddressPopup, setShowAddressPopup] = useState(false);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [loading, setLoading] = useState(false); // Added loading state

  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserAddress = async () => {
      setLoading(true); // Show loader while fetching address
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('You must be logged in to view your address.');
          return;
        }

        const response = await axios.get('http://localhost:5000/api/users/profile', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setAddress(response.data.address || '');
      } catch (error) {
        console.error('Error fetching user address:', error);
        if (error.response?.status === 401) {
          setError('Your session has expired. Please log in again.');
        } else {
          setError('Error fetching user address. Please try again.');
        }
      } finally {
        setLoading(false); // Hide loader after fetching address
      }
    };

    fetchUserAddress();
  }, []);

  const handlePlaceOrder = async () => {
    if (!address) {
      setError('Please provide a valid address.');
      return;
    }

    setLoading(true); // Show loader while placing order
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('You must be logged in to place an order.');
        return;
      }

      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      };

      const orderData = {
        restaurant: cartItems[0].restaurantId,
        items: cartItems.map(item => ({
          menuItem: item.id,
          quantity: item.quantity,
          size: item.size,
        })),
        totalAmount: calculateTotal(),
        address,
      };

      const response = await axios.post('http://localhost:5000/api/orders', orderData, config);

      if (response.status === 201) {
        setOrderPlaced(true);
        onPlaceOrder();

        setTimeout(() => {
          setOrderPlaced(false);
          navigate('/your-orders');
        }, 3000);
      }
    } catch (error) {
      console.error('Error placing order:', error);
      if (error.response?.status === 401) {
        setError('Your session has expired. Please log in again.');
      } else {
        setError('Error placing order. Please try again.');
      }
    } finally {
      setLoading(false); // Hide loader after placing order
    }
  };

  const handleSaveAddress = async () => {
    setLoading(true); // Show loader while saving address
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('You must be logged in to save your address.');
        return;
      }

      const response = await axios.patch(
        'http://localhost:5000/api/users/profile/address',
        { address },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.status === 200) {
        setShowAddressPopup(false);
        setIsEditingAddress(false);
        handlePlaceOrder();
      }
    } catch (error) {
      console.error('Error saving address:', error);
      if (error.response?.status === 401) {
        setError('Your session has expired. Please log in again.');
      } else {
        setError('Error saving address. Please try again.');
      }
    } finally {
      setLoading(false); // Hide loader after saving address
    }
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  if (loading) {
    return <Loader />; // Show loader while loading
  }

  return (
    <div className="cart-overlay">
      <div className="cart-container">
        <div className="cart-header">
          <h2>My Orders</h2>
          <h3>{cartItems[0]?.restaurantName}</h3>
          <button className="close-button" onClick={onClose}>X</button>
        </div>

        {cartItems.length === 0 ? (
          <div className="cart-items">
            <p>Your cart is empty.</p>
          </div>
        ) : (
          <>
            <div className="cart-items">
              {cartItems.map((item) => (
                <div className="cart-item" key={`${item.id}-${item.size}`}>
                  <div className="item-info">
                    <span className="item-name">{item.name}</span>
                    <span className="item-size"> ({item.size})</span>
                  </div>
                  <div className="item-quantity">
                    <button
                      className="quantity-btn"
                      aria-label="Decrease quantity"
                      onClick={() => updateQuantity(item.id, item.size, -1)}
                    >
                      -
                    </button>
                    <span>x {item.quantity}</span>
                    <button
                      className="quantity-btn"
                      aria-label="Increase quantity"
                      onClick={() => updateQuantity(item.id, item.size, 1)}
                    >
                      +
                    </button>
                  </div>
                  <div className="item-price">
                    <span>₹{item.price * item.quantity}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="cart-footer">
              <div className="total">
                <span>Total:</span>
                <span>₹{calculateTotal()}</span>
              </div>
              <button className="place-order-button" onClick={() => setShowAddressPopup(true)}>
                Place Order
              </button>
            </div>
          </>
        )}

        {showAddressPopup && (
          <div className="address-popup">
            <h3>{isEditingAddress ? 'Edit Address' : 'Confirm Address'}</h3>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Enter your delivery address"
            />
            <div className="address-popup-buttons">
              <button onClick={handleSaveAddress}>Save & Place Order</button>
              <button onClick={() => setShowAddressPopup(false)}>Cancel</button>
            </div>
          </div>
        )}

        {orderPlaced && (
          <div className="popup show">
            <p>Order placed successfully!</p>
            <p className="waiting-text">Waiting for confirmation...</p>
          </div>
        )}

        {error && (
          <div className="popup error show">
            <p>{error}</p>
            <button onClick={() => setError(null)}>Close</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;