import { useRef } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { c, hex, fontBody, fontDisplay } from '../theme';
import { PhoneShot } from '../mockups/PhoneFrame';

gsap.registerPlugin(ScrollTrigger);

export function EatSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const trigger = { trigger: sectionRef.current, start: 'top 72%' };
    const textEls = textRef.current ? Array.from(textRef.current.children) : [];
    gsap.from(textEls, {
      y: 24,
      opacity: 0,
      stagger: 0.1,
      duration: 0.7,
      ease: 'power3.out',
      scrollTrigger: trigger,
    });
    gsap.from(imgRef.current, {
      x: 80,
      opacity: 0,
      duration: 0.9,
      ease: 'power3.out',
      scrollTrigger: trigger,
    });
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
          gap: 'clamp(32px, 6vw, 72px)',
        }}
      >
        {/* Text */}
        <div ref={textRef} style={{ flex: 1, minWidth: 280, maxWidth: 420 }}>
          <h2
            style={{
              fontFamily: fontDisplay,
              fontSize: 'clamp(32px, 4.2vw, 52px)',
              fontWeight: 900,
              textTransform: 'uppercase',
              color: c.text1,
              letterSpacing: '0.01em',
              lineHeight: 1.02,
              marginBottom: 18,
            }}
          >
            Clareza para treinar<br /><span style={{ color: c.neon }}>hoje</span>
          </h2>
          <p style={{ fontFamily: fontBody, fontSize: 17, color: c.text2, lineHeight: 1.6 }}>
            O aluno recebe o treino, executa cada série e acompanha o próprio progresso — simples no dia a dia.
          </p>
        </div>

        {/* Tela de exercício no celular */}
        <div ref={imgRef} style={{ flex: '1 1 320px', minWidth: 260, display: 'flex', justifyContent: 'center' }}>
          <PhoneShot src="/landing/app/exercicio.jpeg" width="min(100%, 300px)" />
        </div>
      </div>
    </section>
  );
}
