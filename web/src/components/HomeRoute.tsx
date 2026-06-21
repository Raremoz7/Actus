import { Navigate } from 'react-router-dom';
import { selectIsAcademyManager, useAuthStore } from '../store/authStore';
import { DashboardPage } from '../pages/dashboard/DashboardPage';

// Índice /app: o gestor (gestão pura) não vê o dashboard do personal — vai para o painel da academia.
export function HomeRoute() {
  const isManager = useAuthStore(selectIsAcademyManager);
  if (isManager) return <Navigate to="/app/academia" replace />;
  return <DashboardPage />;
}
