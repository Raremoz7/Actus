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
  // Azul-névoa (dusty blue) — coadjuvante de dados/estrutura: categorias/abas secundárias,
  // eyebrows e valores secundários, gráficos, divisórias com cor. NÃO usar como ação (isso é
  // do neon) nem como aviso (isso é do `info`); convive com o `info` por ter saturação/função
  // distintas (névoa = estrutura/dados; info = aviso pontual).
  accentMuted: '#7BA0BC',
  // Fill suave da névoa para chips/tags/badges secundários (evita hardcode de rgba em componente).
  accentMutedSurface: 'rgba(123, 160, 188, 0.16)',

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
  // Cor de fogo do ícone de streak (chama) — EXCEÇÃO consciente ao neon-da-marca:
  // o fogo só vive no símbolo de sequência. Mesmo matiz quente do gradients.streak.
  flame: '#F97316',

  // Overlay/scrim (fundo de modais e bottom sheets) e cor de sombra.
  // overlay = bgLowest a 70% — escurece o conteúdo atrás do sheet.
  overlay: 'rgba(16, 37, 45, 0.7)',
  shadow: '#000000',
  // Véu sobre imagens (thumb/hero de exercício) — bgLowest a 28%, escurece a foto
  // para o texto/ícone por cima manter contraste sem apagar a imagem.
  veil: 'rgba(16, 37, 45, 0.28)',
  // Véu escuro discreto sobre superfícies de acento (ex.: bolha de ícone neon) — textInverse
  // (#141414) a 12%, dá profundidade sem escurecer o acento visivelmente.
  accentVeil: 'rgba(20, 20, 20, 0.12)',
  // Scrim preto puro do lightbox de imagem — intencionalmente neutro (não tingido de
  // bgLowest) para não competir com a cor da foto em tela cheia.
  scrimStrong: 'rgba(0, 0, 0, 0.92)',
  scrimSubtle: 'rgba(0, 0, 0, 0.6)',
} as const;

// Gradientes (135deg no design; consumir os stops com expo-linear-gradient)
export const gradients = {
  brand: ['#CBFE00', '#A2CB00'],
  streak: ['#F97316', '#EF4444'],
  // Scrim do hero do exercício: bgBase (#1A343F = cor do corpo da tela) em alphas
  // crescentes, de cima (transparente) p/ baixo (100% sólido). Termina exatamente na
  // cor do corpo → a foto dissolve na cor sólida sem emenda (sem corte seco). Também
  // garante leitura do título/eyebrow. Vertical; pareado com heroScrimLocations.
  heroScrim: ['rgba(26, 52, 63, 0)', 'rgba(26, 52, 63, 0)', 'rgba(26, 52, 63, 0.55)', 'rgba(26, 52, 63, 1)'],
  // Scrim do card de treino com foto soft: surface1 (#203F4B) transparente no topo →
  // sólido na base, p/ a foto aparecer discreta em cima e meta/CTA ficarem sobre fundo
  // limpo embaixo. Vertical (topo→base); pareado com cardPhotoScrimLocations.
  cardPhotoScrim: ['rgba(32, 63, 75, 0)', 'rgba(32, 63, 75, 0.55)', 'rgba(32, 63, 75, 1)'],
} as const;

// Paradas (0–1) do heroScrim — foto nítida até 30%, ramp gradual e sólido total na base.
export const heroScrimLocations = [0, 0.3, 0.68, 1] as const;

// Paradas do cardPhotoScrim — transparente no topo, sólido a partir de ~86%.
export const cardPhotoScrimLocations = [0, 0.48, 0.86] as const;

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
  // Texto de manifesto do hero de escolha de perfil — intencionalmente entre h1 (48) e h2 (32).
  manifesto: 44,
} as const;

// Movimento — screen 300ms, micro 150ms, easing cubic-bezier(0.4,0,0.2,1)
export const motion = {
  screenMs: 300,
  microMs: 150,
  easing: [0.4, 0, 0.2, 1] as const,
} as const;

// Sombra elevada — modal/bottom sheet/dropdown (única exceção legítima a superfícies planas).
export const shadow = {
  modal: {
    shadowColor: palette.shadow,
    shadowOpacity: 0.4,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 12,
  },
} as const;

// Alturas de chrome fixo, usadas para compensar padding de listas/scrolls que terminam
// atrás da tab bar ou de um footer fixo.
export const layout = {
  tabBarSafePaddingSm: 96,
  tabBarSafePaddingMd: 112,
  tabBarSafePaddingLg: 140,
} as const;
