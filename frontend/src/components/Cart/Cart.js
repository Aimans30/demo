import React, { useEffect, useState } from 'react';
import './Cart.css';

function Cart() {
  const [cart, setCart] = useState([]);
  
  // Load cart from local storage on mount
  useEffect(() => {
    const savedCart = JSON.parse(localStorage.getItem('cartItems')) || [];
    setCart(savedCart);
  }, []);

  // Function to remove item from cart
  const handleRemoveFromCart = (itemId) => {
    setCart(prevCart => {
      const updatedCart = prevCart.filter(item => item.id !== itemId);
      localStorage.setItem('cartItems', JSON.stringify(updatedCart));
      return updatedCart;
    });
  };

  // Function to add item to cart
  const handleAddToCart = (item) => {
    setCart(prevCart => {
      const existingItemIndex = prevCart.findIndex(cartItem => cartItem.id === item.id);
      if (existingItemIndex !== -1) {
        const updatedCart = [...prevCart];
        updatedCart[existingItemIndex] = item;
        localStorage.setItem('cartItems', JSON.stringify(updatedCart));
        return updatedCart;
      } else {
        const updatedCart = [...prevCart, item];
        localStorage.setItem('cartItems', JSON.stringify(updatedCart));
        return updatedCart;
      }
    });
  };

  // Calculate total price
  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  return (
    <div className="cart-page">
      <h2>Your Cart</h2>
      {cart.length === 0 ? (
        <p>Your cart is empty.</p>
      ) : (
        <div className="cart-items">
          {cart.map(item => (
            <div key={item.id} className="cart-item">
              <h4>{item.name}</h4>
              <p>₹{item.price.toFixed(2)}</p>
              <p>Quantity: {item.quantity}</p>
              <button
                className="remove-button"
                onClick={() => handleRemoveFromCart(item.id)}
              >
                Remove
              </button>
            </div>
          ))}
          <div className="cart-total">
            <h3>Total: ₹{getTotalPrice().toFixed(2)}</h3>
          </div>
        </div>
      )}
    </div>
  );
}

export default Cart;
