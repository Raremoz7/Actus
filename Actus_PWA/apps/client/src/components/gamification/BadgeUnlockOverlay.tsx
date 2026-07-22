import { useEffect, useRef } from 'react';
import { Modal, Pressable, View } from 'react-native';
import * as Haptics from '@/lib/haptics';
import { Trophy } from 'phosphor-react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppText } from '@/components/ui';
import { darkTheme } from '@/theme';
import type { Badge } from '@/types/gamification';

const { colors } = darkTheme;

// Tempo de exibição antes de dispensar automaticamente (ms).
const AUTO_DISMISS_MS = 3000;

type Props = {
  badge: Badge;
  onContinue: () => void;
};

// Overlay full-screen de conquista: comemora o desbloqueio de um badge com
// celebração visual (placeholder de Lottie + ícone), som e haptics best-effort,
// auto-dismiss em 3s e botão "Continuar". Os efeitos colaterais (som/haptics)
// nunca derrubam o render — são todos best-effort com catch silencioso.
export function BadgeUnlockOverlay({ badge, onContinue }: Props) {
  // Mantém a referência mais recente do callback p/ o timer não fechar sobre
  // uma versão obsoleta caso o componente re-renderize.
  const onContinueRef = useRef(onContinue);
  onContinueRef.current = onContinue;

  useEffect(() => {
    // Haptics de sucesso (best-effort).
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

    // Som de conquista: cortado na migração para RN bare (o player era um
    // placeholder sem asset real). Reintroduzir quando o efeito sonoro existir.

    // Auto-dismiss após 3s.
    const timer = setTimeout(() => onContinueRef.current(), AUTO_DISMISS_MS);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  return (
    <Modal transparent visible animationType="fade" onRequestClose={onContinue}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          {/* TODO: trocar pelo LottieView de confete quando o asset chegar.
              Placeholder seguro: medalhão com o troféu da conquista. */}
          <View style={styles.medal}>
            <Trophy size={64} weight="duotone" color={colors.neon} />
          </View>

          <AppText variant="eyebrow" color="secondary">
            Você conquistou:
          </AppText>

          <AppText variant="h2" color="primary" style={styles.name}>
            {badge.name}
          </AppText>

          {badge.description ? (
            <AppText variant="bodySm" color="secondary" style={styles.description}>
              {badge.description}
            </AppText>
          ) : null}

          <Pressable
            accessibilityRole="button"
            onPress={onContinue}
            style={styles.button}
            hitSlop={8}
          >
            <AppText variant="label" color="inverse">
              Continuar
            </AppText>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create((theme) => ({
  backdrop: {
    flex: 1,
    backgroundColor: theme.colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingVertical: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
    backgroundColor: theme.colors.surface1,
    borderRadius: theme.radius.modal,
  },
  medal: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface2,
    marginBottom: theme.spacing.sm,
  },
  name: {
    textAlign: 'center',
  },
  description: {
    textAlign: 'center',
  },
  button: {
    marginTop: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: 100,
    backgroundColor: theme.colors.neon,
    alignItems: 'center',
  },
}));
