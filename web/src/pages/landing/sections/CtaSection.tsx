import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { alpha, c, ctaStyle, fontBody, fontDisplay, hex } from '../theme';

gsap.registerPlugin(ScrollTrigger);

export function CtaSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    gsap.from(headingRef.current, {
      y: 24,
      opacity: 0,
      duration: 0.8,
      ease: 'power3.out',
      scrollTrigger: { trigger: headingRef.current, start: 'top 82%' },
    });
  }, { scope: sectionRef });

  return (
    <section
      ref={sectionRef}
      style={{
        background: hex.bgBase,
        padding: 'clamp(90px, 12vw, 160px) clamp(24px, 6vw, 60px)',
        overflow: 'hidden',
        textAlign: 'center',
      }}
    >
      <div ref={headingRef} style={{ marginBottom: 0 }}>
        <h2
          style={{
            fontFamily: fontDisplay,
            fontSize: 'clamp(34px, 5.2vw, 64px)',
            fontWeight: 900,
            color: c.text1,
            textTransform: 'uppercase',
            letterSpacing: '0.01em',
            lineHeight: 1.05,
            marginBottom: 16,
          }}
        >
          Vamos colocar mais gente <span style={{ color: c.neon }}>em movimento?</span>
        </h2>
        <p style={{ fontFamily: fontBody, fontSize: 17, color: c.text2, lineHeight: 1.6, marginBottom: 28, maxWidth: 520, margin: '0 auto 28px' }}>
          Conheça a Actus e descubra uma nova forma de orientar, acompanhar e evoluir.
        </p>
        <Link
          to="/login"
          style={{
            ...ctaStyle,
            padding: '14px 30px',
            fontSize: 16,
            boxShadow: `0 8px 28px ${alpha(hex.neon, 0.25)}`,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.filter = 'brightness(0.95)')}
          onMouseLeave={(e) => (e.currentTarget.style.filter = 'brightness(1)')}
        >
          Entrar
        </Link>
      </div>
    </section>
  );
}
