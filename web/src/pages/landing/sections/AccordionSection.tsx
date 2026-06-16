import { useRef, useState } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const ITEMS = [
  { title: 'Biological Age', description: 'One score that shows how you\'re aging and how to improve.', img: '/landing/accordion-bio-age.avif' },
  { title: 'Cycle Tracking', description: 'Understand your body\'s rhythm and train smarter around it.', img: '/landing/accordion-cycle.avif' },
  { title: 'Strength Training', description: 'Log your lifts and watch your progress stack up.', img: '/landing/accordion-strength.avif' },
  { title: 'Journal', description: 'Track your habits and connect the dots over time.', img: '/landing/accordion-journal.avif' },
  { title: 'Caffeine Tracking', description: 'See how caffeine affects your sleep and recovery.', img: '/landing/accordion-caffeine.avif' },
  { title: 'Smart Alarm', description: 'Wake up at the optimal point in your sleep cycle.', img: '/landing/accordion-alarm.avif' },
  { title: 'Activity Status', description: 'Real-time readiness score based on all your signals.', img: '/landing/accordion-activity.avif' },
  { title: 'Hydration', description: 'Log water intake and get reminders based on your strain.', img: '/landing/accordion-hydration.avif' },
];

export function AccordionSection() {
  const [active, setActive] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);
  const screenRef = useRef<HTMLImageElement>(null);
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
        background: '#fff',
        padding: 'clamp(70px, 9vw, 120px) clamp(24px, 6vw, 80px)',
        overflow: 'hidden',
      }}
    >
      <div style={{ maxWidth: 1120, margin: '0 auto' }}>
        <div ref={headingRef} style={{ marginBottom: 48 }}>
          <h2
            style={{
              fontSize: 'clamp(34px, 5vw, 60px)',
              fontWeight: 700,
              color: '#222326',
              letterSpacing: '-0.025em',
              lineHeight: 1.05,
              marginBottom: 12,
            }}
          >
            And that's not all
          </h2>
          <p style={{ fontSize: 17, color: 'rgba(34,35,38,0.5)' }}>
            Bevel also has the following features:
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
                    background: isActive ? '#f0f2f5' : '#f6f7f9',
                    border: 'none',
                    borderRadius: 18,
                    padding: '20px 22px',
                    cursor: 'pointer',
                    transition: 'background 0.25s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 16,
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: 17,
                        color: '#222326',
                        marginBottom: 4,
                      }}
                    >
                      {item.title}
                    </div>
                    <div style={{ fontSize: 14, color: 'rgba(34,35,38,0.5)', lineHeight: 1.5 }}>
                      {item.description}
                    </div>
                  </div>
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: '50%',
                      border: '1px solid rgba(34,35,38,0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      background: isActive ? '#222326' : 'transparent',
                      transition: 'background 0.25s ease',
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path
                        d="M3 7h8M7.5 3.5L11 7l-3.5 3.5"
                        stroke={isActive ? '#fff' : 'rgba(34,35,38,0.5)'}
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
            <div style={{ position: 'relative', height: 'clamp(360px, 42vw, 520px)' }}>
              <img
                ref={screenRef}
                src={ITEMS[active].img}
                alt={ITEMS[active].title}
                style={{
                  height: '100%',
                  width: 'auto',
                  objectFit: 'contain',
                  display: 'block',
                  filter: 'drop-shadow(0 20px 48px rgba(0,0,0,0.14))',
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
