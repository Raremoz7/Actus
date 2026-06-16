import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function HeroSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const phoneRef = useRef<HTMLDivElement>(null);
  const watchRef = useRef<HTMLDivElement>(null);
  const mockupsRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    tl.from(contentRef.current, { y: 30, opacity: 0, duration: 0.9 })
      .from(phoneRef.current, { y: 50, opacity: 0, scale: 0.95, duration: 1 }, '-=0.6')
      .from(watchRef.current, { y: 60, opacity: 0, scale: 0.93, duration: 1 }, '-=0.8');

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
        background: 'radial-gradient(ellipse at 50% 0%, #d2e5ff 0%, #fff9ee 45%, #ffffff 80%)',
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
      {/* Clouds background */}
      <img
        src="/landing/clouds.avif"
        alt=""
        style={{
          position: 'absolute',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100%',
          maxWidth: 1100,
          opacity: 0.7,
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      />

      {/* Text content */}
      <div ref={contentRef} style={{ textAlign: 'center', zIndex: 2, maxWidth: 640 }}>
        <h1
          style={{
            fontSize: 'clamp(44px, 6.5vw, 76px)',
            fontWeight: 700,
            lineHeight: 1.04,
            color: '#222326',
            letterSpacing: '-0.03em',
            marginBottom: 20,
          }}
        >
          Your Connected<br />Health Coach
        </h1>
        <p
          style={{
            fontSize: 18,
            color: 'rgba(34,35,38,0.6)',
            marginBottom: 26,
            lineHeight: 1.5,
          }}
        >
          Make sense of your health data, from wearables to<br />
          bloodwork, and everything in between.
        </p>
        <Link
          to="/login"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: '#1f2025',
            color: '#ebf0f8',
            borderRadius: 128,
            padding: '13px 24px',
            fontSize: 16,
            fontWeight: 500,
            textDecoration: 'none',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.12), 0 2px 16px rgba(0,0,0,0.15)',
            transition: 'opacity 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
          </svg>
          Entrar
        </Link>
        {/* Rating */}
        <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <span style={{ color: '#ff9500', fontSize: 14 }}>★★★★★</span>
          <span style={{ fontSize: 13, color: 'rgba(34,35,38,0.5)' }}>4.9 · 2K+ ratings</span>
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
        {/* Phone: frame + screen video */}
        <div
          ref={phoneRef}
          style={{
            position: 'relative',
            height: 'clamp(360px, 48vw, 520px)',
            filter: 'drop-shadow(0 24px 48px rgba(0,0,0,0.18))',
          }}
        >
          <video
            src="/landing/hero-phone-screen.mp4"
            autoPlay
            muted
            loop
            playsInline
            style={{
              position: 'absolute',
              top: '3.5%',
              left: '6%',
              width: '88%',
              height: '93%',
              objectFit: 'cover',
              borderRadius: '13% / 6.5%',
              zIndex: 1,
            }}
          />
          <img
            src="/landing/phone-frame.avif"
            alt="Bevel app on iPhone"
            style={{ height: '100%', width: 'auto', position: 'relative', zIndex: 2, display: 'block' }}
          />
        </div>

        {/* Watch: frame + screen video */}
        <div
          ref={watchRef}
          style={{
            position: 'relative',
            height: 'clamp(150px, 20vw, 220px)',
            marginLeft: '-6%',
            marginBottom: '6%',
            filter: 'drop-shadow(0 16px 32px rgba(0,0,0,0.14))',
          }}
        >
          <video
            src="/landing/hero-watch-screen.mp4"
            autoPlay
            muted
            loop
            playsInline
            style={{
              position: 'absolute',
              top: '24%',
              left: '35%',
              width: '54%',
              height: '54%',
              objectFit: 'cover',
              borderRadius: '24%',
              transform: 'rotate(-4deg)',
              zIndex: 1,
            }}
          />
          <img
            src="/landing/hero-watch.avif"
            alt="Bevel app on Apple Watch"
            style={{ height: '100%', width: 'auto', position: 'relative', zIndex: 2, display: 'block' }}
          />
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
          background: 'rgba(255,255,255,0.8)',
          borderRadius: 12,
          padding: '8px 12px',
          backdropFilter: 'blur(8px)',
        }}
      >
        <img src="/landing/qr-code.png" alt="QR code" style={{ width: 48, height: 48 }} />
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#222326' }}>Download</div>
          <div style={{ fontSize: 10, color: 'rgba(34,35,38,0.5)' }}>for iOS</div>
        </div>
      </div>
    </section>
  );
}
