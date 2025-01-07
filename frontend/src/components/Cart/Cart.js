import React from "react";
import "./Cart.css";

function Cart({ cartItems, onClose, onPlaceOrder, updateQuantity }) {
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
          <button className="place-order-button" onClick={onPlaceOrder}>
            Place Order
          </button>
        </div>
      </div>
    </div>
  );
}

export default Cart;