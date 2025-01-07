import React, { useState } from "react";
import "./Cart.css";
import axios from "axios";
import { useNavigate } from "react-router-dom"; 

function Cart({ cartItems, onClose, onPlaceOrder, updateQuantity }) {
  const [showAddressPrompt, setShowAddressPrompt] = useState(false);
  const [address, setAddress] = useState("");
  const [addressError, setAddressError] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const navigate = useNavigate();

  const handlePlaceOrder = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Please login to place an order");
      }

      // Get the restaurant ID from the first cart item
      const restaurantId = cartItems[0]?.restaurantId;
      if (!restaurantId) {
        throw new Error("Invalid restaurant information");
      }

      // Format order items
      const formattedItems = cartItems.map(item => ({
        menuItem: item.id,
        quantity: item.quantity,
        size: item.size
      }));

      // Calculate total amount
      const totalAmount = cartItems.reduce(
        (total, item) => total + item.price * item.quantity,
        0
      );

      // Create order payload
      const orderPayload = {
        restaurant: restaurantId,
        items: formattedItems,
        totalAmount: totalAmount
      };

      // Send order to server
      const response = await axios.post("/api/orders", orderPayload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data && response.data.order) {
        setShowConfirmation(true);
        setTimeout(() => {
          setShowConfirmation(false);
          onClose();
          navigate("/your-orders");
        }, 3000);
      }
    } catch (error) {
      console.error("Error placing order:", error);
      setAddressError(error.response?.data?.message || error.message);
    }
  };

  const handleAddressSubmit = async (event) => {
    event.preventDefault();
    setAddressError(""); // Reset error message

    if (!address.trim()) {
      setAddressError("Please enter an address.");
      return;
    }

    try {
      // Update user profile with the new address
      const token = localStorage.getItem("token");
      await axios.put(
        "/api/users/profile",
        { address },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Close the prompt and place the order
      setShowAddressPrompt(false);
      await onPlaceOrder(); // Call the original onPlaceOrder (App.js)
      setShowConfirmation(true); // Show confirmation message
      setTimeout(() => {
        setShowConfirmation(false);
        onClose(); // Close the cart
        navigate("/your-orders"); // Navigate to "Your Orders" page
      }, 3000); // Adjust the timeout as needed
    } catch (error) {
      console.error("Error updating profile:", error);
      setAddressError("Failed to update address. Please try again.");
    }
  };

  const handleAddressChange = (event) => {
    setAddress(event.target.value);
  };

  if (!cartItems || cartItems.length === 0) {
    return (
      <div className="cart-overlay">
        <div className="cart-container">
          <div className="cart-header">
            <h2>My Orders</h2>
            <button className="close-button" onClick={onClose}>X</button>
          </div>
          <div className="cart-items">
            <p>Your cart is empty.</p>
          </div>
          <div className="cart-footer">
            <div className="total">
              <span>Total:</span>
              <span>₹0</span>
            </div>
            <button className="place-order-button" disabled>
              Place Order
            </button>
          </div>
        </div>
      </div>
    );
  }

  const totalPrice = cartItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  return (
    <div className="cart-overlay">
      <div className="cart-container">
        <div className="cart-header">
          <h2>My Orders</h2>
          {cartItems.length > 0 && <h3>{cartItems[0].restaurantName}</h3>}
          <button className="close-button" onClick={onClose}>X</button>
        </div>

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
            <span>₹{totalPrice}</span>
          </div>
          <button className="place-order-button" onClick={handlePlaceOrder}>
            Place Order
          </button>
        </div>

        {/* Order Confirmation Message */}
        {showConfirmation && (
          <div className="order-confirmation">
            <p>Order placed successfully!</p>
          </div>
        )}

        {/* Address Prompt */}
        {showAddressPrompt && (
          <div className="address-prompt-overlay">
            <div className="address-prompt-container">
              <form onSubmit={handleAddressSubmit}>
                <label htmlFor="address">Enter your address:</label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={address}
                  onChange={handleAddressChange}
                  placeholder="Enter your address"
                  required
                />
                {addressError && <p className="error-message">{addressError}</p>}
                <div className="address-prompt-buttons">
                  <button type="submit">Submit</button>
                  <button
                    type="button"
                    onClick={() => setShowAddressPrompt(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Cart;
