import { useRef } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { alpha, c, hex, fontBody, fontDisplay } from '../theme';

gsap.registerPlugin(ScrollTrigger);

export function PrivacySection() {
  const sectionRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const lockRef = useRef<SVGSVGElement>(null);

  useGSAP(() => {
    const trigger = { trigger: sectionRef.current, start: 'top 78%' };
    gsap.from(lockRef.current, {
      scale: 0.8,
      opacity: 0,
      duration: 1,
      ease: 'power3.out',
      scrollTrigger: trigger,
    });
    gsap.from(contentRef.current, {
      y: 24,
      opacity: 0,
      duration: 0.8,
      ease: 'power3.out',
      scrollTrigger: trigger,
    });
  }, { scope: sectionRef });

  return (
    <section
      ref={sectionRef}
      style={{
        background: hex.bgBase,
        padding: 'clamp(20px, 4vw, 48px) clamp(24px, 4vw, 60px) clamp(40px, 6vw, 80px)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          maxWidth: 1280,
          margin: '0 auto',
          borderRadius: 'clamp(20px, 3vw, 36px)',
          background: `radial-gradient(ellipse at 50% 40%, ${hex.surface2} 0%, ${hex.bgBase} 55%, ${hex.bgLowest} 100%)`,
          border: `1px solid ${c.outlineV}`,
          padding: 'clamp(80px, 12vw, 160px) 24px',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          minHeight: 'clamp(360px, 44vw, 520px)',
        }}
      >
        {/* Padlock illustration */}
        <svg
          ref={lockRef}
          viewBox="0 0 200 200"
          style={{
            position: 'absolute',
            width: 'clamp(280px, 40vw, 460px)',
            height: 'auto',
            opacity: 0.5,
            pointerEvents: 'none',
          }}
        >
          <defs>
            <linearGradient id="lockgrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={alpha(hex.neon, 0.32)} />
              <stop offset="100%" stopColor={alpha(hex.neon, 0.06)} />
            </linearGradient>
          </defs>
          {/* shackle */}
          <path
            d="M65 90 V62 a35 35 0 0 1 70 0 V90"
            fill="none"
            stroke="url(#lockgrad)"
            strokeWidth="14"
            strokeLinecap="round"
          />
          {/* body */}
          <rect x="48" y="88" width="104" height="86" rx="20" fill="url(#lockgrad)" />
        </svg>

        {/* Text */}
        <div ref={contentRef} style={{ position: 'relative', zIndex: 2, maxWidth: 440 }}>
          <h2
            style={{
              fontFamily: fontDisplay,
              fontSize: 'clamp(30px, 4.4vw, 52px)',
              fontWeight: 900,
              color: c.text1,
              textTransform: 'uppercase',
              letterSpacing: '0.01em',
              lineHeight: 1.08,
              marginBottom: 16,
            }}
          >
            Feito para <span style={{ color: c.neon }}>privacidade</span>
          </h2>
          <p style={{ fontFamily: fontBody, fontSize: 16, color: c.text2, lineHeight: 1.6 }}>
            Seus dados são seus. Nunca vendemos, nunca compartilhamos e protegemos tudo com segurança de ponta — você e seus alunos sempre no controle.
          </p>
        </div>
      </div>
    </section>
  );
}
