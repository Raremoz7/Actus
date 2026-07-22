// BOTTOM SHEET base — casca reutilizável dos sheets do app (overlay + handle +
// header + conteúdo), com duas coisas resolvidas de fábrica:
//   - Safe area inferior: soma insets.bottom no padding, pro rodapé (botões) não
//     ficar sob a barra de navegação do Android. (TEC-90)
//   - Teclado: KeyboardAvoidingView ATIVO dentro do Modal. RN Modal abre em janela
//     própria e não herda o windowSoftInputMode=adjustResize da Activity, então sem
//     isso o teclado cobre o campo em foco. (TEC-92)
// 1 momento de motion isolado: reveal de entrada do sheet (300ms), igual aos sheets
// originais de onde este componente foi extraído.

import { type ReactNode, useEffect } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'phosphor-react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppText } from './Text';
import { darkTheme } from '@/theme';

const { colors, motion, spacing } = darkTheme;

export type BottomSheetProps = {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  // Rótulo acessível do backdrop (varia por contexto: "Fechar formulário" etc.).
  closeLabel?: string;
};

export function BottomSheet({
  visible,
  title,
  onClose,
  children,
  closeLabel = 'Fechar',
}: BottomSheetProps) {
  const insets = useSafeAreaInsets();

  // ÚNICA animação do sheet: slide/fade de entrada (300ms).
  const reveal = useSharedValue(0);
  useEffect(() => {
    reveal.value = withTiming(visible ? 1 : 0, { duration: motion.screenMs });
  }, [visible, reveal]);
  const sheetStyle = useAnimatedStyle(() => ({
    opacity: reveal.value,
    transform: [{ translateY: (1 - reveal.value) * 24 }],
  }));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      accessibilityViewIsModal
    >
      <View style={styles.backdrop}>
        <Pressable
          style={styles.backdropPress}
          accessibilityRole="button"
          accessibilityLabel={closeLabel}
          onPress={onClose}
        />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <Animated.View
            style={[styles.sheet, sheetStyle, { paddingBottom: spacing.xxl + insets.bottom }]}
          >
            <View style={styles.handle} />

            <View style={styles.header}>
              <AppText variant="h3">{title}</AppText>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Fechar"
                hitSlop={12}
                onPress={onClose}
              >
                <X size={20} weight="bold" color={colors.textSecondary} />
              </Pressable>
            </View>

            {children}
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create((theme) => ({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: theme.colors.overlay,
  },
  backdropPress: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    backgroundColor: theme.colors.bgBase,
    borderTopLeftRadius: theme.radius.modal,
    borderTopRightRadius: theme.radius.modal,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.xxl,
    gap: theme.spacing.lg,
    // Sombra: permitida em sheet (exceção do design para modal/sheet/dropdown).
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: theme.radius.tag,
    backgroundColor: theme.colors.surface3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
}));
