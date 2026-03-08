import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'ADMIN' | 'MANAGER' | 'USER' | 'GUEST';
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user) {
    const roleHierarchy: Record<string, number> = {
      ADMIN: 3,
      MANAGER: 2,
      USER: 1,
      GUEST: 0,
    };

    const userRoleLevel = roleHierarchy[user.role] || 0;
    const requiredRoleLevel = roleHierarchy[requiredRole] || 0;

    if (userRoleLevel < requiredRoleLevel) {
      return <Navigate to="/forbidden" replace />;
    }
  }

  return <>{children}</>;
};

interface AdminRouteProps {
  children: React.ReactNode;
}

export const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => (
  <ProtectedRoute requiredRole="ADMIN">
    {children}
  </ProtectedRoute>
);

interface ManagerRouteProps {
  children: React.ReactNode;
}

export const ManagerRoute: React.FC<ManagerRouteProps> = ({ children }) => (
  <ProtectedRoute requiredRole="MANAGER">
    {children}
  </ProtectedRoute>
);

interface UserRouteProps {
  children: React.ReactNode;
}

export const UserRoute: React.FC<UserRouteProps> = ({ children }) => (
  <ProtectedRoute requiredRole="USER">
    {children}
  </ProtectedRoute>
);

interface PublicRouteProps {
  children: React.ReactNode;
  redirectIfAuthenticated?: boolean;
  redirectTo?: string;
}

export const PublicRoute: React.FC<PublicRouteProps> = ({
  children,
  redirectIfAuthenticated = true,
  redirectTo = '/dashboard',
}) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (isAuthenticated && redirectIfAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};