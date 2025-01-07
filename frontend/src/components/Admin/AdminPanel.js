import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AdminPanel.css';

const AdminPanel = () => {
  const [users, setUsers] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [newRole, setNewRole] = useState({});
  const [newAssociation, setNewAssociation] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersResponse, restaurantsResponse] = await Promise.all([
          axios.get('/api/admin/users'),
          axios.get('/api/restaurants')
        ]);
        setUsers(usersResponse.data);
        setRestaurants(restaurantsResponse.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Error fetching data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleRoleSelect = (userId, role) => {
    setNewRole(prev => ({ ...prev, [userId]: role }));
    if (role !== 'restaurant') {
      setNewAssociation(prev => {
        const updated = { ...prev };
        delete updated[userId];
        return updated;
      });
    }
  };

  const handleRoleChange = async (userId) => {
    try {
      if (!newRole[userId]) {
        throw new Error('Please select a role');
      }
      const data = { role: newRole[userId], restaurantId: newAssociation[userId] };
      const response = await axios.post(`/api/admin/users/assign-role/${userId}`, data);
      setUsers(users.map(user => (user._id === userId ? response.data.user : user)));
      setSuccessMessage('Role updated successfully');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update role');
    }
  };

  return (
    <div className="admin-panel">
      <h1>Admin Panel</h1>
      {error && <div className="error-message">{error}</div>}
      {successMessage && <div className="success-message">{successMessage}</div>}
      {loading ? <div className="loading">Loading...</div> : (
        <table>
          <thead>
            <tr>
              <th>Username</th>
              <th>Current Role</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user._id}>
                <td>{user.username}</td>
                <td>{user.role} {user.restaurant && ` / ${user.restaurant.name}`}</td>
                <td>
                  <select value={newRole[user._id] || ''} onChange={e => handleRoleSelect(user._id, e.target.value)}>
                    <option value="">Select Role</option>
                    <option value="admin">Admin</option>
                    <option value="restaurant">Restaurant</option>
                    <option value="user">User</option>
                  </select>
                  {newRole[user._id] === 'restaurant' && (
                    <select
                      value={newAssociation[user._id] || ''}
                      onChange={e => setNewAssociation(prev => ({ ...prev, [user._id]: e.target.value }))}
                    >
                      <option value="">Select Restaurant</option>
                      {restaurants.filter(r => !r.owner).map(r => (
                        <option key={r._id} value={r._id}>{r.name}</option>
                      ))}
                    </select>
                  )}
                  <button
                    onClick={() => handleRoleChange(user._id)}
                    disabled={!newRole[user._id] || (newRole[user._id] === 'restaurant' && !newAssociation[user._id])}
                  >
                    Update Role
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AdminPanel;
