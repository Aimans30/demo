import React, { useEffect, useState } from "react";
import "./YourOrders.css"; // Optional: Add styles for this page if needed

const YourOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch orders from your backend API
    const fetchOrders = async () => {
      try {
        const response = await fetch("/api/orders"); // Replace with your API endpoint
        if (!response.ok) {
          throw new Error("Failed to fetch orders");
        }
        const data = await response.json();
        setOrders(data.orders); // Update this according to your API response structure
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  if (loading) {
    return <div className="your-orders-loading">Loading your orders...</div>;
  }

  if (error) {
    return <div className="your-orders-error">Error: {error}</div>;
  }

  return (
    <div className="your-orders-container">
      <h1>Your Orders</h1>
      {orders.length === 0 ? (
        <p>No orders found.</p>
      ) : (
        <ul className="your-orders-list">
          {orders.map((order) => (
            <li key={order._id} className="your-order-item">
              <div className="order-details">
                <p><strong>Order ID:</strong> {order._id}</p>
                <p><strong>Restaurant:</strong> {order.restaurant}</p>
                <p><strong>Total Amount:</strong> ${order.totalAmount}</p>
                <p><strong>Status:</strong> {order.status}</p>
                <p><strong>Ordered At:</strong> {new Date(order.createdAt).toLocaleString()}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default YourOrders;
