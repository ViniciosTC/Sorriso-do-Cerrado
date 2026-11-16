import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './authContext';

function RotaAdmin({
  children,
  somenteAdmin = false,
}: {
  children: React.ReactNode;
  somenteAdmin?: boolean;
}) {
  const { isAuthenticated, isAdmin, isArtisan, isPending } = useAuth();

  if (isPending) {
    return <div>A carregar sessão...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (somenteAdmin ? !isAdmin : !isAdmin && !isArtisan) {
    return <Navigate to="/" />;
  }

  return children;
}

export default RotaAdmin;