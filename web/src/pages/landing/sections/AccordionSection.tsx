import { useRef, useState } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { c, hex, fontBody, fontDisplay } from '../theme';
import { PhoneShot } from '../mockups/PhoneFrame';

gsap.registerPlugin(ScrollTrigger);

const ITEMS: { title: string; description: string; shot: string }[] = [
  { title: 'Convite e conexão', description: 'O personal envia um convite e o aluno entra com poucos toques — vínculo criado.', shot: '/landing/app/login.jpeg' },
  { title: 'Editor de treinos', description: 'Monte fichas com séries, repetições e descanso e atribua a cada aluno.', shot: '/landing/app/editar-treino.jpeg' },
  { title: 'Catálogo de exercícios', description: 'Uma biblioteca com orientação de execução para montar treinos seguros.', shot: '/landing/app/buscar-exercicio.jpeg' },
  { title: 'Plano do dia', description: 'O aluno abre o app e vê exatamente o treino que precisa fazer hoje.', shot: '/landing/app/hoje.jpeg' },
  { title: 'Acompanhamento e adesão', description: 'Check-ins e atividade recente de cada aluno no painel, com ajuste quando precisar.', shot: '/landing/app/painel.jpeg' },
  { title: 'Desafios e ranking (em breve)', description: 'Em breve — crie desafios, acompanhe a participação e mantenha a galera engajada.', shot: '/landing/app/desafios.jpeg' },
  { title: 'Evolução e progresso (em breve)', description: 'Em breve — cargas, volume e medidas reunidos para provar o resultado de cada aluno.', shot: '/landing/app/treinos-aluno.jpeg' },
  { title: 'Privacidade e segurança', description: 'Os dados de cada aluno ficam protegidos e sempre sob o seu controle.', shot: '/landing/app/perfil.jpeg' },
];

export function AccordionSection() {
  const [active, setActive] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);
  const screenRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    gsap.from(headingRef.current, {
      y: 30,
      opacity: 0,
      duration: 0.8,
      ease: 'power3.out',
      scrollTrigger: { trigger: headingRef.current, start: 'top 82%' },
    });
  }, { scope: sectionRef });

  function handleSelect(idx: number) {
    if (idx === active) return;
    setActive(idx);
    if (screenRef.current) {
      gsap.fromTo(screenRef.current, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' });
    }
  }

  return (
    <section
      ref={sectionRef}
      style={{
        background: hex.bgBase,
        padding: 'clamp(70px, 9vw, 120px) clamp(24px, 6vw, 80px)',
        overflow: 'hidden',
      }}
    >
      <div style={{ maxWidth: 1120, margin: '0 auto' }}>
        <div ref={headingRef} style={{ marginBottom: 48 }}>
          <h2
            style={{
              fontFamily: fontDisplay,
              fontSize: 'clamp(34px, 5vw, 60px)',
              fontWeight: 900,
              textTransform: 'uppercase',
              color: c.text1,
              letterSpacing: '0.01em',
              lineHeight: 1.05,
              marginBottom: 12,
            }}
          >
            Do convite <span style={{ color: c.neon }}>à evolução</span>
          </h2>
          <p style={{ fontFamily: fontBody, fontSize: 17, color: c.text2 }}>
            Tudo o que acontece entre o personal e o aluno, conectado em um só fluxo:
          </p>
        </div>

        <div style={{ display: 'flex', gap: 'clamp(24px, 5vw, 72px)', alignItems: 'flex-start' }}>
          {/* Accordion list */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {ITEMS.map((item, i) => {
              const isActive = i === active;
              return (
                <button
                  key={item.title}
                  onClick={() => handleSelect(i)}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    background: hex.surface1,
                    border: isActive ? `1px solid ${c.neon}` : `1px solid ${c.outlineV}`,
                    borderRadius: 18,
                    padding: '20px 22px',
                    cursor: 'pointer',
                    transition: 'background 0.25s ease, border-color 0.25s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 16,
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontFamily: fontDisplay,
                        fontWeight: 900,
                        textTransform: 'uppercase',
                        letterSpacing: '0.01em',
                        fontSize: 18,
                        color: isActive ? c.neon : c.text1,
                        marginBottom: 4,
                      }}
                    >
                      {item.title}
                    </div>
                    <div style={{ fontFamily: fontBody, fontSize: 14, color: c.text3, lineHeight: 1.5 }}>
                      {item.description}
                    </div>
                  </div>
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: '50%',
                      border: isActive ? `1px solid ${c.neon}` : `1px solid ${c.outlineV}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      background: isActive ? c.neon : 'transparent',
                      transition: 'background 0.25s ease',
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path
                        d="M3 7h8M7.5 3.5L11 7l-3.5 3.5"
                        stroke={isActive ? hex.bgLowest : c.neon}
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Phone mockup */}
          <div
            style={{
              flex: '0 0 auto',
              position: 'sticky',
              top: 90,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              alignSelf: 'flex-start',
            }}
          >
            <div ref={screenRef} style={{ position: 'relative' }}>
              <PhoneShot src={ITEMS[active].shot} height="clamp(360px, 42vw, 520px)" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
