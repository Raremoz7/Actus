import { createBrowserRouter } from 'react-router-dom';
import { LoginPage } from './pages/login/LoginPage';
import { RequireAuth } from './components/RequireAuth';
import { RequireAdmin } from './components/RequireAdmin';
import { AppLayout } from './layouts/AppLayout';
import { Placeholder } from './pages/Placeholder';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { AlunosPage } from './pages/alunos/AlunosPage';
import { AlunoDetailPage } from './pages/alunos/AlunoDetailPage';
import { TreinosPage } from './pages/treinos/TreinosPage';
import { BuilderPage } from './pages/treinos/BuilderPage';
import type { SidebarSection } from './layouts/Sidebar';

const convitesSidebar: SidebarSection[] = [
  {
    label: 'Status',
    items: [{ name: 'Pendentes', active: true }, { name: 'Aceitos' }, { name: 'Expirados' }],
  },
];

const adminSidebar: SidebarSection[] = [
  {
    label: 'Plataforma',
    items: [
      { name: 'Overview', to: '/admin' },
      { name: 'Usuários', to: '/admin/usuarios' },
    ],
  },
];

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
          {
            path: '/convites',
            element: <Placeholder title="Convites" sections={convitesSidebar} />,
          },
          { path: '/configuracoes', element: <Placeholder title="Configurações" /> },
          {
            element: <RequireAdmin />,
            children: [
              { path: '/admin', element: <Placeholder title="Admin" sections={adminSidebar} /> },
              {
                path: '/admin/*',
                element: <Placeholder title="Admin" sections={adminSidebar} />,
              },
            ],
          },
        ],
      },
    ],
  },
]);
