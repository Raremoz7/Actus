import { useRef } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { c, hex, fontBody, fontDisplay } from '../theme';

gsap.registerPlugin(ScrollTrigger);

const PHOTOS = Array.from({ length: 14 }, (_, i) => ({
  src: `/landing/gym/gym-${String(i + 1).padStart(2, '0')}.jpg`,
  alt: `Aluno treinando ${i + 1}`,
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
        background: hex.bgLowest,
        padding: 'clamp(80px, 10vw, 120px) clamp(24px, 4vw, 60px) clamp(60px, 8vw, 100px)',
        overflow: 'hidden',
      }}
    >
      <div ref={headingRef} style={{ textAlign: 'center', marginBottom: 48 }}>
        <h2
          style={{
            fontFamily: fontDisplay,
            fontSize: 'clamp(28px, 4.5vw, 52px)',
            fontWeight: 900,
            color: c.text1,
            textTransform: 'uppercase',
            letterSpacing: '0.01em',
            lineHeight: 1.1,
            marginBottom: 12,
          }}
        >
          Feito com cuidado,<br /><span style={{ color: c.neon }}>amado</span> em todo lugar
        </h2>
        <p style={{ fontFamily: fontBody, fontSize: 16, color: c.text3, lineHeight: 1.6 }}>
          Não acredite só na nossa palavra. Veja por que personais e alunos<br />
          de todo o Brasil confiam na Actus para evoluir todos os dias.
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
              boxShadow: '0 10px 28px rgba(0,0,0,0.4), 0 0 18px rgba(203,254,0,0.06)',
            }}
          />
        ))}
      </div>
    </section>
  );
}
