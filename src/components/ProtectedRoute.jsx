// src/components/ProtectedRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useInactivityTimer } from '../hooks/useInactivityTimer';

const ProtectedRoute = ({ children }) => {
  const { currentUser } = useAuth();
  
  if (currentUser) {
    useInactivityTimer();
  }

  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  return children;
};

export default ProtectedRoute;