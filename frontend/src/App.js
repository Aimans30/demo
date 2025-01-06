import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
} from "react-router-dom";
import axios from "axios";
import Navbar from "./components/Navbar/Navbar";
import Login from "./components/Auth/Login/Login";
import Signup from "./components/Auth/Signup/Signup";
import Home from "./components/Home/Home";
import AdminPanel from "./components/Admin/AdminPanel";
import RestaurantPanel from "./components/RestaurantPanel/RestaurantPanel";
import RestaurantMenu from "./components/RestaurantMenu/RestaurantMenu";
import PrivateRoute from "./PrivateRoute";
import "./App.css";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const fetchUserStatus = async () => {
      const token = localStorage.getItem("token");
      const storedRole = localStorage.getItem("userRole");

      if (token) {
        setIsLoggedIn(true);
        setUserRole(storedRole);
      }
    };

    fetchUserStatus();
  }, []);

  const handleLogin = async (credentials) => {
    try {
      const response = await axios.post("/api/users/login", credentials);
      const { token, user } = response.data;

      localStorage.setItem("token", token);
      localStorage.setItem("userRole", user.role);
      setIsLoggedIn(true);
      setUserRole(user.role);

      // Note: No redirects here, PrivateRoute handles it
    } catch (error) {
      console.error("Login failed:", error);
      // Handle login failure
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
    setIsLoggedIn(false);
    setUserRole(null);
    // Note: No redirect here, we can let the user stay on the page or handle it elsewhere
  };

  const handleSignup = (user) => {
    setIsLoggedIn(true);
    setUserRole(user.role); // Assuming 'user' object has the role after successful signup

    // Redirect based on user role after successful signup and login
    if (user.role === 'admin') {
      window.location.href = '/admin-panel';
    } else if (user.role === 'restaurant') {
      window.location.href = '/restaurant';
    } else {
      window.location.href = '/';
    }
  };

  return (
    <Router>
      <div className="App">
        <Navbar
          isLoggedIn={isLoggedIn}
          userRole={userRole}
          onLogout={handleLogout}
        />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login onLogin={handleLogin} />} />
          <Route path="/signup" element={<Signup onSignup={handleSignup} />} />

          {/* Use PrivateRoute for protected routes */}
          <Route
            path="/admin-panel"
            element={
              <PrivateRoute allowedRoles={["admin"]}>
                <AdminPanel />
              </PrivateRoute>
            }
          />
          <Route
            path="/restaurant"
            element={
              <PrivateRoute allowedRoles={["restaurant"]}>
                <RestaurantPanel />
              </PrivateRoute>
            }
          />
          <Route path="/restaurant/:id" element={<RestaurantMenu />} />
          {/* ... other routes ... */}
        </Routes>
      </div>
    </Router>
  );
}

export default App;