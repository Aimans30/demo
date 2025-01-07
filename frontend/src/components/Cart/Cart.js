import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Cart.css";

function Cart({ cartItems, onClose, onPlaceOrder, updateQuantity }) {
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const navigate = useNavigate();

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

  const handlePlaceOrder = async () => {
    try {
      setIsPlacingOrder(true);
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Please log in to place an order");
        return;
      }

      const orderData = {
        items: cartItems.map(item => ({
          menuItem: item.id,
          quantity: item.quantity,
          size: item.size,
          price: item.price
        })),
        restaurantId: cartItems[0].restaurantId,
        totalAmount: totalPrice
      };

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(orderData)
      });

      if (!response.ok) {
        throw new Error("Failed to place order");
      }

      alert("Order placed successfully! Redirecting to your orders...");
      onPlaceOrder();
      navigate("/your-orders");
    } catch (error) {
      alert(error.message || "Failed to place order");
    } finally {
      setIsPlacingOrder(false);
    }
  };

  return (
    <div className="cart-overlay">
      <div className="cart-container">
        <div className="cart-header">
          <h2>My Orders</h2>
          <h3>{cartItems[0].restaurantName}</h3>
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
                  onClick={() => updateQuantity(item.id, item.size, -1)}
                  disabled={isPlacingOrder}
                >
                  -
                </button>
                <span>x {item.quantity}</span>
                <button 
                  className="quantity-btn"
                  onClick={() => updateQuantity(item.id, item.size, 1)}
                  disabled={isPlacingOrder}
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
          <button 
            className="place-order-button" 
            onClick={handlePlaceOrder}
            disabled={isPlacingOrder}
          >
            {isPlacingOrder ? "Placing Order..." : "Place Order"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Cart;