import React, { useState, useEffect } from 'react';

const AdminPanel = () => {
  const [users, setUsers] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [newRole, setNewRole] = useState({});
  const [newRestaurantName, setNewRestaurantName] = useState('');
  const [newRestaurantAddress, setNewRestaurantAddress] = useState('');
  const [newAssociation, setNewAssociation] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const API_BASE_URL = 'http://localhost:5000/api';

  const getHeaders = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  const handleResponse = async (response) => {
    const contentType = response.headers.get('content-type');
    const data = contentType && contentType.includes('application/json')
      ? await response.json()
      : await response.text();

    if (!response.ok) {
      const error = new Error(typeof data === 'object' ? data.message : data || 'API request failed');
      error.status = response.status;
      error.data = data;
      throw error;
    }
    return data;
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');

      const headers = getHeaders();
      const [usersResponse, restaurantsResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/users`, {
          headers,
          credentials: 'include'
        }),
        fetch(`${API_BASE_URL}/restaurants/admin/restaurants`, {
          headers,
          credentials: 'include'
        })
      ]);

      const [userData, restaurantData] = await Promise.all([
        handleResponse(usersResponse),
        handleResponse(restaurantsResponse)
      ]);

      setUsers(userData);
      setRestaurants(restaurantData);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message || 'Error fetching data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRoleSelect = (userId, role) => {
    setError('');
    setSuccessMessage('');
    setNewRole(prev => ({ ...prev, [userId]: role }));
    if (role !== 'restaurant') {
      setNewAssociation(prev => {
        const updated = { ...prev };
        delete updated[userId];
        return updated;
      });
      setNewRestaurantName('');
      setNewRestaurantAddress('');
    }
  };

  const handleRoleChange = async (userId) => {
    try {
      setError('');
      setSuccessMessage('');

      const role = newRole[userId];
      if (!role) {
        setError('Please select a role');
        return;
      }

      const data = {
        role,
        restaurantId: role === 'restaurant' && newAssociation[userId] ? newAssociation[userId] : undefined,
        newRestaurantData: role === 'restaurant' && !newAssociation[userId] ? {
          name: newRestaurantName,
          address: newRestaurantAddress
        } : undefined
      };

      if (role === 'restaurant' && !newAssociation[userId]) {
        if (!newRestaurantName) {
          setError('Please provide restaurant name');
          return;
        }
        if (!newRestaurantAddress) {
          setError('Please provide restaurant address');
          return;
        }
      }

      const response = await fetch(
        `${API_BASE_URL}/users/assign-role/${userId}`,
        {
          method: 'POST',
          headers: getHeaders(),
          credentials: 'include',
          body: JSON.stringify(data)
        }
      );

      const result = await handleResponse(response);
      console.log('Role update response:', result);

      await fetchData();
      setSuccessMessage('Role updated successfully');

      setNewRole(prev => {
        const updated = { ...prev };
        delete updated[userId];
        return updated;
      });
      setNewAssociation(prev => {
        const updated = { ...prev };
        delete updated[userId];
        return updated;
      });
      setNewRestaurantName('');
      setNewRestaurantAddress('');
    } catch (err) {
      console.error('Error updating role:', err);
      setError(err.message || 'Failed to update role. Please try again.');
    }
  };

  return (
    <div className="admin-panel">
      <h1>Admin Panel</h1>
      {error && <div className="error-message">{error}</div>}
      {successMessage && <div className="success-message">{successMessage}</div>}

      {loading ? (
        <div className="loading">Loading...</div>
      ) : (
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
                <td>
                  {user.role}
                  {user.restaurant && ` / ${user.restaurant.name || 'Unassigned'}`}
                </td>
                <td className="actions-cell">
                  <select
                    value={newRole[user._id] || ''}
                    onChange={e => handleRoleSelect(user._id, e.target.value)}
                    className="role-select"
                  >
                    <option value="">Select Role</option>
                    <option value="admin">Admin</option>
                    <option value="restaurant">Restaurant</option>
                    <option value="user">User</option>
                  </select>

                  {newRole[user._id] === 'restaurant' && (
                    <>
                      <select
                        value={newAssociation[user._id] || ''}
                        onChange={e => setNewAssociation(prev => ({
                          ...prev,
                          [user._id]: e.target.value
                        }))}
                        className="restaurant-select"
                      >
                        <option value="">Select Restaurant</option>
                        {restaurants
                          .filter(r => !r.owner || r.owner?._id === user._id)
                          .map(r => (
                            <option key={r._id} value={r._id}>
                              {r.name || 'Unnamed Restaurant'}
                            </option>
                          ))
                        }
                      </select>

                      {!newAssociation[user._id] && (
                        <>
                          <input
                            type="text"
                            placeholder="New Restaurant Name"
                            value={newRestaurantName}
                            onChange={e => setNewRestaurantName(e.target.value)}
                            className="input-field"
                          />
                          <input
                            type="text"
                            placeholder="Restaurant Address"
                            value={newRestaurantAddress}
                            onChange={e => setNewRestaurantAddress(e.target.value)}
                            className="input-field"
                          />
                        </>
                      )}
                    </>
                  )}

                  <button
                    onClick={() => handleRoleChange(user._id)}
                    disabled={
                      !newRole[user._id] ||
                      (newRole[user._id] === 'restaurant' &&
                        !newAssociation[user._id] &&
                        (!newRestaurantName || !newRestaurantAddress)) ||
                      (newRole[user._id] === 'restaurant' &&
                        newAssociation[user._id] === '' &&
                        !newRestaurantName &&
                        !newRestaurantAddress)
                    }
                    className="update-button"
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