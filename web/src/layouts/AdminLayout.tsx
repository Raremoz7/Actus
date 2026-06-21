import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar, type SidebarSection } from './Sidebar';

export function AdminLayout() {
  const { pathname } = useLocation();

  const sections: SidebarSection[] = [
    {
      label: 'Plataforma',
      items: [
        { name: 'Overview', to: '/app/admin', active: pathname === '/app/admin' },
        { name: 'Equipe', to: '/app/admin/equipe' },
        { name: 'Vínculos', to: '/app/admin/vinculos' },
        { name: 'Profissionais', to: '/app/admin/profissionais' },
        { name: 'Academias', to: '/app/admin/academias' },
      ],
    },
    {
      label: 'Conteúdo',
      items: [
        { name: 'Treinos', to: '/app/treinos/templates' },
        { name: 'Exercícios', to: '/app/exercicios' },
      ],
    },
  ];

  return (
    <>
      <Sidebar sections={sections} />
      <div className="flex-1">
        <Outlet />
      </div>
    </>
  );
}
