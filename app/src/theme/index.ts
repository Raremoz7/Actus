import {
  palette,
  gradients,
  spacing,
  radius,
  fontFamily,
  typeScale,
  motion,
} from './tokens';

// Tema único (dark). Agrega todos os tokens sob uma raiz consumível pelo Unistyles.
export const darkTheme = {
  colors: palette,
  gradients,
  spacing,
  radius,
  fontFamily,
  typeScale,
  motion,
} as const;

export type AppTheme = typeof darkTheme;
