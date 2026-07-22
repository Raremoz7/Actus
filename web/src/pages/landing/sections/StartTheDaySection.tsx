import { useRef } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { c, hex, fontBody, fontDisplay } from '../theme';
import { PhoneShot } from '../mockups/PhoneFrame';

gsap.registerPlugin(ScrollTrigger);

const COLUMNS: { label: string; description: string; shot: string }[] = [
  {
    label: 'Treinos',
    description:
      'Monte fichas completas com séries, repetições e descanso. Seu aluno recebe tudo direto no app.',
    shot: '/landing/app/treino-detalhe.jpeg',
  },
  {
    label: 'Acompanhamento',
    description:
      'Acompanhe cada aluno e ajuste o treino quando precisar, com tudo num só lugar.',
    shot: '/landing/app/alunos.jpeg',
  },
  {
    label: 'Progresso (em breve)',
    description:
      'Em breve: a evolução de cargas, volume e medidas para provar o resultado de cada aluno.',
    shot: '/landing/app/painel.jpeg',
  },
];

export function StartTheDaySection() {
  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const colsRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    gsap.from(headingRef.current, {
      y: 24,
      opacity: 0,
      duration: 0.8,
      ease: 'power3.out',
      scrollTrigger: { trigger: sectionRef.current, start: 'top 78%' },
    });

    if (colsRef.current) {
      gsap.from(Array.from(colsRef.current.children), {
        y: 48,
        opacity: 0,
        stagger: 0.14,
        duration: 0.9,
        ease: 'power3.out',
        scrollTrigger: { trigger: colsRef.current, start: 'top 80%' },
      });
    }
  }, { scope: sectionRef });

  return (
    <section
      ref={sectionRef}
      style={{
        background: hex.bgLowest,
        padding: 'clamp(60px, 8vw, 110px) clamp(24px, 5vw, 60px)',
        overflow: 'hidden',
      }}
    >
      <div style={{ maxWidth: 1120, margin: '0 auto' }}>
        {/* Heading */}
        <div ref={headingRef} style={{ textAlign: 'center', marginBottom: 'clamp(40px, 6vw, 72px)' }}>
          <h2
            style={{
              fontFamily: fontDisplay,
              fontSize: 'clamp(32px, 5vw, 56px)',
              fontWeight: 900,
              textTransform: 'uppercase',
              color: c.text1,
              letterSpacing: '0.01em',
              lineHeight: 1.02,
              marginBottom: 14,
            }}
          >
            Tudo para orientar.<br /><span style={{ color: c.neon }}>Em um só lugar.</span>
          </h2>
          <p
            style={{
              fontFamily: fontBody,
              fontSize: 17,
              color: c.text2,
              lineHeight: 1.55,
            }}
          >
            Da primeira conexão ao acompanhamento diário, sem afastar você das pessoas.
          </p>
        </div>

        {/* 3 columns */}
        <div
          ref={colsRef}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 'clamp(24px, 4vw, 48px)',
            alignItems: 'start',
          }}
        >
          {COLUMNS.map((col) => {
            return (
              <div key={col.label} style={{ textAlign: 'left' }}>
                <h3
                  style={{
                    fontFamily: fontDisplay,
                    fontSize: 'clamp(22px, 2.4vw, 28px)',
                    fontWeight: 900,
                    textTransform: 'uppercase',
                    color: c.neon,
                    letterSpacing: '0.01em',
                    marginBottom: 10,
                  }}
                >
                  {col.label}
                </h3>
                <p
                  style={{
                    fontFamily: fontBody,
                    fontSize: 15,
                    color: c.text2,
                    lineHeight: 1.55,
                    marginBottom: 28,
                    maxWidth: 300,
                  }}
                >
                  {col.description}
                </p>
                <PhoneShot src={col.shot} width="min(100%, 280px)" />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
