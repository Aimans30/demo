import React from 'react';
import { Navigate, Route } from 'react-router-dom';

function PrivateRoute({ children, allowedRoles }) {
  const isLoggedIn = localStorage.getItem('token') !== null;
  const userRole = localStorage.getItem('userRole');

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(userRole)) {
    return <Navigate to="/" replace />; // Or to some unauthorized page
  }

  return children;
}

export default PrivateRoute;