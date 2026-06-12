import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { selectIsAdmin, useAuthStore } from '../store/authStore';

const tabs = [
  { to: '/alunos', label: 'Alunos' },
  { to: '/treinos', label: 'Treinos' },
  { to: '/exercicios', label: 'Exercícios' },
  { to: '/convites', label: 'Convites' },
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
  const logout = useAuthStore((s) => s.logout);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [menuOpen]);

  const tabClass = ({ isActive }: { isActive: boolean }) =>
    `flex h-[52px] items-center border-b-2 px-3 font-display text-sm font-bold uppercase tracking-wide transition-colors ${
      isActive ? 'border-neon text-text-1' : 'border-transparent text-text-2 hover:text-text-1'
    }`;

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex h-[52px] items-center gap-6 border-b border-outline-v bg-bg-lowest px-5">
        <Link
          to="/"
          className="font-display text-xl font-black uppercase tracking-wide text-neon"
        >
          Actus
        </Link>
        <nav className="flex h-full items-center gap-1">
          {tabs.map((tab) => (
            <NavLink key={tab.to} to={tab.to} className={tabClass}>
              {tab.label}
            </NavLink>
          ))}
          {isAdmin && (
            <NavLink to="/admin" className={tabClass}>
              Admin
            </NavLink>
          )}
        </nav>
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
                  navigate('/configuracoes');
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
      <main className="flex flex-1">
        <Outlet />
      </main>
    </div>
  );
}
