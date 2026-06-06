import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Warning, type Icon } from 'phosphor-react-native';
import { StyleSheet } from 'react-native-unistyles';

import { darkTheme } from '@/theme';
import { AppText } from './Text';
import { Button } from './Button';

const { colors } = darkTheme;

// Estado compartilhado de lista/tela com dado remoto: loading (skeleton),
// vazio (ícone + título + copy + ação) e erro (Warning + retry).
// Padroniza os 3 estados em todas as listas do app — vazio nunca é tela em branco,
// e erro nunca é indistinguível do vazio.
type ListStateProps = {
  kind: 'loading' | 'empty' | 'error';
  // Ícone Phosphor do estado vazio (no erro o padrão é Warning).
  icon?: Icon;
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  // Quantidade de blocos de skeleton no loading.
  skeletonCount?: number;
};

export function ListState({
  kind,
  icon,
  title,
  message,
  actionLabel,
  onAction,
  skeletonCount = 3,
}: ListStateProps) {
  // ÚNICA animação: pulso suave dos skeletons (só no loading).
  const pulse = useSharedValue(0.5);
  useEffect(() => {
    if (kind !== 'loading') return;
    pulse.value = withRepeat(
      withSequence(
        withTiming(0.85, { duration: 700 }),
        withTiming(0.45, { duration: 700 }),
      ),
      -1,
      true,
    );
  }, [kind, pulse]);
  const pulseStyle = useAnimatedStyle(() => ({ opacity: pulse.value }));

  if (kind === 'loading') {
    return (
      <View accessibilityRole="progressbar" accessibilityLabel="Carregando">
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <Animated.View key={i} style={[styles.skeleton, pulseStyle]} />
        ))}
      </View>
    );
  }

  const isError = kind === 'error';
  const IconCmp: Icon = icon ?? Warning;
  const iconColor = isError ? colors.error : colors.textSecondary;

  return (
    <View style={styles.center}>
      <View style={styles.iconCircle}>
        <IconCmp size={26} weight="duotone" color={iconColor} />
      </View>
      {title ? (
        <AppText variant="h3" style={styles.title}>
          {title}
        </AppText>
      ) : null}
      {message ? (
        <AppText variant="bodySm" color="tertiary" style={styles.message}>
          {message}
        </AppText>
      ) : null}
      {actionLabel && onAction ? (
        <View style={styles.action}>
          <Button variant="secondary" label={actionLabel} onPress={onAction} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  skeleton: {
    height: 84,
    borderRadius: theme.radius.card,
    backgroundColor: theme.colors.surface1,
    marginBottom: theme.spacing.md,
  },
  center: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xxl,
    paddingHorizontal: theme.spacing.lg,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.lg,
  },
  title: {
    textAlign: 'center',
  },
  message: {
    marginTop: theme.spacing.sm,
    textAlign: 'center',
  },
  action: {
    alignSelf: 'stretch',
    marginTop: theme.spacing.xl,
  },
}));
