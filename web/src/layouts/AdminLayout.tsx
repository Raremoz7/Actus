import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar, type SidebarSection } from './Sidebar';

export function AdminLayout() {
  const { pathname } = useLocation();

  const sections: SidebarSection[] = [
    {
      label: 'Plataforma',
      items: [
        { name: 'Overview', to: '/admin', active: pathname === '/admin' },
        { name: 'Equipe', to: '/admin/equipe' },
        { name: 'Vínculos', to: '/admin/vinculos' },
        { name: 'Profissionais', to: '/admin/profissionais' },
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
