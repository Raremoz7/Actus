import { createBrowserRouter } from 'react-router-dom';
import { LoginPage } from './pages/login/LoginPage';
import { RequireAuth } from './components/RequireAuth';
import { RequireAdmin } from './components/RequireAdmin';
import { AppLayout } from './layouts/AppLayout';
import { Placeholder } from './pages/Placeholder';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { AlunosPage } from './pages/alunos/AlunosPage';
import type { SidebarSection } from './layouts/Sidebar';

const treinosSidebar: SidebarSection[] = [
  {
    label: 'Biblioteca',
    items: [{ name: 'Todos', active: true }, { name: 'Meus templates' }, { name: 'Biblioteca pública' }],
  },
];

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
          { path: '/treinos', element: <Placeholder title="Treinos" sections={treinosSidebar} /> },
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
