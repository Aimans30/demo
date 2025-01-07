import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AdminPanel.css';

const AdminPanel = () => {
    const [users, setUsers] = useState([]);
    const [restaurants, setRestaurants] = useState([]);
    const [newRole, setNewRole] = useState({});
    const [newAssociation, setNewAssociation] = useState({});
    const [successMessage, setSuccessMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const token = localStorage.getItem('token');
    const authHeader = { headers: { Authorization: `Bearer ${token}` }};

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await axios.get('http://localhost:5000/admin/api/users', authHeader);
                setUsers(response.data);
                setError('');
            } catch (error) {
                const errorMessage = 
                    error.response?.status === 404 ? 'Server not found' :
                    error.response?.status === 401 ? 'Unauthorized access' :
                    'Failed to fetch users';
                setError(errorMessage);
                console.error('Error:', error);
            } finally {
                setLoading(false);
            }
        };

        const fetchRestaurants = async () => {
            try {
                const response = await axios.get('http://localhost:5000/admin/api/restaurants', authHeader);
                setRestaurants(response.data);
                setError('');
            } catch (error) {
                setError('Failed to fetch restaurants');
                console.error('Error:', error);
            }
        };

        fetchUsers();
        fetchRestaurants();
    }, []);

    const handleRoleSelect = (userId, role) => {
        setNewRole(prevState => ({ ...prevState, [userId]: role }));
        setError('');
    };

    const handleRestaurantSelect = (userId, restaurantId) => {
        setNewAssociation(prevState => ({ ...prevState, [userId]: restaurantId }));
        setError('');
    };

    const handleRoleChange = async (userId) => {
        if (!newRole[userId]) {
            setError('Please select a role first');
            return;
        }

        let restaurantId = null;
        if (newRole[userId] === 'restaurant') {
            if (newAssociation[userId]) {
                restaurantId = newAssociation[userId];
            } else {
                setError('Please select an existing restaurant or fill in the new restaurant details');
                return;
            }
        }

        try {
            const response = await axios.post(
                `http://localhost:5000/admin/api/users/assign-role/${userId}`,
                {
                    role: newRole[userId],
                    ...(restaurantId && { restaurantId }),
                },
                authHeader
            );
            setUsers(users.map(user => user._id === userId ? response.data.user : user));
            setSuccessMessage('Role updated successfully');
            setError('');
            
        } catch (error) {
            setError(error.response?.data?.message || 'Failed to assign role');
        } finally {
             // Clear messages after a few seconds
             setTimeout(() => {
                setSuccessMessage('');
                setError('');
            }, 5000);
        }
    };

    if (!localStorage.getItem('userRole') === 'admin') {
        return <div className="error-message">Access Restricted</div>;
    }

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
                            <th>Mobile Number</th>
                            <th>Current Role / Association</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.length === 0 ? (
                            <tr>
                                <td colSpan="4">No users found</td>
                            </tr>
                        ) : (
                            users.map(user => (
                                <tr key={user._id}>
                                    <td>{user.username}</td>
                                    <td>{user.mobileNumber}</td>
                                    <td>
                                        {user.role} {user.restaurant ? `/ ${user.restaurant.name}` : ''}
                                    </td>
                                    <td>
                                        <div>
                                            <select
                                                value={newRole[user._id] || ''}
                                                onChange={(e) => handleRoleSelect(user._id, e.target.value)}
                                                className="role-select"
                                            >
                                                <option value="">Select Role</option>
                                                <option value="admin">Admin</option>
                                                <option value="restaurant">Restaurant</option>
                                                <option value="user">User</option>
                                            </select>
                                            <button
                                                onClick={() => handleRoleChange(user._id)}
                                                className="assign-role-btn"
                                                disabled={!newRole[user._id]}
                                            >
                                                Assign Role
                                            </button>
                                        </div>
                                        {newRole[user._id] === 'restaurant' && (
                                            <div>
                                                <select
                                                    value={newAssociation[user._id] || ''}
                                                    onChange={(e) => handleRestaurantSelect(user._id, e.target.value)}
                                                    className="restaurant-select"
                                                >
                                                    <option value="">Select Existing Restaurant</option>
                                                    {restaurants.map(restaurant => (
                                                        <option key={restaurant._id} value={restaurant._id}>
                                                            {restaurant.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default AdminPanel;