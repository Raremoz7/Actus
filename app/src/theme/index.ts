import {
  palette,
  gradients,
  heroScrimLocations,
  cardPhotoScrimLocations,
  spacing,
  radius,
  fontFamily,
  typeScale,
  motion,
  shadow,
  layout,
} from './tokens';

// Tema único (dark). Agrega todos os tokens sob uma raiz consumível pelo Unistyles.
export const darkTheme = {
  colors: palette,
  gradients,
  heroScrimLocations,
  cardPhotoScrimLocations,
  spacing,
  radius,
  fontFamily,
  typeScale,
  motion,
  shadow,
  layout,
} as const;

export type AppTheme = typeof darkTheme;
