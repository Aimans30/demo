import React, { useEffect, useState } from "react";
import "./YourOrders.css";
import axios from "axios";

const YourOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setError("Please login to view your orders");
          setLoading(false);
          return;
        }

        const response = await axios.get("/api/orders", {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.data && response.data.orders) {
          const sortedOrders = response.data.orders.sort(
            (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
          );
          setOrders(sortedOrders);
        } else {
          setOrders([]);
        }
      } catch (err) {
        console.error("Error fetching orders:", err);
        setError(err.response?.data?.message || "Failed to fetch orders");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
    const intervalId = setInterval(fetchOrders, 30000);
    return () => clearInterval(intervalId);
  }, []);

  // ... rest of the component code remains the same ...

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
                  <b>Status:</b> {order.status || "Unknown"}
                </p>
                <div className="order-items">
                  <b>Items:</b>
                  <ul>
                    {order.items?.map((item, index) => (
                      <li key={index}>
                        {item.menuItem.name} - {item.quantity} x ({item.size})
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
