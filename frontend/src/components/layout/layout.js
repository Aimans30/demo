// frontend/src/components/Layout.js
import React from 'react';
import Navbar from './Navbar/Navbar';
import './layout.css'; // Import Layout.css

const Layout = ({ children }) => {
  const isLoggedIn = localStorage.getItem('userToken') !== null;
  const userRole = localStorage.getItem('userRole');

  return (
    <div className="app-layout">
      <Navbar isLoggedIn={isLoggedIn} userRole={userRole} />
      <div className="main-content">
        {children}
      </div>
    </div>
  );
};

export default Layout;