import type { FC } from 'react';
import type { SvgProps } from 'react-native-svg';

import { darkTheme } from '@/theme';

// SVGs como componentes (react-native-svg-transformer no metro).
// Import relativo: o alias @ aponta para src/, os assets ficam fora dele.
import LogoSymbol from '../../../assets/images/logo-symbol.svg';
import LogoHorizontal from '../../../assets/images/logo-horizontal.svg';
import LogoVertical from '../../../assets/images/logo-vertical.svg';

export type LogoVariant = 'symbol' | 'horizontal' | 'vertical';
export type LogoColor = 'neon' | 'dark';

type LogoProps = {
  variant?: LogoVariant;
  color?: LogoColor;
  width?: number;
};

// Proporções nativas (largura/altura do viewBox de cada SVG) para derivar a altura.
const ASPECT: Record<LogoVariant, number> = {
  symbol: 2083.333 / 1710.543,
  horizontal: 3818.232 / 1229.306,
  vertical: 2448.131 / 2392.413,
};

const SOURCES: Record<LogoVariant, FC<SvgProps>> = {
  symbol: LogoSymbol,
  horizontal: LogoHorizontal,
  vertical: LogoVertical,
};

// Mapa do prop semântico de cor para o token real (usado só no symbol/currentColor).
const COLOR_TOKEN: Record<LogoColor, string> = {
  neon: darkTheme.colors.neon,
  dark: darkTheme.colors.textInverse,
};

export function Logo({ variant = 'symbol', color = 'neon', width = 80 }: LogoProps) {
  const Source = SOURCES[variant];
  const height = width / ASPECT[variant];

  // Só o symbol usa currentColor; horizontal/vertical têm fills fixos (neon + dark) e ignoram `color`.
  const colorProps: SvgProps =
    variant === 'symbol' ? { color: COLOR_TOKEN[color] } : {};

  return <Source width={width} height={height} {...colorProps} />;
}
