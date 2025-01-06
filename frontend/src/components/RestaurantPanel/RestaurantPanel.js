import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './RestaurantPanel.css';

const RestaurantPanel = () => {
  const [orders, setOrders] = useState([]);
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddItemForm, setShowAddItemForm] = useState(false);
  const [showEditItemForm, setShowEditItemForm] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [view, setView] = useState('orders'); // 'orders' or 'menu'

  // State for adding a new item
  const [newItem, setNewItem] = useState({
    name: '',
    category: '',
    sizes: {},
  });

  // State for editing an item
  const [editItemData, setEditItemData] = useState({
    name: '',
    category: '',
    sizes: {},
  });

  const token = localStorage.getItem('userToken');
  const authHeader = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await axios.get('/api/restaurant/orders', authHeader);
        setOrders(response.data);
      } catch (err) {
        setError('Failed to fetch orders.');
      } finally {
        setLoading(false);
      }
    };

    const fetchMenu = async () => {
      try {
        const response = await axios.get('/api/restaurant/menu', authHeader);
        setMenu(response.data);
      } catch (err) {
        setError('Failed to fetch menu.');
      }
    };

    if (localStorage.getItem('userRole') === 'restaurant') {
      fetchOrders();
      fetchMenu();
    }
  }, []);

  const handleOrderStatusUpdate = async (orderId, newStatus) => {
    try {
      await axios.patch(`/api/restaurant/orders/${orderId}`, { status: newStatus }, authHeader);
      // Update the orders list (fetch again or update state directly)
      const response = await axios.get('/api/restaurant/orders', authHeader);
      setOrders(response.data);
    } catch (err) {
      setError('Failed to update order status.');
    }
  };

  const handleAddItem = async () => {
    try {
        console.log('Sending newItem:', newItem); // Log the data
      const response = await axios.post('http://localhost:5000/api/restaurant/menu', newItem, authHeader);
      
      // Update the menu state with the newly added item
      setMenu(prevMenu => [...prevMenu, response.data]);
      
      // Reset the form
      setNewItem({
        name: '',
        category: '',
        sizes: {},
      });
      
      // Hide the add item form
      setShowAddItemForm(false);
    } catch (err) {
      console.error('Failed to add item:', err);
      setError('Failed to add item.');
    }
  };
  

  const handleEditItem = async () => {
    try {
      const response = await axios.patch(`/api/restaurant/menu/${selectedItem._id}`, editItemData, authHeader);
      setMenu(menu.map(item => item._id === selectedItem._id ? response.data : item));
      setEditItemData({ // Reset the form
        name: '',
        category: '',
        sizes: {},
      });
      setShowEditItemForm(false);
      setSelectedItem(null);
    } catch (err) {
      setError('Failed to edit item.');
    }
  };

  const handleDeleteItem = async (itemId) => {
    try {
      await axios.delete(`/api/restaurant/menu/${itemId}`, authHeader);
      setMenu(menu.filter(item => item._id !== itemId));
    } catch (err) {
      setError('Failed to delete item.');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (showAddItemForm) {
      setNewItem(prev => ({
        ...prev,
        [name]: value
      }));
    } else if (showEditItemForm) {
      setEditItemData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSizeInputChange = (e, size) => {
    const { value } = e.target;

    const parsedValue = value === '' ? null : parseFloat(value);

    if (showAddItemForm) {
        setNewItem((prev) => ({
            ...prev,
            sizes: {
                ...prev.sizes,
                [size]: parsedValue,
            },
        }));
    } else if (showEditItemForm) {
        setEditItemData((prev) => ({
            ...prev,
            sizes: {
                ...prev.sizes,
                [size]: parsedValue,
            },
        }));
    }
};

  const handleEditClick = (item) => {
    setSelectedItem(item);
    setEditItemData(item);
    setShowEditItemForm(true);
    setShowAddItemForm(false); // Hide add item form if it's open
  };

  if (localStorage.getItem('userRole') !== 'restaurant') {
    return <div className="error-message">Access Restricted</div>;
  }

  return (
    <div className="restaurant-panel">
      <h1>Restaurant Panel</h1>

      {/* Toggle Buttons */}
      <div className="toggle-buttons">
        <button
          className={view === 'orders' ? 'active' : ''}
          onClick={() => setView('orders')}
        >
          View Orders
        </button>
        <button
          className={view === 'menu' ? 'active' : ''}
          onClick={() => setView('menu')}
        >
          Edit Menu
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="loading">Loading...</div>
      ) : (
        <>
          {/* Conditional Rendering based on 'view' state */}
          {view === 'orders' && (
            <section className="orders-section">
              <h2>Orders</h2>
              <table>
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Items</th>
                    <th>Total</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(order => (
                    <tr key={order._id}>
                      <td>{order._id}</td>
                      <td>{order.customer.username}</td>
                      <td>
                        <ul>
                          {order.items.map(item => (
                            <li key={item.menuItem._id}>
                              {item.menuItem.name} ({item.size}) - Qty: {item.quantity}
                            </li>
                          ))}
                        </ul>
                      </td>
                      <td>{order.totalAmount}</td>
                      <td>
                        <button onClick={() => handleOrderStatusUpdate(order._id, 'Accepted')}>
                          Accept
                        </button>
                        <button onClick={() => handleOrderStatusUpdate(order._id, 'Rejected')}>
                          Reject
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}

          {view === 'menu' && (
            <section className="menu-section">
              <h2>Menu</h2>
              <button onClick={() => {
                setShowAddItemForm(true);
                setShowEditItemForm(false); // Hide edit form
                setSelectedItem(null); // Clear selected item
              }}>Add Item</button>

              {showAddItemForm && (
                <div className="add-item-form">
                  <h3>Add Menu Item</h3>
                  <input type="text" name="name" placeholder="Name" value={newItem.name} onChange={handleInputChange} />
                  <input type="text" name="category" placeholder="Category" value={newItem.category} onChange={handleInputChange} />

                  {/* Size inputs */}
                  <input type="number" name="smallPrice" placeholder="Small Size Price" onChange={(e) => handleSizeInputChange(e, 'Small')} />
                  <input type="number" name="mediumPrice" placeholder="Medium Size Price" onChange={(e) => handleSizeInputChange(e, 'Medium')} />
                  <input type="number" name="largePrice" placeholder="Large Size Price" onChange={(e) => handleSizeInputChange(e, 'Large')} />

                  <button onClick={handleAddItem}>Add Item</button>
                  <button onClick={() => setShowAddItemForm(false)}>Cancel</button>
                </div>
              )}

              {showEditItemForm && selectedItem && (
                <div className="edit-item-form">
                  <h3>Edit Menu Item</h3>
                  <input type="text" name="name" placeholder="Name" value={editItemData.name} onChange={handleInputChange} />
                  <input type="text" name="category" placeholder="Category" value={editItemData.category} onChange={handleInputChange} />

                  {/* Size inputs */}
                  <input type="number" name="smallPrice" placeholder="Small Size Price" value={editItemData.sizes.Small || ''} onChange={(e) => handleSizeInputChange(e, 'Small')} />
                  <input type="number" name="mediumPrice" placeholder="Medium Size Price" value={editItemData.sizes.Medium || ''} onChange={(e) => handleSizeInputChange(e, 'Medium')} />
                  <input type="number" name="largePrice" placeholder="Large Size Price" value={editItemData.sizes.Large || ''} onChange={(e) => handleSizeInputChange(e, 'Large')} />

                  <button onClick={handleEditItem}>Save Changes</button>
                  <button onClick={() => {
                    setShowEditItemForm(false);
                    setSelectedItem(null);
                  }}>Cancel</button>
                </div>
              )}

              <div className="menu-list">
                {menu.map(item => (
                  <div key={item._id} className="menu-item">
                    <h4>{item.name}</h4>
                    {/* Display other item details if needed */}
                    <button onClick={() => handleEditClick(item)}>Edit</button>
                    <button onClick={() => handleDeleteItem(item._id)}>Delete</button>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
};

export default RestaurantPanel;