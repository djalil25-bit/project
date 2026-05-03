import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) return <div className="loading-wrapper py-5"><div className="spinner" /></div>;

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // If not authorized, send back to appropriate dashboard
    return <Navigate to={`/${user.role}-dashboard`} replace />;
  }

  // If user is accessing a protected route (like a dashboard) but is pending, redirect to pending page
  if (user && user.status && user.status.toUpperCase() === 'PENDING' && window.location.pathname !== '/pending' && window.location.pathname !== '/profile') {
      return <Navigate to="/pending" replace />;
  }

  return children;
};

export default ProtectedRoute;
