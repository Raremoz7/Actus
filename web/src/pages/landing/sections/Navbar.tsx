import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 50);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav
      ref={navRef}
      style={{
        position: 'fixed',
        top: 16,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 100,
        transition: 'background 0.3s ease, box-shadow 0.3s ease, color 0.3s ease',
        background: scrolled ? '#1f2025' : 'rgba(255,255,255,0.72)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderRadius: 128,
        padding: '8px 8px 8px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: 24,
        boxShadow: scrolled
          ? '0 2px 16px rgba(0,0,0,0.18)'
          : '0 2px 16px rgba(0,0,0,0.08)',
        minWidth: 340,
      }}
    >
      {/* Logo */}
      <Link
        to="/"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          textDecoration: 'none',
          color: scrolled ? '#ebf0f8' : '#222326',
          fontWeight: 600,
          fontSize: 16,
          transition: 'color 0.3s ease',
        }}
      >
        <svg width="20" height="20" viewBox="0 0 40 40" fill="none">
          <rect width="40" height="40" rx="10" fill={scrolled ? '#ebf0f8' : '#222326'} />
          <path d="M10 28L20 12L30 28H10Z" fill={scrolled ? '#222326' : '#fff'} />
        </svg>
        Bevel
      </Link>

      {/* Links */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        <a
          href="#"
          style={{
            textDecoration: 'none',
            fontSize: 15,
            fontWeight: 500,
            color: scrolled ? 'rgba(235,240,248,0.7)' : 'rgba(34,35,38,0.65)',
            transition: 'color 0.3s ease',
          }}
        >
          About
        </a>
        <a
          href="#"
          style={{
            textDecoration: 'none',
            fontSize: 15,
            fontWeight: 500,
            color: scrolled ? 'rgba(235,240,248,0.7)' : 'rgba(34,35,38,0.65)',
            transition: 'color 0.3s ease',
          }}
        >
          Login
        </a>
      </div>

      {/* CTA */}
      <Link
        to="/login"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          background: '#1f2025',
          color: '#ebf0f8',
          borderRadius: 128,
          padding: '8px 16px',
          fontSize: 15,
          fontWeight: 500,
          textDecoration: 'none',
          whiteSpace: 'nowrap',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.12)',
          transition: 'opacity 0.2s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
        </svg>
        Entrar
      </Link>
    </nav>
  );
}
