// Design tokens do Actus — fonte de verdade: design.md.
// Valores exatos do designer. NUNCA duplicar hex em componentes; importar daqui.

// Paleta de cores (Quiet Luxury Dark Mode)
export const palette = {
  // Backgrounds & surfaces (escuro → claro, profundidade gradual)
  bgLowest: '#10252D',
  bgBase: '#1A343F',
  surface1: '#203F4B',
  surface2: '#294B58',
  surface3: '#345867',
  surface4: '#406575',

  // Brand & accent
  neon: '#CBFE00',
  // Neon com alpha 0 — stop transparente para degradês sobre imagem (mesmo matiz, sem muddy edge).
  neonTransparent: 'rgba(203, 254, 0, 0)',
  secondary: '#4DE082',
  surfaceTint: '#ABD600',

  // Texto & outlines
  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255, 255, 255, 0.70)',
  textTertiary: 'rgba(255, 255, 255, 0.50)',
  textInverse: '#141414',
  onSurface: '#E2E4CF',
  outline: '#8E9379',
  outlineVariant: '#444933',

  // Semânticas / feedback
  success: '#4ADE80',
  warning: '#FBBF24',
  error: '#F87171',
  info: '#60A5FA',

  // Overlay/scrim (fundo de modais e bottom sheets) e cor de sombra.
  // overlay = bgLowest a 70% — escurece o conteúdo atrás do sheet.
  overlay: 'rgba(16, 37, 45, 0.7)',
  shadow: '#000000',
  // Véu sobre imagens (thumb/hero de exercício) — bgLowest a 28%, escurece a foto
  // para o texto/ícone por cima manter contraste sem apagar a imagem.
  veil: 'rgba(16, 37, 45, 0.28)',
} as const;

// Gradientes (135deg no design; consumir os stops com expo-linear-gradient)
export const gradients = {
  brand: ['#CBFE00', '#A2CB00'],
  streak: ['#F97316', '#EF4444'],
} as const;

// Espaçamento (base 4pt)
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

// Raios — cards 12px (decisão Bloco 2; antes 4px sharp)
export const radius = {
  card: 12,
  tag: 4,
  input: 12,
  modal: 24,
  pill: 100,
  // Miniatura de imagem (thumb de exercício) — entre tag e card.
  thumb: 8,
} as const;

// Famílias tipográficas (nomes exatos dos pesos do @expo-google-fonts)
export const fontFamily = {
  displayExtraBold: 'BarlowCondensed_800ExtraBold',
  displayBlack: 'BarlowCondensed_900Black',
  body: 'Barlow_400Regular',
  bodyMedium: 'Barlow_500Medium',
  bodySemiBold: 'Barlow_600SemiBold',
  bodyBold: 'Barlow_700Bold',
  mono: 'ShareTechMono_400Regular',
} as const;

// Escala tipográfica (px)
export const typeScale = {
  d1: 72,
  h1: 48,
  h2: 32,
  h3: 22,
  label: 14,
  dataBig: 36,
  dataMed: 18,
  metaSmall: 11,
  eyebrow: 10,
  bodyLg: 18,
  bodyMd: 15,
  bodySm: 13,
  // Título compacto de item de lista (display) — preenche o gap entre h3 (22) e label (14).
  h4: 18,
  // Números-herói da sessão de treino — intencionalmente fora da escala de corpo.
  timerHero: 88,
  inputHero: 40,
} as const;

// Movimento — screen 300ms, micro 150ms, easing cubic-bezier(0.4,0,0.2,1)
export const motion = {
  screenMs: 300,
  microMs: 150,
  easing: [0.4, 0, 0.2, 1] as const,
} as const;
