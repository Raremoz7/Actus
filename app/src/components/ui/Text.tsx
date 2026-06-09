import type { ReactNode } from 'react';
import { Text as RNText, type StyleProp, type TextStyle } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { darkTheme } from '@/theme';

// Variantes tipográficas: cada uma mapeia para família + tamanho + entrelinha + tracking.
export type AppTextVariant =
  | 'd1'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'label'
  | 'dataBig'
  | 'dataMed'
  | 'metaSmall'
  | 'eyebrow'
  | 'bodyLg'
  | 'bodyMd'
  | 'bodySm';

export type AppTextColor =
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'inverse'
  | 'neon'
  | 'accentMuted'
  | 'onSurface'
  | 'error';

type AppTextProps = {
  variant: AppTextVariant;
  color?: AppTextColor;
  children: ReactNode;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
  uppercase?: boolean;
};

const { fontFamily, typeScale, colors } = darkTheme;

// Display (BarlowCondensed) → títulos UPPERCASE; mono → dados/timestamps; Barlow → corpo.
type VariantSpec = {
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  letterSpacing: number;
  // Variantes de título/label são sempre caixa alta por design.
  forceUppercase: boolean;
};

const VARIANTS: Record<AppTextVariant, VariantSpec> = {
  d1: {
    fontFamily: fontFamily.displayBlack,
    fontSize: typeScale.d1,
    lineHeight: Math.round(typeScale.d1 * 0.96),
    letterSpacing: -1,
    forceUppercase: true,
  },
  h1: {
    fontFamily: fontFamily.displayBlack,
    fontSize: typeScale.h1,
    lineHeight: Math.round(typeScale.h1 * 1.0),
    letterSpacing: -0.5,
    forceUppercase: true,
  },
  h2: {
    fontFamily: fontFamily.displayExtraBold,
    fontSize: typeScale.h2,
    lineHeight: Math.round(typeScale.h2 * 1.05),
    letterSpacing: 0,
    forceUppercase: true,
  },
  h3: {
    fontFamily: fontFamily.displayExtraBold,
    fontSize: typeScale.h3,
    lineHeight: Math.round(typeScale.h3 * 1.15),
    letterSpacing: 0,
    forceUppercase: true,
  },
  // Título compacto de item de lista (display). lineHeight justo p/ linhas densas.
  h4: {
    fontFamily: fontFamily.displayExtraBold,
    fontSize: typeScale.h4,
    lineHeight: Math.round(typeScale.h4 * 1.15),
    letterSpacing: 0,
    forceUppercase: true,
  },
  // Tracking dos rótulos/dados segue o design.md: label 18%, mono 8–15%, eyebrow 30%.
  label: {
    fontFamily: fontFamily.displayExtraBold,
    fontSize: typeScale.label,
    lineHeight: Math.round(typeScale.label * 1.2),
    letterSpacing: Math.round(typeScale.label * 0.18 * 10) / 10,
    forceUppercase: true,
  },
  dataBig: {
    fontFamily: fontFamily.mono,
    fontSize: typeScale.dataBig,
    lineHeight: Math.round(typeScale.dataBig * 1.05),
    letterSpacing: Math.round(typeScale.dataBig * 0.08 * 10) / 10,
    forceUppercase: false,
  },
  dataMed: {
    fontFamily: fontFamily.mono,
    fontSize: typeScale.dataMed,
    lineHeight: Math.round(typeScale.dataMed * 1.2),
    letterSpacing: Math.round(typeScale.dataMed * 0.12 * 10) / 10,
    forceUppercase: false,
  },
  metaSmall: {
    fontFamily: fontFamily.mono,
    fontSize: typeScale.metaSmall,
    lineHeight: Math.round(typeScale.metaSmall * 1.3),
    letterSpacing: Math.round(typeScale.metaSmall * 0.15 * 10) / 10,
    forceUppercase: false,
  },
  eyebrow: {
    fontFamily: fontFamily.mono,
    fontSize: typeScale.eyebrow,
    lineHeight: Math.round(typeScale.eyebrow * 1.4),
    letterSpacing: Math.round(typeScale.eyebrow * 0.3 * 10) / 10,
    forceUppercase: true,
  },
  bodyLg: {
    fontFamily: fontFamily.body,
    fontSize: typeScale.bodyLg,
    lineHeight: Math.round(typeScale.bodyLg * 1.45),
    letterSpacing: 0,
    forceUppercase: false,
  },
  bodyMd: {
    fontFamily: fontFamily.body,
    fontSize: typeScale.bodyMd,
    lineHeight: Math.round(typeScale.bodyMd * 1.45),
    letterSpacing: 0,
    forceUppercase: false,
  },
  bodySm: {
    fontFamily: fontFamily.body,
    fontSize: typeScale.bodySm,
    lineHeight: Math.round(typeScale.bodySm * 1.4),
    letterSpacing: 0,
    forceUppercase: false,
  },
};

const COLOR_TOKEN: Record<AppTextColor, string> = {
  primary: colors.textPrimary,
  secondary: colors.textSecondary,
  tertiary: colors.textTertiary,
  inverse: colors.textInverse,
  neon: colors.neon,
  accentMuted: colors.accentMuted,
  onSurface: colors.onSurface,
  error: colors.error,
};

export function AppText({
  variant,
  color = 'primary',
  children,
  style,
  numberOfLines,
  uppercase,
}: AppTextProps) {
  const spec = VARIANTS[variant];
  const shouldUppercase = uppercase ?? spec.forceUppercase;

  return (
    <RNText
      numberOfLines={numberOfLines}
      style={[
        styles.base,
        {
          fontFamily: spec.fontFamily,
          fontSize: spec.fontSize,
          lineHeight: spec.lineHeight,
          letterSpacing: spec.letterSpacing,
          color: COLOR_TOKEN[color],
          textTransform: shouldUppercase ? 'uppercase' : 'none',
        },
        style,
      ]}
    >
      {children}
    </RNText>
  );
}

const styles = StyleSheet.create(() => ({
  base: {
    includeFontPadding: false,
  },
}));
