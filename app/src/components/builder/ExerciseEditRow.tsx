import { Pressable, View } from 'react-native';
import { ArrowDown, ArrowUp, PencilSimple, Trash } from 'phosphor-react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppText, Tag } from '@/components/ui';
import { darkTheme } from '@/theme';

const { colors } = darkTheme;

export type ExerciseEditRowProps = {
  // Nome do exercício (name_snapshot).
  name: string;
  sets: number;
  reps: number;
  restSeconds: number;
  // Posição 1-based exibida como prefixo discreto.
  position: number;
  // ↑ desabilitado no primeiro item; ↓ no último.
  canMoveUp: boolean;
  canMoveDown: boolean;
  onEdit: () => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
};

// Linha de um exercício já adicionado ao treino (passo 2 do builder).
// Mostra nome + chips "Sx Rr · Ds" e ações: reordenar ↑↓, editar, remover.
export function ExerciseEditRow({
  name,
  sets,
  reps,
  restSeconds,
  position,
  canMoveUp,
  canMoveDown,
  onEdit,
  onRemove,
  onMoveUp,
  onMoveDown,
}: ExerciseEditRowProps) {
  return (
    <View style={styles.row}>
      <View style={styles.reorder}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Mover ${name} para cima`}
          accessibilityState={{ disabled: !canMoveUp }}
          disabled={!canMoveUp}
          hitSlop={8}
          onPress={onMoveUp}
          style={[styles.iconBtn, !canMoveUp && styles.iconBtnOff]}
        >
          <ArrowUp size={16} weight="bold" color={colors.textSecondary} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Mover ${name} para baixo`}
          accessibilityState={{ disabled: !canMoveDown }}
          disabled={!canMoveDown}
          hitSlop={8}
          onPress={onMoveDown}
          style={[styles.iconBtn, !canMoveDown && styles.iconBtnOff]}
        >
          <ArrowDown size={16} weight="bold" color={colors.textSecondary} />
        </Pressable>
      </View>

      <View style={styles.body}>
        <AppText variant="metaSmall" color="tertiary">
          {`${position.toString().padStart(2, '0')}`}
        </AppText>
        <AppText variant="h4" numberOfLines={2} style={styles.name}>
          {name}
        </AppText>
        <View style={styles.chips}>
          <Tag label={`${sets}×${reps}`} tone="neutral" />
          <Tag label={`${restSeconds}s`} tone="neutral" />
        </View>
      </View>

      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Editar ${name}`}
          hitSlop={8}
          onPress={onEdit}
          style={styles.iconBtn}
        >
          <PencilSimple size={18} weight="duotone" color={colors.textSecondary} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Remover ${name}`}
          hitSlop={8}
          onPress={onRemove}
          style={styles.iconBtn}
        >
          <Trash size={18} weight="duotone" color={colors.error} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.surface1,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    borderRadius: theme.radius.card,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  reorder: {
    gap: theme.spacing.xs,
  },
  body: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  name: {},
  chips: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.xs,
  },
  actions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  iconBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnOff: {
    opacity: 0.3,
  },
}));
