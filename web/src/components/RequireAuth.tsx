import { Navigate, Outlet } from 'react-router-dom';
import { selectIsAuthenticated, useAuthStore } from '../store/authStore';

export function RequireAuth() {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Outlet />;
}
