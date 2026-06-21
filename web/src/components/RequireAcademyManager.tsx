import { Navigate, Outlet } from 'react-router-dom';
import { selectIsAcademyManager, useAuthStore } from '../store/authStore';

export function RequireAcademyManager() {
  const isManager = useAuthStore(selectIsAcademyManager);
  if (!isManager) return <Navigate to="/app" replace />;
  return <Outlet />;
}
