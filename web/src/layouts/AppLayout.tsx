import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  landingPathForUser,
  selectAcademy,
  selectIsAcademyManager,
  selectIsAdmin,
  useAuthStore,
} from '../store/authStore';

const professorTabs = [
  { to: '/app/alunos', label: 'Alunos' },
  { to: '/app/treinos', label: 'Treinos' },
  { to: '/app/exercicios', label: 'Exercícios' },
  { to: '/app/convites', label: 'Convites' },
];

const adminTabs = [
  { to: '/app/treinos/templates', label: 'Treinos' },
  { to: '/app/exercicios', label: 'Exercícios' },
];

function initials(name: string | null | undefined): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '';
  return (first + last).toUpperCase();
}

export function AppLayout() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const isAdmin = useAuthStore(selectIsAdmin);
  const isAcademyManager = useAuthStore(selectIsAcademyManager);
  const academy = useAuthStore(selectAcademy);
  const logout = useAuthStore((s) => s.logout);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  // Navegação colapsável (hambúrguer) em telas < 1024px.
  const [navOpen, setNavOpen] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [menuOpen]);

  useEffect(() => {
    if (!navOpen) return;
    function onClick(e: MouseEvent) {
      if (navRef.current && !navRef.current.contains(e.target as Node)) setNavOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [navOpen]);

  const tabClass = ({ isActive }: { isActive: boolean }) =>
    `flex h-[52px] items-center border-b-2 px-3 font-display text-sm font-bold uppercase tracking-wide transition-colors ${
      isActive ? 'border-neon text-text-1' : 'border-transparent text-text-2 hover:text-text-1'
    }`;

  // Item de navegação no painel mobile (empilhado, indicador de borda à esquerda).
  const mobileTabClass = ({ isActive }: { isActive: boolean }) =>
    `block border-l-[3px] px-[18px] py-3 font-display text-sm font-bold uppercase tracking-wide ${
      isActive ? 'border-neon text-neon' : 'border-transparent text-text-2 hover:text-text-1'
    }`;

  // Gestor (gestão pura) navega pela sidebar da AcademyLayout — sem tabs no topo.
  const tabs = isAcademyManager ? [] : isAdmin ? adminTabs : professorTabs;
  const hasNav = tabs.length > 0 || isAdmin;

  return (
    <div className="flex h-screen flex-col">
      <header className="flex h-[52px] items-center gap-6 border-b border-outline-v bg-bg-lowest px-5">
        <Link to={landingPathForUser(user)} className="flex items-center">
          <img src="/actus-logo.svg" alt="Actus" className="h-7" />
        </Link>

        {hasNav && (
          <div className="relative lg:hidden" ref={navRef}>
            <button
              type="button"
              aria-label="Menu de navegação"
              aria-expanded={navOpen}
              onClick={() => setNavOpen((v) => !v)}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-outline-v bg-surface-1 text-text-1"
            >
              {navOpen ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="6" y1="6" x2="18" y2="18" />
                  <line x1="18" y1="6" x2="6" y2="18" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="4" y1="7" x2="20" y2="7" />
                  <line x1="4" y1="12" x2="20" y2="12" />
                  <line x1="4" y1="17" x2="20" y2="17" />
                </svg>
              )}
            </button>
            {navOpen && (
              <nav className="fixed inset-x-0 top-[52px] z-40 border-b border-outline-v bg-surface-1 shadow-lg">
                {tabs.map((tab) => (
                  <NavLink
                    key={tab.to}
                    to={tab.to}
                    className={mobileTabClass}
                    onClick={() => setNavOpen(false)}
                  >
                    {tab.label}
                  </NavLink>
                ))}
                {isAdmin && (
                  <NavLink to="/app/admin" className={mobileTabClass} onClick={() => setNavOpen(false)}>
                    Admin
                  </NavLink>
                )}
              </nav>
            )}
          </div>
        )}

        <nav className="hidden h-full items-center gap-1 lg:flex">
          {tabs.map((tab) => (
            <NavLink key={tab.to} to={tab.to} className={tabClass}>
              {tab.label}
            </NavLink>
          ))}
          {isAdmin && (
            <NavLink to="/app/admin" className={tabClass}>
              Admin
            </NavLink>
          )}
        </nav>
        {academy && (
          <span className="hidden font-mono text-xs uppercase tracking-wide text-text-3 lg:inline">
            {isAcademyManager ? academy.name : `Academia · ${academy.name}`}
          </span>
        )}
        <div className="relative ml-auto" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-3 font-display text-xs font-bold text-text-1"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
          >
            {initials(user?.display_name)}
          </button>
          {menuOpen && (
            <div
              role="menu"
              className="absolute right-0 top-10 z-50 w-44 rounded-xl border border-outline-v bg-surface-2 py-1.5 shadow-lg"
            >
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  navigate('/app/configuracoes');
                }}
                className="block w-full px-4 py-2 text-left text-sm text-text-1 hover:bg-surface-3"
              >
                Configurações
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  logout();
                  navigate('/login', { replace: true });
                }}
                className="block w-full px-4 py-2 text-left text-sm text-text-1 hover:bg-surface-3"
              >
                Sair
              </button>
            </div>
          )}
        </div>
      </header>
      <main className="flex min-h-0 flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}
