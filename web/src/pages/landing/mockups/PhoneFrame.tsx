import type { ReactNode, CSSProperties } from 'react';
import { hex } from '../theme';

// Moldura de iPhone reutilizável: usa o frame transparente (phone-frame.avif) como bezel
// e renderiza a "tela" (children) na área interna. A tela usa container-query (cqw/cqh),
// então qualquer conteúdo em `em` escala junto com o tamanho da moldura — nítido em qualquer escala.
export function PhoneFrame({
  children,
  height,
  width,
  glow = true,
  style,
}: {
  children: ReactNode;
  height?: string;
  width?: string;
  glow?: boolean;
  style?: CSSProperties;
}) {
  // dimensiona por largura OU altura (default: altura)
  const byWidth = width != null;
  const h = height ?? (byWidth ? undefined : 'clamp(360px, 48vw, 520px)');
  return (
    <div
      style={{
        position: 'relative',
        width,
        height: h,
        display: 'inline-block',
        filter: glow
          ? 'drop-shadow(0 24px 48px rgba(0,0,0,0.45)) drop-shadow(0 0 40px rgba(203,254,0,0.12))'
          : undefined,
        ...style,
      }}
    >
      {/* área da tela */}
      <div
        style={{
          position: 'absolute',
          top: '3.4%',
          left: '5.8%',
          width: '88.4%',
          height: '93.2%',
          borderRadius: '13% / 6.3%',
          overflow: 'hidden',
          zIndex: 1,
          background: hex.bgBase,
          containerType: 'size',
        }}
      >
        {children}
      </div>
      {/* bezel */}
      <img
        src="/landing/phone-frame.avif"
        alt=""
        style={
          byWidth
            ? { width: '100%', height: 'auto', position: 'relative', zIndex: 2, display: 'block', pointerEvents: 'none' }
            : { height: '100%', width: 'auto', position: 'relative', zIndex: 2, display: 'block', pointerEvents: 'none' }
        }
      />
    </div>
  );
}

// Moldura com um print real do app como tela. `topInset` deixa um respiro escuro
// no topo (faixa de status bar) para o conteúdo não colar no notch.
export function PhoneShot({
  src,
  height,
  width,
  glow = true,
  topInset = '3%',
  style,
}: {
  src: string;
  height?: string;
  width?: string;
  glow?: boolean;
  topInset?: string;
  style?: CSSProperties;
}) {
  return (
    <PhoneFrame height={height} width={width} glow={glow} style={style}>
      {/* contain garante que TODO o print apareça (incl. menu inferior); o respiro fica no topo */}
      <div
        style={{
          width: '100%',
          height: '100%',
          background: hex.bgBase,
          paddingTop: topInset,
          boxSizing: 'border-box',
        }}
      >
        <img
          src={src}
          alt=""
          style={{ width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'top center', display: 'block' }}
        />
      </div>
    </PhoneFrame>
  );
}

// Barra de status fake (hora + ícones), em `em` (escala com o root cqw da tela).
export function StatusBar({ time = '9:41' }: { time?: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.6em 1.4em 0.2em',
        fontFamily: "'Barlow', sans-serif",
        fontSize: '0.78em',
        fontWeight: 700,
        color: '#fff',
      }}
    >
      <span>{time}</span>
      <span style={{ display: 'flex', alignItems: 'center', gap: '0.4em', letterSpacing: '0.05em' }}>
        <span style={{ fontSize: '0.8em' }}>▮▮▮▯</span>
        <span style={{ fontSize: '0.8em' }}>⌃</span>
        <span
          style={{
            display: 'inline-block',
            width: '1.6em',
            height: '0.85em',
            border: '0.12em solid rgba(255,255,255,0.8)',
            borderRadius: '0.25em',
            position: 'relative',
          }}
        >
          <span style={{ position: 'absolute', inset: '0.12em', right: '0.4em', background: '#fff', borderRadius: '0.1em' }} />
        </span>
      </span>
    </div>
  );
}
