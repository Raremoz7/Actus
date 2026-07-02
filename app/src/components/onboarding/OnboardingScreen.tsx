// Scaffold dos passos: eyebrow de progresso (ex.: "03 / 08"), título (uma pergunta
// principal por tela), conteúdo e CTA(s). 1 momento de motion: reveal de entrada.
import { useEffect, useState, type ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { WarningCircle } from 'phosphor-react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppText, Button } from '@/components/ui';
import { darkTheme } from '@/theme';

const { motion, colors } = darkTheme;

type Props = {
  step: number;
  total: number;
  title: string;
  subtitle?: string;
  children: ReactNode;
  ctaLabel: string;
  // Legado: desabilita o botão. Prefira `canAdvance` para poder sinalizar o
  // que faltou (o botão fica tocável e o erro aparece ao tentar avançar).
  ctaDisabled?: boolean;
  ctaLoading?: boolean;
  // Validação "ao tentar avançar": quando `false`, o CTA fica habilitado, mas
  // tocá-lo NÃO avança — mostra `invalidMessage` e chama `onInvalidAttempt`
  // (para o passo marcar campos específicos). `undefined` = mecanismo inativo. (TEC-74)
  canAdvance?: boolean;
  invalidMessage?: string;
  onInvalidAttempt?: () => void;
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
  canAdvance,
  invalidMessage,
  onInvalidAttempt,
  onCta,
  skipLabel,
  onSkip,
}: Props) {
  const opacity = useSharedValue(0);
  useEffect(() => {
    opacity.value = withTiming(1, { duration: motion.screenMs });
  }, [opacity]);
  const revealStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  // Só passa a valer depois de uma tentativa de avançar bloqueada; some assim
  // que `canAdvance` vira true (usuário preencheu o pendente).
  const [attempted, setAttempted] = useState(false);
  useEffect(() => {
    if (canAdvance) setAttempted(false);
  }, [canAdvance]);

  function handleCta() {
    if (canAdvance === false) {
      setAttempted(true);
      onInvalidAttempt?.();
      return;
    }
    onCta();
  }

  const showInvalid = attempted && canAdvance === false && !!invalidMessage;

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
            {showInvalid ? (
              <View style={styles.invalidRow} accessibilityLiveRegion="polite">
                <WarningCircle size={16} weight="duotone" color={colors.error} />
                <AppText variant="bodySm" color="error" style={styles.invalidText}>
                  {invalidMessage}
                </AppText>
              </View>
            ) : null}
            <Button
              variant="primary"
              label={ctaLabel}
              disabled={ctaDisabled}
              loading={ctaLoading}
              onPress={handleCta}
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
  invalidRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  invalidText: { flexShrink: 1 },
}));
