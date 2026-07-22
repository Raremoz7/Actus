import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CheckCircle } from 'phosphor-react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppText } from './Text';
import { useToastStore } from '@/store/toastStore';
import { darkTheme } from '@/theme';

const { colors, motion } = darkTheme;

// Tempo visível antes de sumir sozinho (fora as animações de entrada/saída).
const VISIBLE_MS = 2200;

// Overlay único de toast — montado uma vez no layout raiz. Flutua na base da
// tela, acima da safe area, e não bloqueia toques (pointerEvents none). Estilo
// de sucesso (verde) validado com o designer. 1 momento de motion: fade+slide.
export function ToastHost() {
  const insets = useSafeAreaInsets();
  const message = useToastStore((s) => s.message);
  const id = useToastStore((s) => s.id);
  const hide = useToastStore((s) => s.hide);

  const progress = useSharedValue(0);

  useEffect(() => {
    if (!message) return;
    progress.value = withTiming(1, { duration: motion.microMs });
    const timer = setTimeout(() => {
      progress.value = withTiming(0, { duration: motion.microMs }, (finished) => {
        if (finished) runOnJS(hide)();
      });
    }, VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [message, id, hide, progress]);

  const style = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * 12 }],
  }));

  if (!message) return null;

  return (
    <View
      style={[styles.wrap, { paddingBottom: insets.bottom + 16 }]}
      pointerEvents="none"
    >
      <Animated.View
        style={[styles.toast, style]}
        accessibilityRole="alert"
        accessibilityLiveRegion="polite"
      >
        <CheckCircle size={20} weight="duotone" color={colors.success} />
        <AppText variant="bodyMd" style={styles.text}>
          {message}
        </AppText>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    maxWidth: 420,
    backgroundColor: theme.colors.surface2,
    borderWidth: 1,
    borderColor: theme.colors.success,
    borderRadius: theme.radius.card,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    // Sombra — exceção legítima do design (overlay flutuante, como modal/sheet).
    shadowColor: theme.colors.shadow,
    shadowOpacity: 0.4,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },
  text: {
    flexShrink: 1,
    color: theme.colors.textPrimary,
  },
}));
