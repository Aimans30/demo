import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './RestaurantPanel.css';

// Configure axios defaults
axios.defaults.baseURL = 'http://localhost:5000';

const RestaurantPanel = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [restaurantId, setRestaurantId] = useState(null);
  const [activeTab, setActiveTab] = useState('pending'); // For filtering orders
  const [menu, setMenu] = useState([]);
  const [showAddItemForm, setShowAddItemForm] = useState(false);

  // Fetch restaurant ID on component mount
  useEffect(() => {
    const fetchRestaurantId = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('/api/users/profile', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.data.restaurant) {
          setRestaurantId(response.data.restaurant._id);
          fetchMenu(response.data.restaurant._id); // Fetch menu once we have restaurant ID
        } else {
          setError('No restaurant associated with this account.');
          setLoading(false);
        }
      } catch (err) {
        setError('Failed to fetch restaurant data.');
        setLoading(false);
      }
    };

    fetchRestaurantId();
  }, []);

  // Fetch menu function
  const fetchMenu = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/restaurants/${id}/menu`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMenu(response.data.menu || []);
    } catch (err) {
      console.error('Failed to fetch menu:', err);
    }
  };

  // Fetch orders with periodic refresh
  useEffect(() => {
    const fetchOrders = async () => {
      if (!restaurantId) return;

      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const response = await axios.get(`/api/restaurants/${restaurantId}/orders`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.data && Array.isArray(response.data)) {
          const sortedOrders = response.data.sort(
            (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
          );
          setOrders(sortedOrders);
        } else {
          setError('Invalid orders data format received from server');
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch orders.');
      } finally {
        setLoading(false);
      }
    };

    if (restaurantId) {
      fetchOrders();
      const intervalId = setInterval(fetchOrders, 30000); // Refresh every 30 seconds
      return () => clearInterval(intervalId);
    }
  }, [restaurantId]);

  // Handle order status updates
  const handleOrderStatusUpdate = async (orderId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `/api/restaurants/orders/${orderId}`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setOrders(orders.map(order =>
        order._id === orderId ? { ...order, orderStatus: newStatus } : order
      ));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update order status.');
    }
  };

  // Filter orders based on active tab
  const filteredOrders = orders.filter(order => {
    switch (activeTab) {
      case 'pending':
        return ['Placed', 'Accepted', 'Preparing'].includes(order.orderStatus);
      case 'completed':
        return order.orderStatus === 'Delivered';
      case 'cancelled':
        return order.orderStatus === 'Cancelled';
      default:
        return true;
    }
  });

  // Function to format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  // Function to calculate total items in an order
  const calculateTotalItems = (orderItems) => {
    return orderItems.reduce((total, item) => total + item.quantity, 0);
  };

  return (
    <div className="restaurant-panel">
      <h1>Restaurant Dashboard</h1>
      
      {loading ? (
        <div className="loading">Loading...</div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : (
        <>
          {/* Order Status Tabs */}
          <div className="status-tabs">
            <button 
              className={`tab ${activeTab === 'pending' ? 'active' : ''}`}
              onClick={() => setActiveTab('pending')}
            >
              Pending Orders
            </button>
            <button 
              className={`tab ${activeTab === 'completed' ? 'active' : ''}`}
              onClick={() => setActiveTab('completed')}
            >
              Completed Orders
            </button>
            <button 
              className={`tab ${activeTab === 'cancelled' ? 'active' : ''}`}
              onClick={() => setActiveTab('cancelled')}
            >
              Cancelled Orders
            </button>
          </div>

          {/* Orders List */}
          <div className="orders-list">
            {filteredOrders.length === 0 ? (
              <p className="no-orders">No {activeTab} orders found.</p>
            ) : (
              filteredOrders.map((order) => (
                <div key={order._id} className="order-card">
                  <div className="order-header">
                    <span className="order-id">Order #{order._id.slice(-6)}</span>
                    <span className={`order-status ${order.orderStatus.toLowerCase()}`}>
                      {order.orderStatus}
                    </span>
                  </div>

                  <div className="order-details">
                    <p>
                      <strong>Customer:</strong> {order.customer?.username || 'Anonymous'}
                    </p>
                    <p>
                      <strong>Total Items:</strong> {calculateTotalItems(order.items)}
                    </p>
                    <p>
                      <strong>Amount:</strong> ₹{order.totalAmount}
                    </p>
                    <p>
                      <strong>Ordered at:</strong> {formatDate(order.createdAt)}
                    </p>
                  </div>

                  <div className="order-items">
                    <h4>Order Items:</h4>
                    <ul>
                      {order.items.map((item, index) => (
                        <li key={index}>
                          {item.itemName} - {item.size} - Quantity: {item.quantity}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Order Actions */}
                  {['Placed', 'Accepted', 'Preparing'].includes(order.orderStatus) && (
                    <div className="order-actions">
                      {order.orderStatus === 'Placed' && (
                        <>
                          <button 
                            className="accept-btn"
                            onClick={() => handleOrderStatusUpdate(order._id, 'Accepted')}
                          >
                            Accept
                          </button>
                          <button 
                            className="cancel-btn"
                            onClick={() => handleOrderStatusUpdate(order._id, 'Cancelled')}
                          >
                            Decline
                          </button>
                        </>
                      )}
                      {order.orderStatus === 'Accepted' && (
                        <button 
                          className="prepare-btn"
                          onClick={() => handleOrderStatusUpdate(order._id, 'Preparing')}
                        >
                          Start Preparing
                        </button>
                      )}
                      {order.orderStatus === 'Preparing' && (
                        <button 
                          className="ready-btn"
                          onClick={() => handleOrderStatusUpdate(order._id, 'Ready')}
                        >
                          Mark as Ready
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default RestaurantPanel;