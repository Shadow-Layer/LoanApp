import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const roleHome: Record<string, string> = {
  loan_officer: '/loan-officer',
  verifier: '/verification',
  credit_officer: '/credit-officer',
  branch_manager: '/branch-manager',
  admin: '/admin'
};

export function ProtectedRoute({ role }: { role: keyof typeof roleHome }): JSX.Element {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (user.role !== role) {
    return <Navigate to={roleHome[user.role]} replace />;
  }

  return <Outlet />;
}
