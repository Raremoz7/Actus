import { useRef } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const COLUMNS = [
  {
    label: 'Strain',
    description:
      "Track how hard you're pushing with one number that captures your daily effort and exertion.",
    img: '/landing/strain-phone.avif',
  },
  {
    label: 'Sleep',
    description:
      'Discover what it takes to get a good night’s rest by knowing your sleep stages and needs.',
    img: '/landing/sleep-phone.avif',
  },
  {
    label: 'Recovery',
    description:
      "See if you're ready to tackle the day or if it's time to slow down and let your body recover.",
    img: '/landing/recovery-phone.avif',
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
        background: '#f3f6f7',
        padding: 'clamp(60px, 8vw, 110px) clamp(24px, 5vw, 60px)',
        overflow: 'hidden',
      }}
    >
      <div style={{ maxWidth: 1120, margin: '0 auto' }}>
        {/* Heading */}
        <div ref={headingRef} style={{ textAlign: 'center', marginBottom: 'clamp(40px, 6vw, 72px)' }}>
          <h2
            style={{
              fontSize: 'clamp(32px, 5vw, 56px)',
              fontWeight: 700,
              color: '#222326',
              letterSpacing: '-0.025em',
              lineHeight: 1.08,
              marginBottom: 14,
            }}
          >
            Start the day<br />with confidence
          </h2>
          <p
            style={{
              fontSize: 17,
              color: 'rgba(34,35,38,0.55)',
              lineHeight: 1.55,
            }}
          >
            Turn your body's signals into clear, actionable metrics.
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
          {COLUMNS.map((col) => (
            <div key={col.label} style={{ textAlign: 'left' }}>
              <h3
                style={{
                  fontSize: 'clamp(22px, 2.4vw, 28px)',
                  fontWeight: 700,
                  color: '#222326',
                  letterSpacing: '-0.02em',
                  marginBottom: 10,
                }}
              >
                {col.label}
              </h3>
              <p
                style={{
                  fontSize: 15,
                  color: 'rgba(34,35,38,0.55)',
                  lineHeight: 1.55,
                  marginBottom: 28,
                  maxWidth: 300,
                }}
              >
                {col.description}
              </p>
              <img
                src={col.img}
                alt={col.label}
                style={{
                  width: '100%',
                  maxWidth: 320,
                  height: 'auto',
                  display: 'block',
                  filter: 'drop-shadow(0 24px 48px rgba(0,0,0,0.14))',
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
