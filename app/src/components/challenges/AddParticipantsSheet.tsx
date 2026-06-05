// BOTTOM SHEET de seleção múltipla de alunos para adicionar a um desafio.
//
// Recebe a lista JÁ FILTRADA (sem quem está no desafio), com seleção por
// checkbox. Confirma com os IDs marcados; o caller dispara o POST .../participants.
// Visual e estrutura alinhados ao ExerciseFormSheet (overlay + sheet + handle).
// 1 momento de motion isolado: reveal de entrada do sheet (300ms).

import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Check, UsersThree, X } from 'phosphor-react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppText, Button } from '@/components/ui';
import type { Student } from '@/types/professional';
import { darkTheme } from '@/theme';

const { colors, motion } = darkTheme;

export type AddParticipantsSheetProps = {
  visible: boolean;
  // Alunos elegíveis (vinculados e ainda fora do desafio).
  students: Student[];
  loading: boolean;
  saving: boolean;
  onClose: () => void;
  onConfirm: (studentIds: string[]) => void;
};

export function AddParticipantsSheet({
  visible,
  students,
  loading,
  saving,
  onClose,
  onConfirm,
}: AddParticipantsSheetProps) {
  // IDs marcados (estado local; resetado a cada abertura).
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (visible) setSelected(new Set());
  }, [visible]);

  // ÚNICA animação do sheet: slide/fade de entrada (300ms).
  const reveal = useSharedValue(0);
  useEffect(() => {
    reveal.value = withTiming(visible ? 1 : 0, { duration: motion.screenMs });
  }, [visible, reveal]);
  const sheetStyle = useAnimatedStyle(() => ({
    opacity: reveal.value,
    transform: [{ translateY: (1 - reveal.value) * 24 }],
  }));

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function handleConfirm() {
    if (selected.size === 0) return;
    onConfirm([...selected]);
  }

  const count = selected.size;
  const confirmLabel =
    count === 0
      ? 'Adicionar'
      : count === 1
        ? 'Adicionar 1 aluno'
        : `Adicionar ${count} alunos`;

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
          accessibilityLabel="Fechar seleção"
          onPress={onClose}
        />
        <Animated.View style={[styles.sheet, sheetStyle]}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <AppText variant="h3">Adicionar participantes</AppText>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Fechar"
              hitSlop={12}
              onPress={onClose}
            >
              <X size={20} weight="bold" color={colors.textSecondary} />
            </Pressable>
          </View>

          {loading ? (
            <AppText variant="bodySm" color="tertiary">
              Carregando alunos…
            </AppText>
          ) : students.length === 0 ? (
            <AppText variant="bodySm" color="tertiary">
              Todos os seus alunos já estão neste desafio.
            </AppText>
          ) : (
            <ScrollView
              style={styles.list}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            >
              {students.map((s) => {
                const checked = selected.has(s.id);
                return (
                  <Pressable
                    key={s.id}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked }}
                    accessibilityLabel={s.full_name ?? s.email}
                    onPress={() => toggle(s.id)}
                    style={[styles.row, checked && styles.rowChecked]}
                  >
                    <View style={styles.avatar}>
                      <UsersThree
                        size={18}
                        weight="duotone"
                        color={colors.neon}
                      />
                    </View>
                    <View style={styles.rowText}>
                      <AppText variant="bodyMd" color="primary" numberOfLines={1}>
                        {s.full_name ?? 'Aluno'}
                      </AppText>
                      <AppText
                        variant="metaSmall"
                        color="tertiary"
                        numberOfLines={1}
                      >
                        {s.email}
                      </AppText>
                    </View>
                    <View
                      style={[styles.checkbox, checked && styles.checkboxOn]}
                    >
                      {checked ? (
                        <Check
                          size={14}
                          weight="bold"
                          color={colors.textInverse}
                        />
                      ) : null}
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          )}

          <View style={styles.cta}>
            <Button
              variant="primary"
              label={confirmLabel}
              loading={saving}
              disabled={count === 0}
              onPress={handleConfirm}
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
  list: {
    // Limita a altura do sheet a ~metade da tela; rola se houver muitos alunos.
    maxHeight: 360,
  },
  listContent: {
    gap: theme.spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    backgroundColor: theme.colors.surface1,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    borderRadius: theme.radius.card,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
  },
  rowChecked: {
    borderColor: theme.colors.neon,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: theme.radius.tag,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxOn: {
    backgroundColor: theme.colors.neon,
    borderColor: theme.colors.neon,
  },
  cta: {
    marginTop: theme.spacing.xs,
  },
}));
