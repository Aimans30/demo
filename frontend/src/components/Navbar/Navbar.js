import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import "./Navbar.css";
import { FaShoppingCart, FaBars } from "react-icons/fa";
import SearchBar from "../SearchBar/SearchBar";

function Navbar({ isLoggedIn, userRole, onLogout }) {
  const location = useLocation();
  const isHomePage = location.pathname === "/";
  const [isOpen, setIsOpen] = useState(false);

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
                  <button onClick={onLogout} className="nav-links">
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
            <div className="search-bar-container">
              <SearchBar />
            </div>
            <div className="cart-icon">
              <Link to="/cart">
                <FaShoppingCart />
              </Link>
            </div>
          </div>
          <div className="main-content">
            <h1 className="home-heading">Your Local go to..</h1>
            <h2 className="home-subheading">Top Rated</h2>
          </div>
        </div>
      )}
    </div>
  );
}

export default Navbar;