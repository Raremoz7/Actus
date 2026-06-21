import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar, type SidebarSection } from './Sidebar';

// [ACTUS — academia] Console do gestor (gestão pura). Mesmo padrão do AdminLayout (sidebar + outlet),
// porém com caminhos absolutos /app/academia/* (não herdar o bug de prefixo do AdminLayout).
export function AcademyLayout() {
  const { pathname } = useLocation();

  const sections: SidebarSection[] = [
    {
      label: 'Academia',
      items: [
        { name: 'Dashboard', to: '/app/academia', active: pathname === '/app/academia' },
        { name: 'Equipe', to: '/app/academia/equipe', active: pathname.startsWith('/app/academia/equipe') },
        { name: 'Comissões', to: '/app/academia/comissoes' },
        { name: 'Configurações', to: '/app/academia/configuracoes' },
      ],
    },
  ];

  return (
    <>
      <Sidebar sections={sections} />
      <div className="flex-1 overflow-auto">
        <Outlet />
      </div>
    </>
  );
}
