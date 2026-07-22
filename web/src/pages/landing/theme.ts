// Tokens do design system da Actus (definidos em src/index.css via @theme).
// Usados nas seções da landing via inline-style para re-tema escuro/neon.
export const c = {
  bgLowest: 'var(--color-bg-lowest)', // #10252D
  bgBase: 'var(--color-bg-base)', // #1A343F
  surface1: 'var(--color-surface-1)', // #203F4B
  surface2: 'var(--color-surface-2)', // #294B58
  surface3: 'var(--color-surface-3)', // #345867
  surface4: 'var(--color-surface-4)', // #406575
  neon: 'var(--color-neon)', // #CBFE00
  secondary: 'var(--color-secondary)', // #4DE082
  text1: 'var(--color-text-1)', // #FFFFFF
  text2: 'var(--color-text-2)', // white 70%
  text3: 'var(--color-text-3)', // white 50%
  textInv: 'var(--color-text-inv)', // #141414
  outline: 'var(--color-outline)', // #8E9379
  outlineV: 'var(--color-outline-v)', // #444933
  onSurface: 'var(--color-on-surface)', // #E2E4CF
} as const;

// Valores hex literais (para gradientes/rgba onde var() é inconveniente)
export const hex = {
  bgLowest: '#10252D',
  bgBase: '#1A343F',
  surface1: '#203F4B',
  surface2: '#294B58',
  surface3: '#345867',
  surface4: '#406575',
  neon: '#CBFE00',
  secondary: '#4DE082',
  outline: '#8E9379',
  shadow: '#000000', // espelha --color-shadow do tema
} as const;

// rgba(hex, alpha) — evita rgba(0,0,0,x)/rgba(203,254,0,x) hardcoded espalhado
// pelas seções da landing. Uso: alpha(hex.shadow, 0.35), alpha(hex.neon, 0.25).
export function alpha(hexColor: string, opacity: number): string {
  const n = parseInt(hexColor.replace('#', ''), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

export const fontDisplay = "'Barlow Condensed', sans-serif";
export const fontBody = "'Barlow', sans-serif";
export const fontMono = "'Share Tech Mono', monospace";

// Estilo padrão de título (Barlow Condensed, black, UPPERCASE) — identidade Actus.
export const headingStyle: React.CSSProperties = {
  fontFamily: fontDisplay,
  fontWeight: 900,
  textTransform: 'uppercase',
  letterSpacing: '0.01em',
  color: hex.neon,
};

// Botão CTA neon (igual ao Button primary do app).
export const ctaStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  background: hex.neon,
  color: '#141414',
  borderRadius: 999,
  padding: '12px 26px',
  fontFamily: fontDisplay,
  fontWeight: 900,
  fontSize: 15,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  textDecoration: 'none',
  transition: 'filter 0.2s',
};
