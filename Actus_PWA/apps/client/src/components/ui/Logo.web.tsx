import type { CSSProperties, FC, SVGProps } from 'react';

import { darkTheme } from '@/theme';

// Na web os SVGs viram componentes DOM via vite-plugin-svgr (sufixo ?react).
import LogoSymbol from '../../../assets/images/logo-symbol.svg?react';
import LogoHorizontal from '../../../assets/images/logo-horizontal.svg?react';
import LogoVertical from '../../../assets/images/logo-vertical.svg?react';

export type LogoVariant = 'symbol' | 'horizontal' | 'vertical';
export type LogoColor = 'neon' | 'dark';

type LogoProps = {
  variant?: LogoVariant;
  color?: LogoColor;
  width?: number;
  accessibilityLabel?: string;
};

const ASPECT: Record<LogoVariant, number> = {
  symbol: 2083.333 / 1710.543,
  horizontal: 3818.232 / 1229.306,
  vertical: 2448.131 / 2392.413,
};

const SOURCES: Record<LogoVariant, FC<SVGProps<SVGSVGElement>>> = {
  symbol: LogoSymbol,
  horizontal: LogoHorizontal,
  vertical: LogoVertical,
};

const COLOR_TOKEN: Record<LogoColor, string> = {
  neon: darkTheme.colors.neon,
  dark: darkTheme.colors.textInverse,
};

export function Logo({
  variant = 'symbol',
  color = 'neon',
  width = 80,
  accessibilityLabel,
}: LogoProps) {
  const Source = SOURCES[variant];
  const height = width / ASPECT[variant];

  // Só o symbol usa currentColor; na web isso vira a CSS property `color`.
  const style: CSSProperties = variant === 'symbol' ? { color: COLOR_TOKEN[color] } : {};

  return (
    <Source
      width={width}
      height={height}
      style={style}
      role={accessibilityLabel ? 'img' : undefined}
      aria-label={accessibilityLabel}
      aria-hidden={accessibilityLabel ? undefined : true}
    />
  );
}
