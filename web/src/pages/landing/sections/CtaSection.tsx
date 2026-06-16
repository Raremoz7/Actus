import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function CtaSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  useGSAP(() => {
    gsap.from(headingRef.current, {
      y: 24,
      opacity: 0,
      duration: 0.8,
      ease: 'power3.out',
      scrollTrigger: { trigger: headingRef.current, start: 'top 82%' },
    });
    gsap.from(imgRef.current, {
      y: 40,
      opacity: 0,
      duration: 1,
      ease: 'power3.out',
      scrollTrigger: { trigger: sectionRef.current, start: 'top 60%' },
    });
  }, { scope: sectionRef });

  return (
    <section
      ref={sectionRef}
      style={{
        background: '#fff',
        padding: 'clamp(70px, 9vw, 120px) clamp(24px, 6vw, 60px) 0',
        overflow: 'hidden',
        textAlign: 'center',
      }}
    >
      <div ref={headingRef} style={{ marginBottom: 40 }}>
        <h2
          style={{
            fontSize: 'clamp(34px, 5.2vw, 64px)',
            fontWeight: 700,
            color: '#222326',
            letterSpacing: '-0.025em',
            lineHeight: 1.05,
            marginBottom: 16,
          }}
        >
          Ready When You Are
        </h2>
        <p style={{ fontSize: 17, color: 'rgba(34,35,38,0.58)', lineHeight: 1.6, marginBottom: 28, maxWidth: 520, margin: '0 auto 28px' }}>
          Start with one step. One log at a time. Bevel meets you where you are and helps you move forward with clarity and confidence.
        </p>
        <Link
          to="/login"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: '#1f2025',
            color: '#ebf0f8',
            borderRadius: 128,
            padding: '13px 26px',
            fontSize: 16,
            fontWeight: 500,
            textDecoration: 'none',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.12), 0 4px 20px rgba(0,0,0,0.15)',
            transition: 'opacity 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
          </svg>
          Entrar
        </Link>
      </div>

      {/* Composite: phone + watch + floating products */}
      <img
        ref={imgRef}
        src="/landing/cta-composite.avif"
        alt="Bevel everyday companions"
        style={{
          width: '100%',
          maxWidth: 1000,
          height: 'auto',
          margin: '0 auto',
          display: 'block',
        }}
      />
    </section>
  );
}
