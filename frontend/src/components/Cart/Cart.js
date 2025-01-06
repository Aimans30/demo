import React from "react";
import "./Cart.css"; // Import the CSS file

function Cart({ cartItems, onClose, onPlaceOrder }) {
  // Calculate the total price of items in the cart
  const totalPrice = cartItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  return (
    <div className="cart-overlay">
      <div className="cart-container">
        {/* Cart Header */}
        <div className="cart-header">
          <h2>My Orders</h2>
          {/* Close button triggers the onClose function */}
          <button
            className="close-button"
            onClick={() => {
              if (typeof onClose === "function") {
                onClose(); // Execute the onClose function
              } else {
                console.error("onClose is not a valid function");
              }
            }}
          >
            X
          </button>
        </div>

        {/* Cart Items */}
        <div className="cart-items">
          {cartItems.length === 0 ? (
            <p>Your cart is empty.</p>
          ) : (
            cartItems.map((item) => (
              <div className="cart-item" key={item.id}>
                <div className="item-info">
                  <span className="item-name">{item.name}</span>
                  <span className="item-size"> ({item.size})</span>
                </div>
                <div className="item-quantity">
                  <span>x {item.quantity}</span>
                </div>
                <div className="item-price">
                  <span>₹{item.price * item.quantity}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Cart Footer */}
        <div className="cart-footer">
          <div className="total">
            <span>Total:</span>
            <span>₹{totalPrice}</span>
          </div>
          <button
            className="place-order-button"
            onClick={onPlaceOrder}
            disabled={cartItems.length === 0}
          >
            Place Order
          </button>
        </div>
      </div>
    </div>
  );
}

export default Cart;

