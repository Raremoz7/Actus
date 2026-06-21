import { useRef } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { c, hex, fontBody, fontDisplay } from '../theme';
import { PhoneShot } from '../mockups/PhoneFrame';

gsap.registerPlugin(ScrollTrigger);

// Avatares de alunos flutuando ao redor do phone (centralização de alunos)
const ICONS: { initials: string; top: string; left: string; size: number; dur: number; delay: number }[] = [
  { initials: 'AC', top: '6%', left: '52%', size: 50, dur: 3.4, delay: 0 },
  { initials: 'BL', top: '2%', left: '76%', size: 42, dur: 3.9, delay: 0.4 },
  { initials: 'CD', top: '26%', left: '90%', size: 46, dur: 3.2, delay: 0.2 },
  { initials: 'DS', top: '48%', left: '62%', size: 40, dur: 4.1, delay: 0.6 },
  { initials: 'MR', top: '44%', left: '86%', size: 46, dur: 3.6, delay: 0.1 },
  { initials: 'ER', top: '70%', left: '72%', size: 42, dur: 3.8, delay: 0.5 },
  { initials: 'FL', top: '72%', left: '92%', size: 38, dur: 3.3, delay: 0.3 },
  { initials: 'GP', top: '88%', left: '56%', size: 44, dur: 4.0, delay: 0.7 },
];

export function HealthRecordsSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const phoneRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const iconsRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const trigger = { trigger: sectionRef.current, start: 'top 72%' };

    gsap.from(phoneRef.current, {
      x: -80,
      opacity: 0,
      duration: 0.9,
      ease: 'power3.out',
      scrollTrigger: trigger,
    });

    const textEls = textRef.current ? Array.from(textRef.current.children) : [];
    gsap.from(textEls, {
      y: 24,
      opacity: 0,
      stagger: 0.1,
      duration: 0.7,
      ease: 'power3.out',
      scrollTrigger: trigger,
    });

    if (iconsRef.current) {
      const icons = Array.from(iconsRef.current.children);
      gsap.from(icons, {
        scale: 0,
        opacity: 0,
        stagger: 0.06,
        duration: 0.5,
        ease: 'back.out(1.7)',
        scrollTrigger: trigger,
      });
      // floating loop
      icons.forEach((el, i) => {
        gsap.to(el, {
          y: -10,
          repeat: -1,
          yoyo: true,
          duration: ICONS[i].dur,
          delay: ICONS[i].delay,
          ease: 'sine.inOut',
        });
      });
    }
  }, { scope: sectionRef });

  return (
    <section
      ref={sectionRef}
      style={{
        background: `linear-gradient(180deg, ${hex.bgBase} 0%, ${hex.bgLowest} 100%)`,
        padding: 'clamp(60px, 8vw, 110px) clamp(24px, 6vw, 80px)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          maxWidth: 1100,
          margin: '0 auto',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 'clamp(32px, 6vw, 80px)',
        }}
      >
        {/* Phone (tela Alunos) + avatares flutuantes */}
        <div style={{ position: 'relative', flex: '0 0 auto', width: 'clamp(300px, 42vw, 460px)' }}>
          <div ref={phoneRef} style={{ width: '64%', position: 'relative', zIndex: 2 }}>
            <PhoneShot src="/landing/app/alunos.jpeg" width="100%" />
          </div>
          <div ref={iconsRef} style={{ position: 'absolute', inset: 0, zIndex: 3, pointerEvents: 'none' }}>
            {ICONS.map((ic, i) => (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  top: ic.top,
                  left: ic.left,
                  width: ic.size,
                  height: ic.size,
                  borderRadius: '50%',
                  background: hex.surface3,
                  border: `1.5px solid ${c.neon}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: fontDisplay,
                  fontWeight: 700,
                  fontSize: ic.size * 0.34,
                  color: '#fff',
                  boxShadow: '0 8px 20px rgba(0,0,0,0.4)',
                }}
              >
                {ic.initials}
              </div>
            ))}
          </div>
        </div>

        {/* Text */}
        <div ref={textRef} style={{ flex: 1, minWidth: 280, maxWidth: 440 }}>
          <h2
            style={{
              fontFamily: fontDisplay,
              fontSize: 'clamp(32px, 4.2vw, 52px)',
              fontWeight: 900,
              textTransform: 'uppercase',
              color: c.text1,
              letterSpacing: '0.01em',
              lineHeight: 1.08,
              marginBottom: 18,
            }}
          >
            Centralize<br /><span style={{ color: c.neon }}>seus alunos</span>
          </h2>
          <p style={{ fontFamily: fontBody, fontSize: 17, color: c.text2, lineHeight: 1.6 }}>
            Reúna fichas, treinos e o histórico de cada aluno em um só lugar, seguro e sempre à mão.
          </p>
        </div>
      </div>
    </section>
  );
}
