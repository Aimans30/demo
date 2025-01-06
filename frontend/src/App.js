import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
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
import Cart from "./components/Cart/Cart";
import YourOrders from "./components/YourOrders";
import Profile from "./components/Profile/Profile"; // Import the Profile component
import "./App.css";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

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

  useEffect(() => {
    const storedCart = localStorage.getItem("cartItems");
    if (storedCart) {
      setCartItems(JSON.parse(storedCart));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("cartItems", JSON.stringify(cartItems));
  }, [cartItems]);

  const handleLogin = async (credentials) => {
    try {
      const response = await axios.post("/api/users/login", credentials);
      const { token, user } = response.data;

      localStorage.setItem("token", token);
      localStorage.setItem("userRole", user.role);
      setIsLoggedIn(true);
      setUserRole(user.role);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
    localStorage.removeItem("cartItems");
    setIsLoggedIn(false);
    setUserRole(null);
    setCartItems([]);
  };

  const handleSignup = (user) => {
    setIsLoggedIn(true);
    setUserRole(user.role);

    if (user.role === "admin") {
      window.location.href = "/admin-panel";
    } else if (user.role === "restaurant") {
      window.location.href = "/restaurant";
    } else {
      window.location.href = "/";
    }
  };

  const addToCart = (item) => {
    if (cartItems.length === 0) {
      // If cart is empty, add the item
      setCartItems([item]);
    } else if (cartItems[0].restaurantId === item.restaurantId) {
      // Check if item already exists in cart
      const existingItemIndex = cartItems.findIndex(
        (cartItem) => cartItem.id === item.id && cartItem.size === item.size
      );

      if (existingItemIndex !== -1) {
        // Update quantity if item already exists
        const updatedCartItems = [...cartItems];
        updatedCartItems[existingItemIndex].quantity += item.quantity;
        setCartItems(updatedCartItems);
      } else {
        // Add new item to cart
        setCartItems([...cartItems, item]);
      }
    } else {
      // Alert if adding item from a different restaurant
      alert("You can only add items from the same restaurant to the cart.");
    }
  };

  const toggleCart = () => {
    setIsCartOpen(!isCartOpen);
  };

  const closeCart = () => {
    setIsCartOpen(false);
  };

  const handlePlaceOrder = () => {
    console.log("Placing order with items:", cartItems);
    setCartItems([]);
    localStorage.removeItem("cartItems");
    closeCart();
  };

  return (
    <Router>
      <div className="App">
        <Navbar
          isLoggedIn={isLoggedIn}
          userRole={userRole}
          onLogout={handleLogout}
          onCartClick={toggleCart}
        />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login onLogin={handleLogin} />} />
          <Route path="/signup" element={<Signup onSignup={handleSignup} />} />
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
          <Route
            path="/restaurant/:id"
            element={<RestaurantMenu addToCart={addToCart} />}
          />
          <Route
            path="/cart"
            element={
              <Cart
                cartItems={cartItems}
                onClose={closeCart}
                onPlaceOrder={handlePlaceOrder}
              />
            }
          />
          <Route path="/your-orders" element={<YourOrders />} />
          <Route
            path="/profile"
            element={
              isLoggedIn ? (
                <Profile />
              ) : (
                <Navigate to="/login" replace={true} />
              )
            }
          />
        </Routes>
        {isCartOpen && (
          <Cart
            cartItems={cartItems}
            onClose={closeCart}
            onPlaceOrder={handlePlaceOrder}
          />
        )}
      </div>
    </Router>
  );
}

export default App;
