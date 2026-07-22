import { useRef } from 'react';
import { c, hex, fontBody, fontDisplay } from '../theme';
import { PhoneShot } from '../mockups/PhoneFrame';

// Seção `intelligence_card`. Cada card tem `clip-path: inset(0)` e contém um mockup
// `position: fixed`. O phone fica fixo na viewport (efeito sticky), mas o clip-path de cada
// card o recorta aos seus limites — o mockup aparece SÓ dentro dos cards e a tela troca por card.
const FEATURES: { title: string; description: string; shot: string; glow: string }[] = [
  {
    title: 'Tudo num\nsó painel',
    description: 'Alunos, treinos do dia e adesão num só lugar — comece o dia sabendo quem precisa de você.',
    shot: '/landing/app/painel.jpeg',
    glow: hex.neon,
  },
  {
    title: 'Acompanhe\nde perto',
    description: 'Check-ins e aderência de cada aluno no painel — e, em breve, a evolução de cargas e volume em gráficos.',
    shot: '/landing/app/alunos.jpeg',
    glow: hex.secondary,
  },
  {
    title: 'Biblioteca\ncom técnica',
    description: 'Exercícios com séries sugeridas e orientação de execução para treinar com segurança.',
    shot: '/landing/app/exercicio.jpeg',
    glow: hex.neon,
  },
  {
    title: 'Planos de\ntreino sob medida',
    description: 'Monte treinos e templates ajustados aos objetivos e à rotina de cada aluno.',
    shot: '/landing/app/treino-detalhe.jpeg',
    glow: hex.secondary,
  },
];

function cardGradient(glow: string) {
  return `radial-gradient(circle at 75% 100%, ${glow}33, ${glow}1a 12%, ${hex.surface1}00 62%), ${hex.surface1}`;
}

export function StickyFeaturesSection() {
  const sectionRef = useRef<HTMLElement>(null);

  return (
    <section
      ref={sectionRef}
      style={{ background: hex.bgLowest, padding: '0 clamp(12px, 3vw, 32px) clamp(40px, 6vw, 80px)' }}
    >
      <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {FEATURES.map((f) => {
          return (
            <div
              key={f.title}
              style={{
                position: 'relative',
                clipPath: 'inset(0 round 24px)',
                background: cardGradient(f.glow),
                borderRadius: 24,
                minHeight: '92vh',
                display: 'flex',
                alignItems: 'center',
                padding: 'clamp(32px, 5vw, 64px)',
              }}
            >
              {/* Texto à esquerda */}
              <div style={{ width: '50%', minWidth: 240, position: 'relative', zIndex: 2 }}>
                <h3
                  style={{
                    fontFamily: fontDisplay,
                    fontSize: 'clamp(32px, 3.8vw, 54px)',
                    fontWeight: 900,
                    textTransform: 'uppercase',
                    color: c.text1,
                    letterSpacing: '0.01em',
                    lineHeight: 1.0,
                    marginBottom: 18,
                    whiteSpace: 'pre-line',
                  }}
                >
                  {f.title}
                </h3>
                <p style={{ fontFamily: fontBody, fontSize: 16, color: c.text2, lineHeight: 1.6, maxWidth: 360 }}>
                  {f.description}
                </p>
              </div>

              {/* Mockup fixo (position: fixed) — recortado pelo clip-path do card. */}
              <div
                style={{
                  position: 'fixed',
                  top: 0,
                  left: '50%',
                  width: 'min(620px, 50vw)',
                  height: '100vh',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  pointerEvents: 'none',
                  zIndex: 1,
                }}
              >
                <PhoneShot src={f.shot} width="clamp(240px, 23vw, 320px)" />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
