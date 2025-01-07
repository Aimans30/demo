import React, { useEffect, useState } from "react";
import "./YourOrders.css";

const OrderStatusBadge = ({ status }) => {
  const getStatusColor = () => {
    switch (status) {
      case 'Placed':
        return 'status-pending';
      case 'Accepted':
        return 'status-accepted';
      case 'Preparing':
        return 'status-preparing';
      case 'Ready':
        return 'status-ready';
      case 'Delivered':
        return 'status-delivered';
      case 'Cancelled':
        return 'status-cancelled';
      default:
        return 'status-unknown';
    }
  };

  const getStatusMessage = () => {
    if (status === 'Placed') {
      return 'Waiting for restaurant confirmation';
    }
    return status;
  };

  return (
    <span className={`status-badge ${getStatusColor()}`}>
      {getStatusMessage()}
    </span>
  );
};

const YourOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("Authentication required");
        }

        const response = await fetch("/api/orders", {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error("Failed to fetch orders");
        }
        
        const data = await response.json();
        const sortedOrders = data.orders.sort((a, b) => 
          new Date(b.createdAt) - new Date(a.createdAt)
        );
        setOrders(sortedOrders);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();

    // Set up polling for real-time updates
    const intervalId = setInterval(fetchOrders, 10000); // Poll every 10 seconds
    return () => clearInterval(intervalId);
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
        <div className="orders-list">
          {orders.map((order) => (
            <div key={order._id} className="order-card">
              <div className="order-header">
                <h3>{order.restaurant?.name || "Restaurant"}</h3>
                <OrderStatusBadge status={order.orderStatus} />
              </div>
              <div className="order-details">
                <p className="order-time">
                  Ordered on: {new Date(order.createdAt).toLocaleString()}
                </p>
                <div className="order-items">
                  {order.items?.map((item, index) => (
                    <div key={index} className="order-item">
                      <span className="item-name">{item.menuItem.itemName}</span>
                      <span className="item-size">({item.size})</span>
                      <span className="item-quantity">x{item.quantity}</span>
                      <span className="item-price">₹{item.price}</span>
                    </div>
                  ))}
                </div>
                <div className="order-total">
                  <span>Total Amount:</span>
                  <span className="total-amount">₹{order.totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default YourOrders;