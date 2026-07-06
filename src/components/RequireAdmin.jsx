// src/components/RequireAdmin.jsx
import React from 'react';
import { useAuth } from '../context/AuthContext';

const RequireAdmin = ({ children }) => {
  const { userRole } = useAuth();

  // Solo muestra el contenido si el rol es 'admin'
  if (userRole !== 'admin') {
    return null;
  }

  return <>{children}</>;
};

export default RequireAdmin;