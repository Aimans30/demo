import React, { useState, useEffect } from "react";
import axios from "axios";
import "./AdminPanel.css";

const AdminPanel = () => {
  const [users, setUsers] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [newRole, setNewRole] = useState({});
  const [newAssociation, setNewAssociation] = useState({});
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newRestaurantData, setNewRestaurantData] = useState({
    name: "",
    address: {
      street: "",
      city: "",
      state: "",
      postalCode: "",
      country: "INDIA",
    },
    phoneNumber: "",
  });
  const [showNewRestaurantForm, setShowNewRestaurantForm] = useState({});

  const token = localStorage.getItem("token");
  const authHeader = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => {
    const fetchUsersAndRestaurants = async () => {
      try {
        setLoading(true);

        const usersResponse = await axios.get("/admin/api/users", authHeader);
        setUsers(usersResponse.data);

        const restaurantsResponse = await axios.get(
          "/admin/api/restaurants",
          authHeader
        );
        setRestaurants(restaurantsResponse.data);

        setError("");
      } catch (error) {
        const errorMessage =
          error.response?.status === 404
            ? "Server not found"
            : error.response?.status === 401
            ? "Unauthorized access"
            : "Failed to fetch data from server.";
        setError(errorMessage);
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };

    if (localStorage.getItem("userRole") === "admin") {
      fetchUsersAndRestaurants();
    }
  }, []);

  const handleRoleSelect = (userId, role) => {
    setNewRole((prevState) => ({ ...prevState, [userId]: role }));
    setError("");
  };

  const handleRestaurantSelect = (userId, restaurantId) => {
    setNewAssociation((prevState) => ({ ...prevState, [userId]: restaurantId }));
    setError("");
  };

  const toggleNewRestaurantForm = (userId) => {
    setShowNewRestaurantForm((prev) => ({
      ...prev,
      [userId]: !prev[userId],
    }));
  };

  const handleNewRestaurantChange = (e) => {
    const { name, value } = e.target;

    if (name.startsWith("address.")) {
      const addressField = name.split(".")[1];
      setNewRestaurantData((prevData) => ({
        ...prevData,
        address: {
          ...prevData.address,
          [addressField]: value,
        },
      }));
    } else {
      setNewRestaurantData((prevData) => ({
        ...prevData,
        [name]: value,
      }));
    }
  };

  const handleNewRestaurantSubmit = async (userId) => {
    // Basic validation for required fields
    const { name, address, phoneNumber } = newRestaurantData;
    if (
      !name ||
      !address.street ||
      !address.city ||
      !address.state ||
      !address.postalCode ||
      !phoneNumber
    ) {
      setError("All fields are required.");
      return;
    }
  
    // Optionally validate the phone number format (basic example)
    const phoneRegex = /^[0-9]{10}$/; // Modify this regex as per your requirements
    if (!phoneRegex.test(phoneNumber)) {
      setError("Invalid phone number format.");
      return;
    }
  
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `/admin/api/users/assign-role/${userId}`,
        {
          role: "restaurant",
          newRestaurantData,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
  
      // Update local state with the new restaurant and user
      setRestaurants([...restaurants, response.data.restaurant]);
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user._id === userId
            ? {
                ...user,
                role: "restaurant",
                restaurant: response.data.restaurant,
              }
            : user
        )
      );
  
      setSuccessMessage(
        "New restaurant created and role assigned successfully."
      );
  
      // Reset the form and state
      setNewRestaurantData({
        name: "",
        address: {
          street: "",
          city: "",
          state: "",
          postalCode: "",
          country: "INDIA",
        },
        phoneNumber: "",
      });
      setShowNewRestaurantForm((prev) => ({ ...prev, [userId]: false }));
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Failed to create new restaurant and assign role."
      );
    } finally {
      setTimeout(() => {
        setSuccessMessage("");
        setError("");
      }, 5000);
    }
  };
  

  const handleRoleChange = async (userId) => {
    if (!newRole[userId]) {
      setError("Please select a role first");
      return;
    }

    let restaurantId = null;
    if (newRole[userId] === "restaurant") {
      if (newAssociation[userId]) {
        restaurantId = newAssociation[userId];
      } else if (!showNewRestaurantForm[userId]) {
        setError(
          "Please select an existing restaurant or create a new one"
        );
        return;
      }
    }

    try {
      const response = await axios.post(
        `/admin/api/users/assign-role/${userId}`,
        {
          role: newRole[userId],
          ...(restaurantId && { restaurantId }),
        },
        authHeader
      );
      setUsers(
        users.map((user) => (user._id === userId ? response.data.user : user))
      );
      setSuccessMessage("Role updated successfully");
      setError("");
    } catch (error) {
      setError(error.response?.data?.message || "Failed to assign role");
    } finally {
      setTimeout(() => {
        setSuccessMessage("");
        setError("");
      }, 5000);
    }
  };

  if (localStorage.getItem("userRole") !== "admin") {
    return <div className="error-message">Access Restricted</div>;
  }

  return (
    <div className="admin-panel">
      <h1>Admin Panel</h1>

      {error && <div className="error-message">{error}</div>}
      {successMessage && (
        <div className="success-message">{successMessage}</div>
      )}

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
              users.map((user) => (
                <tr key={user._id}>
                  <td>{user.username}</td>
                  <td>{user.mobileNumber}</td>
                  <td>
                    {user.role} {" "}
                    {user.restaurant ? `/ ${user.restaurant.name}` : ""}
                  </td>
                  <td>
                    <div>
                      <select
                        value={newRole[user._id] || ""}
                        onChange={(e) =>
                          handleRoleSelect(user._id, e.target.value)
                        }
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
                    {newRole[user._id] === "restaurant" && (
                      <div>
                        <select
                          value={newAssociation[user._id] || ""}
                          onChange={(e) =>
                            handleRestaurantSelect(user._id, e.target.value)
                          }
                          className="restaurant-select"
                        >
                          <option value="">Select Existing Restaurant</option>
                          {restaurants.map((restaurant) => (
                            <option
                              key={restaurant._id}
                              value={restaurant._id}
                            >
                              {restaurant.name}
                            </option>
                          ))}
                        </select>

                        <button
                          onClick={() => toggleNewRestaurantForm(user._id)}
                        >
                          {showNewRestaurantForm[user._id]
                            ? "Cancel"
                            : "Create New Restaurant"}
                        </button>

                        {showNewRestaurantForm[user._id] && (
                          <div>
                            <input
                              type="text"
                              name="name"
                              placeholder="Restaurant Name"
                              value={newRestaurantData.name}
                              onChange={handleNewRestaurantChange}
                            />
                            <input
                              type="text"
                              name="address.street"
                              placeholder="Street"
                              value={newRestaurantData.address.street}
                              onChange={handleNewRestaurantChange}
                            />
                            <input
                              type="text"
                              name="address.city"
                              placeholder="City"
                              value={newRestaurantData.address.city}
                              onChange={handleNewRestaurantChange}
                            />
                            <input
                              type="text"
                              name="address.state"
                              placeholder="State"
                              value={newRestaurantData.address.state}
                              onChange={handleNewRestaurantChange}
                            />
                            <input
                              type="text"
                              name="address.postalCode"
                              placeholder="Postal Code"
                              value={newRestaurantData.address.postalCode}
                              onChange={handleNewRestaurantChange}
                            />
                            <input
                              type="text"
                              name="phoneNumber"
                              placeholder="Phone Number"
                              value={newRestaurantData.phoneNumber}
                              onChange={handleNewRestaurantChange}
                            />
                            <button
                              onClick={() =>
                                handleNewRestaurantSubmit(user._id)
                              }
                            >
                              Submit
                            </button>
                          </div>
                        )}
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
