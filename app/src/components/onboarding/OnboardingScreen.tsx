// Scaffold dos passos: eyebrow de progresso (ex.: "03 / 08"), título (uma pergunta
// principal por tela), conteúdo e CTA(s). 1 momento de motion: reveal de entrada.
import { useEffect, type ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { StyleSheet } from 'react-native-unistyles';

import { AppText, Button } from '@/components/ui';
import { darkTheme } from '@/theme';

const { motion } = darkTheme;

type Props = {
  step: number;
  total: number;
  title: string;
  subtitle?: string;
  children: ReactNode;
  ctaLabel: string;
  ctaDisabled?: boolean;
  ctaLoading?: boolean;
  onCta: () => void;
  // Pular (opcional): passos puláveis exibem o ghost abaixo do CTA.
  skipLabel?: string;
  onSkip?: () => void;
};

export function OnboardingScreen({
  step,
  total,
  title,
  subtitle,
  children,
  ctaLabel,
  ctaDisabled,
  ctaLoading,
  onCta,
  skipLabel,
  onSkip,
}: Props) {
  const opacity = useSharedValue(0);
  useEffect(() => {
    opacity.value = withTiming(1, { duration: motion.screenMs });
  }, [opacity]);
  const revealStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  const progress = `${String(step).padStart(2, '0')} / ${String(total).padStart(2, '0')}`;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* View extra garante flex:1 — Animated.View pode perder estilos estáticos
          quando Reanimated renderiza useAnimatedStyle num único objeto (web). */}
      <View style={styles.flex}>
      <Animated.View style={[styles.flex, revealStyle]}>
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <AppText variant="eyebrow" color="neon">
            {progress}
          </AppText>
          <AppText variant="h2" style={styles.title}>
            {title}
          </AppText>
          {subtitle ? (
            <AppText variant="bodyMd" color="secondary" style={styles.subtitle}>
              {subtitle}
            </AppText>
          ) : null}

          <View style={styles.body}>{children}</View>

          <View style={styles.cta}>
            <Button
              variant="primary"
              label={ctaLabel}
              disabled={ctaDisabled}
              loading={ctaLoading}
              onPress={onCta}
            />
            {skipLabel && onSkip ? (
              <Button variant="ghost" label={skipLabel} onPress={onSkip} />
            ) : null}
          </View>
        </ScrollView>
      </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create((theme) => ({
  safe: { flex: 1, backgroundColor: theme.colors.bgLowest },
  flex: { flex: 1 },
  content: {
    flexGrow: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.lg,
  },
  title: { marginTop: theme.spacing.xs },
  subtitle: { marginTop: theme.spacing.sm },
  body: { marginTop: theme.spacing.xl, gap: theme.spacing.sm },
  cta: { marginTop: 'auto', paddingTop: theme.spacing.xl, gap: theme.spacing.md },
}));
