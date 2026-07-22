import type { ReactNode } from 'react';
import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

export type CardSurface = 'surface1' | 'surface2';
export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

type CardProps = {
  children: ReactNode;
  onPress?: () => void;
  surface?: CardSurface;
  padding?: CardPadding;
  // Borda neon em vez de outlineVariant — destaque pontual (ex.: KPI em foco).
  emphasis?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
};

// Card neutro — a superfície-base reutilizada por todo card de feature (surface1/2,
// borda outlineVariant, radius.card). Substitui a reimplementação manual do mesmo
// bloco em ~48 componentes de feature.
export function Card({
  children,
  onPress,
  surface = 'surface1',
  padding = 'md',
  emphasis = false,
  style,
  accessibilityLabel,
}: CardProps) {
  styles.useVariants({ surface, padding, emphasis });

  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        onPress={onPress}
        style={[styles.card, style]}
      >
        {children}
      </Pressable>
    );
  }

  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create((theme) => ({
  card: {
    borderWidth: 1,
    borderRadius: theme.radius.card,
    variants: {
      surface: {
        surface1: { backgroundColor: theme.colors.surface1 },
        surface2: { backgroundColor: theme.colors.surface2 },
      },
      padding: {
        none: { padding: 0 },
        sm: { padding: theme.spacing.sm },
        md: { padding: theme.spacing.md },
        lg: { padding: theme.spacing.lg },
      },
      emphasis: {
        true: { borderColor: theme.colors.neon },
        false: { borderColor: theme.colors.outlineVariant },
      },
    },
  },
}));
