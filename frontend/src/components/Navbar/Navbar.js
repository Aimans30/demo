import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "./Navbar.css";
import { FaShoppingCart, FaBars } from "react-icons/fa";
import logo from "./mujbites.png"; // Adjust the path to your logo image

function Navbar({ onCartClick }) {
  const location = useLocation();
  const navigate = useNavigate();
  const isHomePage = location.pathname === "/";
  const [isOpen, setIsOpen] = useState(false);

  const isLoggedIn = !!localStorage.getItem("userToken");
  const userRole = localStorage.getItem("userRole");

  const handleLogout = () => {
    localStorage.removeItem("userToken");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userId");
    localStorage.removeItem("username");
    localStorage.removeItem("cartItems");
    navigate("/login");
  };

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="page-layout">
      <nav className={`navbar ${isOpen ? "open" : ""}`}>
        <div className="hamburger-icon" onClick={toggleSidebar}>
          <FaBars />
        </div>

        <div className="sidebar">
          <ul className="nav-menu">
            <li className="nav-item">
              <Link to="/" className="nav-links">
                Home
              </Link>
            </li>

            {!isLoggedIn && (
              <>
                <li className="nav-item">
                  <Link to="/login" className="nav-links">
                    Login
                  </Link>
                </li>
                <li className="nav-item">
                  <Link to="/signup" className="nav-links">
                    Signup
                  </Link>
                </li>
              </>
            )}

            {isLoggedIn && (
              <>
                {userRole === "admin" && (
                  <li className="nav-item">
                    <Link to="/admin-panel" className="nav-links">
                      Admin Panel
                    </Link>
                  </li>
                )}

                {userRole === "restaurant" && (
                  <li className="nav-item">
                    <Link to="/restaurant" className="nav-links">
                      Restaurant Panel
                    </Link>
                  </li>
                )}

                {userRole === "user" && (
                  <>
                    <li className="nav-item">
                      <Link to="/your-orders" className="nav-links">
                        Your Orders
                      </Link>
                    </li>
                    <li className="nav-item">
                      <Link to="/profile" className="nav-links">
                        Profile
                      </Link>
                    </li>
                  </>
                )}

                <li className="nav-item">
                  <button onClick={handleLogout} className="nav-links logout-button">
                    Logout
                  </button>
                </li>
              </>
            )}
          </ul>
        </div>
      </nav>

      {isHomePage && (
        <div className={`content ${isOpen ? "shifted" : ""}`}>
          <div className="header">
            {/* Logo at the top center */}
            <img src={logo} alt="Logo" className="logo" />

            {/* Cart icon below the logo */}
            {isLoggedIn && (
              <div className="cart-icon">
                <button onClick={onCartClick}>
                  <FaShoppingCart />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Navbar;