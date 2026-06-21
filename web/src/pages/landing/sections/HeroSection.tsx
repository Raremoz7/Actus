import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { c, ctaStyle, fontBody, fontDisplay, fontMono, hex } from '../theme';
import { PhoneFrame } from '../mockups/PhoneFrame';

gsap.registerPlugin(ScrollTrigger);

// Prints reais do app que o mockup do hero alterna em loop (crossfade).
const HERO_SHOTS = [
  '/landing/app/painel.jpeg',
  '/landing/app/hoje.jpeg',
  '/landing/app/alunos.jpeg',
  '/landing/app/treino-detalhe.jpeg',
  '/landing/app/exercicio.jpeg',
  '/landing/app/treinos-prof.jpeg',
];

function HeroPhone() {
  const [active, setActive] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => {
      setActive((p) => (p + 1) % HERO_SHOTS.length);
    }, 2800);
    return () => window.clearInterval(id);
  }, []);
  return (
    <PhoneFrame height="clamp(360px, 48vw, 520px)">
      <div style={{ position: 'relative', width: '100%', height: '100%', background: hex.bgBase }}>
        {HERO_SHOTS.map((src, i) => (
          <img
            key={src}
            src={src}
            alt=""
            style={{
              position: 'absolute',
              top: '3%',
              left: 0,
              right: 0,
              bottom: 0,
              width: '100%',
              height: '97%',
              objectFit: 'contain',
              objectPosition: 'top center',
              opacity: i === active ? 1 : 0,
              transition: 'opacity 0.7s ease',
            }}
          />
        ))}
      </div>
    </PhoneFrame>
  );
}

export function HeroSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const phoneRef = useRef<HTMLDivElement>(null);
  const mockupsRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    tl.from(contentRef.current, { y: 30, opacity: 0, duration: 0.9 })
      .from(phoneRef.current, { y: 50, opacity: 0, scale: 0.95, duration: 1 }, '-=0.6');

    gsap.to(mockupsRef.current, {
      y: -50,
      ease: 'none',
      scrollTrigger: {
        trigger: sectionRef.current,
        start: 'top top',
        end: 'bottom top',
        scrub: 1.5,
      },
    });
  }, { scope: sectionRef });

  return (
    <section
      ref={sectionRef}
      style={{
        minHeight: '100vh',
        background:
          'radial-gradient(ellipse at 50% -10%, rgba(203,254,0,0.14) 0%, rgba(77,224,130,0.06) 35%, var(--color-bg-base) 70%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 120,
        paddingBottom: 60,
        paddingLeft: 24,
        paddingRight: 24,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Text content */}
      <div ref={contentRef} style={{ textAlign: 'center', zIndex: 2, maxWidth: 720 }}>
        <h1
          style={{
            fontFamily: fontDisplay,
            fontSize: 'clamp(52px, 8vw, 100px)',
            fontWeight: 900,
            lineHeight: 0.95,
            color: c.text1,
            textTransform: 'uppercase',
            letterSpacing: '0.005em',
            marginBottom: 22,
          }}
        >
          Profissionais e alunos.<br />
          <span style={{ color: c.neon }}>No mesmo ritmo.</span>
        </h1>
        <p
          style={{
            fontFamily: fontBody,
            fontSize: 18,
            color: c.text2,
            marginBottom: 28,
            lineHeight: 1.5,
          }}
        >
          A plataforma que conecta personal trainers e alunos em torno de<br />
          treinos claros, acompanhamento próximo e evolução contínua.
        </p>
        <Link
          to="/login"
          style={{
            ...ctaStyle,
            padding: '14px 30px',
            fontSize: 16,
            boxShadow: '0 8px 28px rgba(203,254,0,0.25)',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.filter = 'brightness(0.95)')}
          onMouseLeave={(e) => (e.currentTarget.style.filter = 'brightness(1)')}
        >
          Entrar
        </Link>
        {/* Rating */}
        <div style={{ marginTop: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <span style={{ color: c.neon, fontSize: 14 }}>★★★★★</span>
          <span style={{ fontFamily: fontMono, fontSize: 12, color: c.text3 }}>4.9 · 2K+ avaliações</span>
        </div>
      </div>

      {/* Phone + Watch mockups */}
      <div
        ref={mockupsRef}
        style={{
          marginTop: 40,
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          gap: 0,
          zIndex: 2,
          position: 'relative',
        }}
      >
        {/* Phone: frame + prints reais do app alternando em loop */}
        <div ref={phoneRef}>
          <HeroPhone />
        </div>
      </div>

      {/* QR code floating */}
      <div
        style={{
          position: 'absolute',
          right: 'clamp(16px, 4vw, 60px)',
          bottom: 60,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: 'rgba(32,63,75,0.7)',
          border: `1px solid ${c.outlineV}`,
          borderRadius: 12,
          padding: '8px 12px',
          backdropFilter: 'blur(8px)',
        }}
      >
        <img
          src="/landing/qr-code.png"
          alt="QR code"
          style={{ width: 48, height: 48, borderRadius: 6, background: '#fff', padding: 2 }}
        />
        <div>
          <div style={{ fontFamily: fontDisplay, fontWeight: 900, textTransform: 'uppercase', fontSize: 12, letterSpacing: '0.03em', color: c.text1 }}>
            Baixe o app
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: fontMono, fontSize: 10, color: c.text3 }}>
            <svg width="9" height="10" viewBox="0 0 24 26" fill="none" aria-hidden="true">
              <path d="M1.6 1.2 14 13 1.6 24.8c-.4-.3-.6-.8-.6-1.4V2.6c0-.6.2-1.1.6-1.4Z" fill={c.neon} />
              <path d="m16.3 10.7 3.1 1.8c1.2.7 1.2 2.3 0 3l-3.1 1.8L13.2 16l3.1-3.3-3.1-2 3.1-.0Z" fill={c.neon} opacity="0.75" />
              <path d="M2.6.7 16 8.4l-2.8 3L2.6.7Z" fill={c.neon} opacity="0.9" />
              <path d="M2.6 25.3 13.2 16.6 16 19.6 2.6 25.3Z" fill={c.neon} opacity="0.6" />
            </svg>
            na Google Play
          </div>
        </div>
      </div>
    </section>
  );
}
