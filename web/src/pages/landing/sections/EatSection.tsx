import { useRef } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function EatSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

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
        background: 'linear-gradient(180deg, #efeafb 0%, #f3eefb 100%)',
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
              fontSize: 'clamp(32px, 4.2vw, 52px)',
              fontWeight: 700,
              color: '#222326',
              letterSpacing: '-0.025em',
              lineHeight: 1.08,
              marginBottom: 18,
            }}
          >
            Understand<br />what you eat
          </h2>
          <p style={{ fontSize: 17, color: 'rgba(34,35,38,0.55)', lineHeight: 1.6 }}>
            Track your meals and get a full breakdown of what's fuelling your body.
          </p>
        </div>

        {/* Composite UI */}
        <div style={{ flex: '1 1 420px', minWidth: 300, maxWidth: 560 }}>
          <img
            ref={imgRef}
            src="/landing/what-you-eat.avif"
            alt="Nutrition tracking on Bevel"
            style={{
              width: '100%',
              height: 'auto',
              display: 'block',
              borderRadius: 20,
              filter: 'drop-shadow(0 24px 56px rgba(80,60,140,0.16))',
            }}
          />
        </div>
      </div>
    </section>
  );
}
