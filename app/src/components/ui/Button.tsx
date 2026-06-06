import { useEffect } from 'react';
import { Pressable, View, type GestureResponderEvent } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { StyleSheet } from 'react-native-unistyles';

import { darkTheme } from '@/theme';
import { AppText } from './Text';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';

type ButtonProps = {
  variant?: ButtonVariant;
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  // Ícone opcional à esquerda do label (ex.: phosphor já renderizado pelo caller).
  icon?: React.ReactNode;
};

const { motion } = darkTheme;

export function Button({
  variant = 'primary',
  label,
  onPress,
  loading = false,
  disabled = false,
  icon,
}: ButtonProps) {
  const isInteractive = !disabled && !loading;

  // Escala de toque (Reanimated, 150ms).
  const pressScale = useSharedValue(1);
  // Pulso do preenchimento neon durante o loading (NUNCA spinner).
  const loadingPulse = useSharedValue(1);
  // Fundo do ghost ao pressionar (0 → surface2).
  const ghostPress = useSharedValue(0);

  useEffect(() => {
    if (loading) {
      loadingPulse.value = withRepeat(
        withSequence(
          withTiming(0.6, { duration: 500 }),
          withTiming(1, { duration: 500 }),
        ),
        -1,
        true,
      );
    } else {
      cancelAnimation(loadingPulse);
      loadingPulse.value = 1;
    }
    return () => cancelAnimation(loadingPulse);
  }, [loading, loadingPulse]);

  const animatedContainerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressScale.value }],
    // Pulso de opacidade em QUALQUER variante durante loading (regra: nunca spinner).
    opacity: loading ? loadingPulse.value : 1,
  }));

  const ghostBgStyle = useAnimatedStyle(() => {
    // Só o ghost controla o fundo por aqui; nas outras variantes não devolvemos
    // backgroundColor para NÃO sobrescrever o fill (neon) definido em styles.fill.
    if (variant !== 'ghost') return {};
    return {
      backgroundColor: ghostPress.value === 1 ? darkTheme.colors.surface2 : 'transparent',
    };
  });

  function handlePressIn() {
    pressScale.value = withTiming(0.98, { duration: motion.microMs });
    if (variant === 'ghost') {
      ghostPress.value = 1;
    }
  }

  function handlePressOut() {
    pressScale.value = withTiming(1, { duration: motion.microMs });
    if (variant === 'ghost') {
      ghostPress.value = 0;
    }
  }

  function handlePress(_e: GestureResponderEvent) {
    if (!isInteractive) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  }

  styles.useVariants({ variant });

  const textColor =
    variant === 'primary'
      ? 'inverse'
      : variant === 'secondary'
        ? 'primary'
        : 'secondary';

  return (
    <Animated.View
      style={[
        styles.outer,
        animatedContainerStyle,
        disabled ? styles.disabled : null,
      ]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: !isInteractive, busy: loading }}
        disabled={!isInteractive}
        onPress={handlePress}
        onPressIn={isInteractive ? handlePressIn : undefined}
        onPressOut={isInteractive ? handlePressOut : undefined}
      >
        <Animated.View style={[styles.fill, ghostBgStyle]}>
          {icon ? <View style={styles.icon}>{icon}</View> : null}
          <AppText variant="label" color={textColor}>
            {label}
          </AppText>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create((theme) => ({
  outer: {
    alignSelf: 'stretch',
  },
  disabled: {
    opacity: 0.4,
  },
  fill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    paddingVertical: 17,
    paddingHorizontal: theme.spacing.xl,
    variants: {
      variant: {
        // Primário: fill neon, radius pill.
        primary: {
          backgroundColor: theme.colors.neon,
          borderRadius: theme.radius.pill,
        },
        // Secundário: transparente, borda outline, radius input (shape distinto de propósito).
        secondary: {
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: theme.colors.outline,
          borderRadius: theme.radius.input,
        },
        // Ghost: sem borda; bg surface2 só ao pressionar (controlado por Reanimated).
        ghost: {
          backgroundColor: 'transparent',
          borderRadius: theme.radius.input,
        },
      },
    },
  },
  icon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
}));
