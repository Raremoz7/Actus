import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar, type SidebarSection } from './Sidebar';
import { selectAcademy, useAuthStore } from '../store/authStore';

// [ACTUS — academia] Console do gestor (gestão pura). Mesmo padrão do AdminLayout (sidebar + outlet),
// porém com caminhos absolutos /app/academia/* (não herdar o bug de prefixo do AdminLayout).
export function AcademyLayout() {
  const { pathname } = useLocation();
  const academy = useAuthStore(selectAcademy);
  const isNetworkHq = academy?.network_role === 'network_hq';

  const sections: SidebarSection[] = [
    {
      label: 'Academia',
      items: [
        { name: 'Dashboard', to: '/app/academia', active: pathname === '/app/academia' },
        ...(isNetworkHq
          ? [{ name: 'Rede', to: '/app/academia/rede', active: pathname === '/app/academia/rede' }]
          : []),
        { name: 'Equipe', to: '/app/academia/equipe', active: pathname.startsWith('/app/academia/equipe') },
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
