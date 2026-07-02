import { createBrowserRouter } from 'react-router-dom';
import { LoginPage } from './pages/login/LoginPage';
import { LandingPage } from './pages/landing/LandingPage';
import { RequireAuth } from './components/RequireAuth';
import { RequireAdmin } from './components/RequireAdmin';
import { RequireAcademyManager } from './components/RequireAcademyManager';
import { HomeRoute } from './components/HomeRoute';
import { AppLayout } from './layouts/AppLayout';
import { AlunosPage } from './pages/alunos/AlunosPage';
import { AlunoDetailPage } from './pages/alunos/AlunoDetailPage';
import { TreinosPage } from './pages/treinos/TreinosPage';
import { ExerciciosPage } from './pages/exercicios/ExerciciosPage';
import { BuilderPage } from './pages/treinos/BuilderPage';
import { AtribuirPage } from './pages/treinos/AtribuirPage';
import { TemplatesPage } from './pages/treinos/TemplatesPage';
import { TemplateBuilderPage } from './pages/treinos/TemplateBuilderPage';
import { ConvitesPage } from './pages/convites/ConvitesPage';
import { ConfiguracoesPage } from './pages/configuracoes/ConfiguracoesPage';
import { AdminLayout } from './layouts/AdminLayout';
import { AdminOverviewPage } from './pages/admin/AdminOverviewPage';
import { StaffPage } from './pages/admin/StaffPage';
import { VinculosPage } from './pages/admin/VinculosPage';
import { ProfissionaisPage } from './pages/admin/ProfissionaisPage';
import { AcademiasPage } from './pages/admin/AcademiasPage';
import { AcademyLayout } from './layouts/AcademyLayout';
import { AcademyDashboardPage } from './pages/academia/AcademyDashboardPage';
import { NetworkDashboardPage } from './pages/academia/NetworkDashboardPage';
import { AcademyTeamPage } from './pages/academia/AcademyTeamPage';
import { AcademyInstructorDetailPage } from './pages/academia/AcademyInstructorDetailPage';
import { AcademyCommissionsPage } from './pages/academia/AcademyCommissionsPage';
import { AcademySettingsPage } from './pages/academia/AcademySettingsPage';

export const router = createBrowserRouter([
  { path: '/', element: <LandingPage /> },
  { path: '/login', element: <LoginPage /> },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/app', element: <HomeRoute /> },
          { path: '/app/alunos', element: <AlunosPage /> },
          { path: '/app/alunos/:id', element: <AlunoDetailPage /> },
          { path: '/app/treinos', element: <TreinosPage /> },
          { path: '/app/treinos/templates', element: <TemplatesPage /> },
          { path: '/app/treinos/templates/novo', element: <TemplateBuilderPage /> },
          { path: '/app/treinos/templates/:id', element: <TemplateBuilderPage /> },
          { path: '/app/exercicios', element: <ExerciciosPage /> },
          { path: '/app/treinos/novo', element: <BuilderPage /> },
          { path: '/app/treinos/:id', element: <BuilderPage /> },
          { path: '/app/treinos/:id/atribuir', element: <AtribuirPage /> },
          { path: '/app/convites', element: <ConvitesPage /> },
          { path: '/app/configuracoes', element: <ConfiguracoesPage /> },
          {
            // [ACTUS — academia] Console do gestor (gestão pura).
            element: <RequireAcademyManager />,
            children: [
              {
                element: <AcademyLayout />,
                children: [
                  { path: '/app/academia', element: <AcademyDashboardPage /> },
                  { path: '/app/academia/rede', element: <NetworkDashboardPage /> },
                  { path: '/app/academia/equipe', element: <AcademyTeamPage /> },
                  { path: '/app/academia/equipe/:instructorId', element: <AcademyInstructorDetailPage /> },
                  { path: '/app/academia/comissoes', element: <AcademyCommissionsPage /> },
                  { path: '/app/academia/configuracoes', element: <AcademySettingsPage /> },
                ],
              },
            ],
          },
          {
            element: <RequireAdmin />,
            children: [
              {
                element: <AdminLayout />,
                children: [
                  { path: '/app/admin', element: <AdminOverviewPage /> },
                  { path: '/app/admin/equipe', element: <StaffPage /> },
                  { path: '/app/admin/vinculos', element: <VinculosPage /> },
                  { path: '/app/admin/profissionais', element: <ProfissionaisPage /> },
                  { path: '/app/admin/academias', element: <AcademiasPage /> },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
]);
