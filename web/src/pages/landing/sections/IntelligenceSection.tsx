import { useRef } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { c, hex, fontBody, fontDisplay } from '../theme';

gsap.registerPlugin(ScrollTrigger);

const ORBS = [
  { name: 'Coach', img: '/landing/orb-commander.avif' },
  { name: 'Parceiro', img: '/landing/orb-friend.avif', active: true },
  { name: 'Guardião', img: '/landing/orb-guardian.avif' },
];

export function IntelligenceSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const orbsRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const trigger = { trigger: sectionRef.current, start: 'top 70%' };

    if (orbsRef.current) {
      gsap.from(Array.from(orbsRef.current.children), {
        scale: 0,
        opacity: 0,
        stagger: 0.12,
        duration: 0.6,
        ease: 'back.out(1.7)',
        scrollTrigger: trigger,
      });
    }

    gsap.from(contentRef.current, {
      y: 30,
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
        background: hex.bgLowest,
        padding: 'clamp(80px, 11vw, 130px) clamp(24px, 6vw, 80px) clamp(40px, 5vw, 60px)',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Light beam behind orbs */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 300,
          height: 320,
          background: 'radial-gradient(ellipse at 50% 0%, rgba(203,254,0,0.18), transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center', position: 'relative' }}>
        {/* Orbs */}
        <div
          ref={orbsRef}
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            gap: 'clamp(24px, 5vw, 56px)',
            marginBottom: 44,
          }}
        >
          {ORBS.map((orb) => (
            <div key={orb.name} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
              <div
                style={{
                  width: orb.active ? 104 : 84,
                  height: orb.active ? 104 : 84,
                  borderRadius: '50%',
                  overflow: 'hidden',
                  boxShadow: orb.active
                    ? '0 0 48px 10px rgba(203,254,0,0.35)'
                    : '0 8px 24px rgba(0,0,0,0.4)',
                  border: orb.active ? `2px solid ${c.neon}` : `1px solid ${c.outlineV}`,
                  opacity: orb.active ? 1 : 0.7,
                }}
              >
                <img src={orb.img} alt={orb.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <span
                style={{
                  fontFamily: fontBody,
                  fontSize: 12,
                  color: orb.active ? c.text1 : c.text3,
                  fontWeight: orb.active ? 600 : 400,
                  background: orb.active ? hex.surface2 : 'transparent',
                  borderRadius: 99,
                  padding: '3px 14px',
                  border: orb.active ? `1px solid ${c.outlineV}` : 'none',
                }}
              >
                {orb.name}
              </span>
            </div>
          ))}
        </div>

        {/* Heading */}
        <div ref={contentRef}>
          <h2
            style={{
              fontFamily: fontDisplay,
              fontSize: 'clamp(32px, 5vw, 58px)',
              fontWeight: 900,
              textTransform: 'uppercase',
              color: c.text3,
              letterSpacing: '0.01em',
              lineHeight: 1.08,
            }}
          >
            Vá além com a
          </h2>
          <h2
            style={{
              fontFamily: fontDisplay,
              fontSize: 'clamp(32px, 5vw, 58px)',
              fontWeight: 900,
              textTransform: 'uppercase',
              color: c.text1,
              letterSpacing: '0.01em',
              lineHeight: 1.08,
              marginBottom: 18,
            }}
          >
            Inteligência <span style={{ color: c.neon }}>Actus</span>
          </h2>
          <p style={{ fontFamily: fontBody, fontSize: 17, color: c.text2, lineHeight: 1.6 }}>
            Receba sugestões personalizadas de treino e ajustes<br />
            inteligentes para cada aluno evoluir mais rápido.
          </p>
        </div>
      </div>
    </section>
  );
}
