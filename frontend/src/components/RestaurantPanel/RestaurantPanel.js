import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './RestaurantPanel.css';

const RestaurantPanel = () => {
  const [orders, setOrders] = useState([]);
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [view, setView] = useState('orders');
  const [orderFilter, setOrderFilter] = useState('all');
  const [showAddItemForm, setShowAddItemForm] = useState(false);
  const [showEditItemForm, setShowEditItemForm] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const [newItem, setNewItem] = useState({
    name: '',
    category: '',
    sizes: {},
  });

  const [editItemData, setEditItemData] = useState({
    name: '',
    category: '',
    sizes: {},
  });

  useEffect(() => {
    const fetchOrdersAndMenu = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const [ordersResponse, menuResponse] = await Promise.all([
          axios.get('/api/restaurant/orders', {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get('/api/restaurant/menu', {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (ordersResponse.data && Array.isArray(ordersResponse.data)) {
          const sortedOrders = ordersResponse.data.sort((a, b) =>
            new Date(b.createdAt) - new Date(a.createdAt)
          );
          setOrders(sortedOrders);
        } else {
          setError('Invalid orders data format received from server');
        }

        if (menuResponse.data && Array.isArray(menuResponse.data)) {
          setMenu(menuResponse.data);
        } else {
          setError('Invalid menu data format received from server');
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch data.');
      } finally {
        setLoading(false);
      }
    };

    if (localStorage.getItem('userRole') === 'restaurant') {
      fetchOrdersAndMenu();
      const intervalId = setInterval(fetchOrdersAndMenu, 30000);
      return () => clearInterval(intervalId);
    }
  }, []);

  const handleOrderStatusUpdate = async (orderId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `/api/restaurant/orders/${orderId}`,
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

  const handleAddItem = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/restaurant/menu', newItem, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setMenu([...menu, response.data]);
      setNewItem({ name: '', category: '', sizes: {} });
      setShowAddItemForm(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add menu item.');
    }
  };

  const handleEditItem = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.patch(
        `/api/restaurant/menu/${selectedItem._id}`,
        editItemData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMenu(menu.map(item => item._id === selectedItem._id ? response.data : item));
      setShowEditItemForm(false);
      setSelectedItem(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to edit menu item.');
    }
  };

  return (
    <div className="restaurant-panel">
      <h1>Restaurant Panel</h1>
      <div className="toggle-buttons">
        <button onClick={() => setView('orders')} className={view === 'orders' ? 'active' : ''}>View Orders</button>
        <button onClick={() => setView('menu')} className={view === 'menu' ? 'active' : ''}>Edit Menu</button>
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : error ? (
        <div className="error">{error}</div>
      ) : (
        <>
          {view === 'orders' && (
            <div>
              <h2>Orders</h2>
              <table>
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(order => (
                    <tr key={order._id}>
                      <td>{order._id}</td>
                      <td>{order.customer.username}</td>
                      <td>₹{order.totalAmount}</td>
                      <td>{order.orderStatus}</td>
                      <td>
                        {order.orderStatus === 'Placed' && (
                          <button onClick={() => handleOrderStatusUpdate(order._id, 'Accepted')}>Accept</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {view === 'menu' && (
            <div>
              <h2>Menu</h2>
              <button onClick={() => setShowAddItemForm(true)}>Add Item</button>
              {menu.map(item => (
                <div key={item._id}>{item.name}</div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default RestaurantPanel;
