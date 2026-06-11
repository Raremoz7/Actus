import { createBrowserRouter } from 'react-router-dom';
import { LoginPage } from './pages/login/LoginPage';
import { RequireAuth } from './components/RequireAuth';
import { RequireAdmin } from './components/RequireAdmin';
import { AppLayout } from './layouts/AppLayout';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { AlunosPage } from './pages/alunos/AlunosPage';
import { AlunoDetailPage } from './pages/alunos/AlunoDetailPage';
import { TreinosPage } from './pages/treinos/TreinosPage';
import { BuilderPage } from './pages/treinos/BuilderPage';
import { AtribuirPage } from './pages/treinos/AtribuirPage';
import { ConvitesPage } from './pages/convites/ConvitesPage';
import { ConfiguracoesPage } from './pages/configuracoes/ConfiguracoesPage';
import { AdminLayout } from './layouts/AdminLayout';
import { AdminOverviewPage } from './pages/admin/AdminOverviewPage';
import { StaffPage } from './pages/admin/StaffPage';
import { VinculosPage } from './pages/admin/VinculosPage';
import { ProfissionaisPage } from './pages/admin/ProfissionaisPage';

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/', element: <DashboardPage /> },
          { path: '/alunos', element: <AlunosPage /> },
          { path: '/alunos/:id', element: <AlunoDetailPage /> },
          { path: '/treinos', element: <TreinosPage /> },
          { path: '/treinos/novo', element: <BuilderPage /> },
          { path: '/treinos/:id', element: <BuilderPage /> },
          { path: '/treinos/:id/atribuir', element: <AtribuirPage /> },
          { path: '/convites', element: <ConvitesPage /> },
          { path: '/configuracoes', element: <ConfiguracoesPage /> },
          {
            element: <RequireAdmin />,
            children: [
              {
                element: <AdminLayout />,
                children: [
                  { path: '/admin', element: <AdminOverviewPage /> },
                  { path: '/admin/equipe', element: <StaffPage /> },
                  { path: '/admin/vinculos', element: <VinculosPage /> },
                  { path: '/admin/profissionais', element: <ProfissionaisPage /> },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
]);
