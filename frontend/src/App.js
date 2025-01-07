import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
  useNavigate
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
import YourOrders from "./components/Orders/YourOrders";
import Profile from "./components/Profile/Profile";
import "./App.css";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const navigate = useNavigate();

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");
      const storedRole = localStorage.getItem("userRole");
      
      if (token) {
        try {
          // Verify token validity with backend
          const response = await axios.get("/api/users/verify-token", {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          if (response.data.valid) {
            setIsLoggedIn(true);
            setUserRole(storedRole);
          } else {
            handleLogout();
          }
        } catch (error) {
          handleLogout();
        }
      }
    };
    
    checkAuth();
  }, []);

  // Load cart from localStorage
  useEffect(() => {
    const storedCart = localStorage.getItem("cartItems");
    if (storedCart) {
      try {
        setCartItems(JSON.parse(storedCart));
      } catch (error) {
        console.error("Failed to parse cart items:", error);
        localStorage.removeItem("cartItems");
      }
    }
  }, []);

  // Save cart to localStorage
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

      // Redirect based on role
      const redirectPath = user.role === "admin" ? "/admin-panel" : 
                         user.role === "restaurant" ? "/restaurant" : "/";
      navigate(redirectPath);
    } catch (error) {
      throw new Error(error.response?.data?.message || "Login failed");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
    localStorage.removeItem("cartItems");
    setIsLoggedIn(false);
    setUserRole(null);
    setCartItems([]);
    setIsCartOpen(false);
    navigate("/");
  };

  const handleSignup = async (user) => {
    setIsLoggedIn(true);
    setUserRole(user.role);
    const redirectPath = user.role === "admin" ? "/admin-panel" : 
                        user.role === "restaurant" ? "/restaurant" : "/";
    navigate(redirectPath);
  };

  const addToCart = (item) => {
    if (!isLoggedIn) {
      alert("Please log in to add items to cart");
      navigate("/login");
      return;
    }

    setCartItems(currentItems => {
      if (currentItems.length === 0) {
        return [item];
      }

      if (currentItems[0].restaurantId === item.restaurantId) {
        const existingItemIndex = currentItems.findIndex(
          cartItem => cartItem.id === item.id && cartItem.size === item.size
        );

        if (existingItemIndex !== -1) {
          const updatedItems = [...currentItems];
          updatedItems[existingItemIndex].quantity += item.quantity;
          return updatedItems;
        }

        return [...currentItems, item];
      }

      alert(`Cannot add items from different restaurants. Your cart currently contains items from ${currentItems[0].restaurantName}`);
      return currentItems;
    });
    setIsCartOpen(true);
  };

  const updateCartItemQuantity = (itemId, size, increment) => {
    setCartItems(currentItems => {
      return currentItems.map(item => {
        if (item.id === itemId && item.size === size) {
          const newQuantity = item.quantity + increment;
          if (newQuantity <= 0) {
            return null;
          }
          return { ...item, quantity: newQuantity };
        }
        return item;
      }).filter(Boolean);
    });
  };

  const toggleCart = () => {
    if (!isLoggedIn) {
      alert("Please log in to view cart");
      navigate("/login");
      return;
    }
    setIsCartOpen(!isCartOpen);
  };

  const closeCart = () => setIsCartOpen(false);

  const handlePlaceOrder = () => {
    navigate("/your-orders");
    setCartItems([]);
    localStorage.removeItem("cartItems");
    closeCart();
  };

  return (
    <div className="App">
      <Navbar
        isLoggedIn={isLoggedIn}
        userRole={userRole}
        onLogout={handleLogout}
        onCartClick={toggleCart}
        cartItemCount={cartItems.length}
      />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={
          isLoggedIn ? <Navigate to="/" replace /> : <Login onLogin={handleLogin} />
        } />
        <Route path="/signup" element={
          isLoggedIn ? <Navigate to="/" replace /> : <Signup onSignup={handleSignup} />
        } />
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
          path="/your-orders"
          element={
            <PrivateRoute allowedRoles={["user"]}>
              <YourOrders />
            </PrivateRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <PrivateRoute allowedRoles={["user", "restaurant", "admin"]}>
              <Profile />
            </PrivateRoute>
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
  );
}

export default App;