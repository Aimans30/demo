import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './RestaurantPanel.css';

axios.defaults.baseURL = 'http://localhost:5000';

const RestaurantPanel = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [restaurantId, setRestaurantId] = useState(null);
  const [activeTab, setActiveTab] = useState('pending');
  const [menu, setMenu] = useState([]);
  const [showAddItemForm, setShowAddItemForm] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [openingTime, setOpeningTime] = useState('');
  const [currentOpeningTime, setCurrentOpeningTime] = useState(null);

  useEffect(() => {
    const fetchRestaurantId = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('/api/users/profile', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.data.restaurant) {
          setRestaurantId(response.data.restaurant._id);
          setIsOpen(response.data.restaurant.isActive || false);
          fetchMenu(response.data.restaurant._id);
          fetchOpeningTime(response.data.restaurant._id); // Fetch opening time
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

  const fetchOrders = useCallback(async () => {
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
  }, [restaurantId]);

  useEffect(() => {
    if (restaurantId) {
      fetchOrders();
      const intervalId = setInterval(fetchOrders, 30000);
      return () => clearInterval(intervalId);
    }
  }, [fetchOrders]);

  const fetchOpeningTime = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/restaurants/${id}/opening-time`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCurrentOpeningTime(response.data.openingTime);
    } catch (error) {
      console.error('Failed to fetch opening time:', error);
    }
  };

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

  const filteredOrders = orders.filter(order => {
    switch (activeTab) {
      case 'pending':
        return ['Placed', 'Accepted', 'Preparing', 'Ready'].includes(order.orderStatus);
      case 'completed':
        return order.orderStatus === 'Delivered';
      case 'cancelled':
        return order.orderStatus === 'Cancelled';
      default:
        return true;
    }
  });

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const formatPrice = (price) => {
    if (isNaN(price)) {
      return '₹0.00';
    }
    return `₹${Number(price).toFixed(2)}`;
  };

  const calculateTotalItems = (orderItems) => {
    return orderItems.reduce((total, item) => total + item.quantity, 0);
  };

  const handleToggleStatus = async () => {
    if (!restaurantId) return;

    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `/api/restaurants/${restaurantId}/toggle-status`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setIsOpen(!isOpen);
      fetchOrders();
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const handleSetOpeningTime = async () => {
    if (!restaurantId || !openingTime) {
      alert('Please select a valid opening time.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `/api/restaurants/${restaurantId}/set-opening-time`,
        { openingTime },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert('Opening time set successfully!');
      fetchOpeningTime(restaurantId); // Refresh the opening time
    } catch (error) {
      console.error('Failed to set opening time:', error);
      alert('Failed to set opening time. Please try again.');
    }
  };

  return (
    <div className="restaurant-panel">
      <div className="dashboard-header">
        <h1>Restaurant Dashboard</h1>
        <div className="toggle-buttons">
          <button
            className={activeTab === 'pending' ? 'active' : ''}
            onClick={() => setActiveTab('pending')}
          >
            Pending Orders
          </button>
          <button
            className={activeTab === 'completed' ? 'active' : ''}
            onClick={() => setActiveTab('completed')}
          >
            Completed Orders
          </button>
          <button
            className={activeTab === 'cancelled' ? 'active' : ''}
            onClick={() => setActiveTab('cancelled')}
          >
            Cancelled Orders
          </button>
        </div>
      </div>
      <div>
        <label>
          Restaurant Status:
          <input
            type="checkbox"
            checked={isOpen}
            onChange={handleToggleStatus}
          />
          {isOpen ? 'Open' : 'Closed'}
        </label>
        <input
          type="datetime-local"
          value={openingTime}
          onChange={(e) => setOpeningTime(e.target.value)}
        />
        <button onClick={handleSetOpeningTime}>Set Opening Time</button>

        {currentOpeningTime && (
          <div>
            <h3>Current Opening Time:</h3>
            <p>{new Date(currentOpeningTime).toLocaleString()}</p>
          </div>
        )}
      </div>
      {loading ? (
        <div className="loading">Loading...</div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : (
        <div className="orders-container">
          {filteredOrders.length === 0 ? (
            <p className="no-orders">No {activeTab} orders found.</p>
          ) : (
            filteredOrders.map((order) => (
              <div key={order._id} className="card">
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
                  {order.orderStatus !== 'Placed' && (
                    <>
                      <p>
                        <strong>Phone:</strong> {order.customer?.phone || 'N/A'}
                      </p>
                      <p>
                        <strong>Address:</strong> {order.customer?.address || 'N/A'}
                      </p>
                    </>
                  )}
                  <p>
                    <strong>Total Items:</strong> {calculateTotalItems(order.items)}
                  </p>
                  <p>
                    <strong>Amount:</strong> {formatPrice(order.totalAmount)}
                  </p>
                  <p>
                    <strong>Ordered at:</strong> {formatDate(order.createdAt)}
                  </p>
                </div>
                <div className="order-items">
                  <h4>Order Items:</h4>
                  <ul>
                    {order.items.map((item, index) => (
                      <li key={index} className="order-item">
                        <div className="item-details">
                          <span className="item-name">{item.menuItem?.name || 'Unknown Item'}</span>
                          <span className="item-size">{item.size}</span>
                          <span className="item-quantity">x{item.quantity}</span>
                          <span className="item-price">{formatPrice(item.price * item.quantity)}</span>
                        </div>
                        {item.notes && (
                          <div className="item-notes">
                            Note: {item.notes}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
                {['Placed', 'Accepted', 'Preparing', 'Ready'].includes(order.orderStatus) && (
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
                    {order.orderStatus === 'Ready' && (
                      <button
                        className="deliver-btn"
                        onClick={() => handleOrderStatusUpdate(order._id, 'Delivered')}
                      >
                        Mark as Delivered
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default RestaurantPanel;