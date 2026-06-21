import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { c, fontDisplay } from '../theme';

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

  const linkStyle: React.CSSProperties = {
    textDecoration: 'none',
    fontFamily: fontDisplay,
    fontSize: 14,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    color: c.text2,
    transition: 'color 0.2s ease',
  };

  return (
    <nav
      ref={navRef}
      style={{
        position: 'fixed',
        top: 16,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 100,
        transition: 'background 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease',
        background: scrolled ? 'rgba(16,37,45,0.85)' : 'rgba(32,63,75,0.5)',
        border: `1px solid ${scrolled ? c.outlineV : 'rgba(142,147,121,0.25)'}`,
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderRadius: 128,
        padding: '8px 8px 8px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: 24,
        boxShadow: scrolled ? '0 8px 28px rgba(0,0,0,0.35)' : '0 4px 20px rgba(0,0,0,0.2)',
        minWidth: 340,
      }}
    >
      {/* Logo Actus (marca reduzida) */}
      <Link to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
        <img src="/landing/actus-mark.png" alt="Actus" style={{ height: 26, width: 'auto', display: 'block' }} />
      </Link>

      {/* Links */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        <a href="#" style={linkStyle}>Sobre</a>
        <a href="#" style={linkStyle}>Login</a>
      </div>

      {/* CTA neon */}
      <Link
        to="/login"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          background: c.neon,
          color: c.textInv,
          borderRadius: 128,
          padding: '9px 18px',
          fontFamily: fontDisplay,
          fontSize: 14,
          fontWeight: 900,
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
          textDecoration: 'none',
          whiteSpace: 'nowrap',
          transition: 'filter 0.2s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.filter = 'brightness(0.95)')}
        onMouseLeave={(e) => (e.currentTarget.style.filter = 'brightness(1)')}
      >
        Entrar
      </Link>
    </nav>
  );
}
