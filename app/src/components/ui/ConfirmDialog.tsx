import { Modal, Pressable, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useEffect } from 'react';
import { StyleSheet } from 'react-native-unistyles';

import { AppText } from './Text';
import { Button } from './Button';
import { darkTheme } from '@/theme';

const { motion } = darkTheme;

export type ConfirmDialogProps = {
  visible: boolean;
  title: string;
  message?: string;
  confirmLabel: string;
  cancelLabel?: string;
  // 'destructive' pinta o botão de confirmação em error (ex.: Sair, Excluir).
  tone?: 'default' | 'destructive';
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

// Diálogo de confirmação do app — substitui Alert.alert (que não renderiza os
// botões no web). Modal centralizado, radius de modal (24) e sombra (exceção
// legítima: modais/sheets podem ter sombra). Backdrop fecha = cancelar.
export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel = 'Cancelar',
  tone = 'default',
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  // ÚNICA animação do diálogo: reveal do card (opacity + scale, 300ms).
  const reveal = useSharedValue(0);
  useEffect(() => {
    reveal.value = withTiming(visible ? 1 : 0, { duration: motion.screenMs });
  }, [visible, reveal]);
  const cardStyle = useAnimatedStyle(() => ({
    opacity: reveal.value,
    transform: [{ scale: 0.96 + reveal.value * 0.04 }],
  }));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
      accessibilityViewIsModal
    >
      <View style={styles.backdrop}>
        {/* Toque fora do card = cancelar. */}
        <Pressable
          style={StyleSheet.absoluteFill}
          accessibilityLabel="Fechar"
          onPress={onCancel}
        />
        <Animated.View style={[styles.card, cardStyle]}>
          <AppText variant="h3" style={styles.title}>
            {title}
          </AppText>
          {message ? (
            <AppText variant="bodyMd" color="secondary" style={styles.message}>
              {message}
            </AppText>
          ) : null}

          <View style={styles.actions}>
            <Button variant="secondary" label={cancelLabel} onPress={onCancel} disabled={loading} />
            <Button
              variant={tone === 'destructive' ? 'destructive' : 'primary'}
              label={confirmLabel}
              onPress={onConfirm}
              loading={loading}
            />
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create((theme) => ({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
    backgroundColor: theme.colors.overlay,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    borderRadius: theme.radius.modal,
    backgroundColor: theme.colors.surface2,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    gap: theme.spacing.sm,
    // Sombra — exceção legítima do design (modal/sheet/dropdown).
    ...theme.shadow.modal,
  },
  title: {
    marginBottom: theme.spacing.xs,
  },
  message: {
    marginBottom: theme.spacing.md,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: theme.spacing.sm,
  },
}));
