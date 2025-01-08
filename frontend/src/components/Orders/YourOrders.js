import React, { useEffect, useState } from "react";
import "./YourOrders.css";

const YourOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch("http://localhost:5000/api/orders", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json(); // Parse error response
          throw new Error(errorData.message || "Failed to fetch orders");
        }

        const data = await response.json();
        setOrders(data.orders);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching orders:", err.message); // Log the error
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
      <h1 className="your-orders-header">Your Orders</h1>
      {orders.length === 0 ? (
        <p className="no-orders">No orders found.</p>
      ) : (
        <ul className="your-orders-list">
          {orders.map((order) => (
            <li key={order._id} className="your-order-item">
              <div className="order-body">
                <p>
                  <b>Restaurant:</b> {order.restaurant?.name || "N/A"}
                </p>
                <p>
                  <b>Ordered At:</b>{" "}
                  {order.createdAt
                    ? new Date(order.createdAt).toLocaleString()
                    : "N/A"}
                </p>
                <p className="order-total">
                  <b>Total Amount:</b> ₹{order.totalAmount?.toFixed(2) || "0.00"}
                </p>
                <p className="order-status">
                  <b>Status:</b> {order.orderStatus || "Unknown"}
                </p>
                <div className="order-items">
                  <b> Items:</b>
                  <ul>
                    {order.items?.map((item, index) => (
                      <li key={index}>
                        {item.name} - {item.quantity}x
                      </li>
                    )) || <li>No items available</li>}
                  </ul>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default YourOrders;