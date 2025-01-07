import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
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
import YourOrders from "./components/Orders/YourOrders";
import Profile from "./components/Profile/Profile";
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
      localStorage.setItem("userId", user.id);
      localStorage.setItem("username", user.username);
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
    localStorage.removeItem("userId");
    localStorage.removeItem("username");
    setIsLoggedIn(false);
    setUserRole(null);
    setCartItems([]);
  };

  const handleSignup = (user) => {
    setIsLoggedIn(true);
    setUserRole(user.role);
    const redirectPath = 
      user.role === "admin" 
        ? "/admin-panel" 
        : user.role === "restaurant" 
        ? "/restaurant" 
        : "/";
    window.location.href = redirectPath;
  };

  const addToCart = (item) => {
    setCartItems((currentItems) => {
      if (currentItems.length === 0) {
        return [{ ...item, restaurantId: item.restaurantId, restaurantName: item.restaurantName }];
      }

      if (currentItems[0].restaurantId === item.restaurantId) {
        const existingItemIndex = currentItems.findIndex(
          (cartItem) => cartItem.id === item.id && cartItem.size === item.size
        );

        if (existingItemIndex !== -1) {
          const updatedItems = [...currentItems];
          updatedItems[existingItemIndex].quantity += item.quantity;
          return updatedItems;
        }

        return [...currentItems, { ...item, restaurantId: item.restaurantId, restaurantName: item.restaurantName }];
      }

      alert(
        `Cannot add items from different restaurants. Your cart currently contains items from ${currentItems[0].restaurantName}`
      );
      return currentItems;
    });
    setIsCartOpen(true);
  };

  const updateCartItemQuantity = (itemId, size, increment) => {
    setCartItems((currentItems) => {
      return currentItems
        .map((item) => {
          if (item.id === itemId && item.size === size) {
            const newQuantity = item.quantity + increment;
            if (newQuantity <= 0) {
              return null;
            }
            return { ...item, quantity: newQuantity };
          }
          return item;
        })
        .filter(Boolean);
    });
  };

  const toggleCart = () => setIsCartOpen(!isCartOpen);
  const closeCart = () => setIsCartOpen(false);

  const handlePlaceOrder = async () => {
    try {
      // Prepare order data
      const token = localStorage.getItem("token");
      const userId = localStorage.getItem("userId");
      const orderData = {
        restaurant: cartItems[0].restaurantId,
        customer: userId,
        items: cartItems.map((item) => ({
          menuItem: item.id,
          quantity: item.quantity,
          size: item.size,
        })),
        totalAmount: cartItems.reduce(
          (total, item) => total + item.price * item.quantity,
          0
        ),
      };

      // Make API call to place the order
      const response = await axios.post("/api/orders", orderData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Handle success
      console.log("Order placed successfully:", response.data);
      setCartItems([]);
      localStorage.removeItem("cartItems");
    } catch (error) {
      console.error("Error placing order:", error);
      // Handle errors (e.g., show error message)
    }
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
          <Route path="/your-orders" element={<YourOrders />} />
          <Route
            path="/profile"
            element={
              isLoggedIn ? <Profile /> : <Navigate to="/login" replace={true} />
            }
          />
        </Routes>
        {isCartOpen && (
          <Cart
            cartItems={cartItems}
            onClose={closeCart}
            onPlaceOrder={handlePlaceOrder}
            updateQuantity={updateCartItemQuantity}
          />
        )}
      </div>
    </Router>
  );
}

export default App;
