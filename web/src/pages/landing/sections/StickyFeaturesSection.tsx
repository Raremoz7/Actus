import { useRef } from 'react';

// Seção `intelligence_card` do bevel.health. Mecanismo do original:
// cada card tem `clip-path: inset(0)` e contém um mockup `position: fixed` (.intelligence_fixed).
// O phone fica fixo na viewport (efeito sticky), mas o clip-path de cada card o recorta aos
// limites daquele card — então o mockup aparece SÓ dentro dos cards e o conteúdo troca por card.
const FEATURES = [
  {
    title: 'Get answers\nfrom your data',
    description: 'Ask questions about your health and get answers grounded in your own metrics.',
    screen: '/landing/intelligence-01.avif',
    floating: '/landing/int-float-1.avif',
    floatStyle: { width: '106%', top: '17%', left: '9%' },
    glow: '#b9a6ff', // cc-lilac
  },
  {
    title: 'Proactive\ncheck-ins',
    description: 'Get reminders, daily summaries, and nudges without having to ask.',
    screen: '/landing/intelligence-02.avif',
    floating: '/landing/int-float-2.avif',
    floatStyle: { width: '129%', top: '20.5%', left: '-16%' },
    glow: '#f46c41', // cc-red
  },
  {
    title: 'Finds sources\nyou can trust',
    description: 'Get answers informed by the latest research, articles, and trusted sources online.',
    screen: '/landing/intelligence-03.avif',
    floating: '/landing/int-float-3.avif',
    floatStyle: { width: '107%', top: '28%', left: '0%' },
    glow: '#ff96c2', // cc-pink
  },
  {
    title: 'Personalized\ntraining plans',
    description: 'Generate workouts and training plans tailored to your goals and schedule.',
    screen: '/landing/intelligence-04.avif',
    floating: '/landing/int-float-4.avif',
    floatStyle: { width: '107%', top: '27.5%', left: '0%' },
    glow: '#83e3de', // cc-teal
  },
];

const PHONE_MASK: React.CSSProperties = {
  WebkitMaskImage: 'url(/landing/phone-shape.svg)',
  maskImage: 'url(/landing/phone-shape.svg)',
  WebkitMaskSize: 'contain',
  maskSize: 'contain',
  WebkitMaskRepeat: 'no-repeat',
  maskRepeat: 'no-repeat',
  WebkitMaskPosition: 'center',
  maskPosition: 'center',
};

function cardGradient(glow: string) {
  return `radial-gradient(circle at 75% 100%, ${glow}66, ${glow}33 10%, #ebf0f800 64%), #ebf0f8`;
}

export function StickyFeaturesSection() {
  const sectionRef = useRef<HTMLElement>(null);

  return (
    <section
      ref={sectionRef}
      style={{ background: '#1f2025', padding: '0 clamp(12px, 3vw, 32px) clamp(40px, 6vw, 80px)' }}
    >
      <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {FEATURES.map((f) => (
          <div
            key={f.title}
            style={{
              position: 'relative',
              // clip-path recorta o phone fixo aos limites (arredondados) deste card
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
                  fontSize: 'clamp(30px, 3.6vw, 52px)',
                  fontWeight: 700,
                  color: '#222326',
                  letterSpacing: '-0.025em',
                  lineHeight: 1.08,
                  marginBottom: 18,
                  whiteSpace: 'pre-line',
                }}
              >
                {f.title}
              </h3>
              <p style={{ fontSize: 16, color: 'rgba(34,35,38,0.55)', lineHeight: 1.6, maxWidth: 360 }}>
                {f.description}
              </p>
            </div>

            {/* Mockup fixo (position: fixed) — recortado pelo clip-path do card.
                Fica pinado na viewport enquanto este card está em vista. */}
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
              <div style={{ position: 'relative', width: 'clamp(300px, 34vw, 460px)' }}>
                <img
                  src={f.screen}
                  alt=""
                  style={{
                    width: '100%',
                    height: 'auto',
                    display: 'block',
                    objectFit: 'contain',
                    ...PHONE_MASK,
                    filter: 'drop-shadow(0 24px 56px rgba(0,0,0,0.22))',
                  }}
                />
                <img
                  src={f.floating}
                  alt=""
                  style={{
                    position: 'absolute',
                    width: f.floatStyle.width,
                    top: f.floatStyle.top,
                    left: f.floatStyle.left,
                    height: 'auto',
                    pointerEvents: 'none',
                  }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
