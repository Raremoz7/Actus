import { useRef } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const PHOTOS = Array.from({ length: 14 }, (_, i) => ({
  src: `/landing/crafted-${String(i + 1).padStart(2, '0')}.avif`,
  alt: `Member ${i + 1}`,
  yOffset: (i % 3 === 0 ? 20 : i % 3 === 1 ? -10 : 0),
}));

export function GallerySection() {
  const sectionRef = useRef<HTMLElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    gsap.from(headingRef.current, {
      y: 24,
      opacity: 0,
      duration: 0.8,
      ease: 'power3.out',
      scrollTrigger: { trigger: headingRef.current, start: 'top 85%' },
    });

    if (gridRef.current) {
      const photos = Array.from(gridRef.current.querySelectorAll('img'));
      gsap.from(photos, {
        y: (i) => PHOTOS[i % PHOTOS.length].yOffset + 30,
        opacity: 0,
        stagger: 0.06,
        duration: 0.7,
        ease: 'power3.out',
        scrollTrigger: { trigger: gridRef.current, start: 'top 80%' },
      });
    }
  }, { scope: sectionRef });

  return (
    <section
      ref={sectionRef}
      style={{
        background: '#f3f6f7',
        padding: 'clamp(80px, 10vw, 120px) clamp(24px, 4vw, 60px) clamp(60px, 8vw, 100px)',
        overflow: 'hidden',
      }}
    >
      <div ref={headingRef} style={{ textAlign: 'center', marginBottom: 48 }}>
        <h2
          style={{
            fontSize: 'clamp(28px, 4.5vw, 52px)',
            fontWeight: 700,
            color: '#222326',
            letterSpacing: '-0.02em',
            lineHeight: 1.1,
            marginBottom: 12,
          }}
        >
          Crafted with Care<br />Loved Everywhere
        </h2>
        <p style={{ fontSize: 16, color: 'rgba(34,35,38,0.55)', lineHeight: 1.6 }}>
          Don't take our words for it. See why Bevel is trusted and<br />
          loved by people around the world who want to feel better.
        </p>
      </div>

      <div
        ref={gridRef}
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: 10,
          maxWidth: 1100,
          margin: '0 auto',
          alignItems: 'end',
        }}
      >
        {PHOTOS.map((photo, i) => (
          <img
            key={i}
            src={photo.src}
            alt={photo.alt}
            style={{
              width: '100%',
              aspectRatio: i % 4 === 0 ? '3/4' : i % 4 === 1 ? '2/3' : i % 4 === 2 ? '1/1' : '3/4',
              objectFit: 'cover',
              borderRadius: 22,
              transform: `translateY(${photo.yOffset}px)`,
            }}
          />
        ))}
      </div>
    </section>
  );
}
