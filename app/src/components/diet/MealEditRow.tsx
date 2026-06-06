import { Pressable, View } from 'react-native';
import { ArrowDown, ArrowUp, PencilSimple, Trash } from 'phosphor-react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppText, Tag } from '@/components/ui';
import { darkTheme } from '@/theme';

const { colors } = darkTheme;

export type MealEditRowProps = {
  // Nome da refeição (ex.: "Café da manhã").
  name: string;
  // Horário sugerido (ex.: "08:00") — exibido discreto ao lado da posição.
  time?: string;
  // Macros opcionais — só viram chips quando informados.
  kcal?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
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

// Monta os chips de macros que existem (todos opcionais). Sem dados inventados:
// só entra o que foi informado.
function macroChips(
  kcal?: number,
  protein?: number,
  carbs?: number,
  fat?: number,
): { key: string; label: string }[] {
  const chips: { key: string; label: string }[] = [];
  if (kcal !== undefined) chips.push({ key: 'kcal', label: `${kcal} kcal` });
  if (protein !== undefined) chips.push({ key: 'protein', label: `P ${protein}g` });
  if (carbs !== undefined) chips.push({ key: 'carbs', label: `C ${carbs}g` });
  if (fat !== undefined) chips.push({ key: 'fat', label: `G ${fat}g` });
  return chips;
}

// Linha de uma refeição já adicionada à dieta (passo 2 do builder).
// Mostra nome + chips de macros (quando houver) e ações: reordenar ↑↓, editar, remover.
export function MealEditRow({
  name,
  time,
  kcal,
  protein,
  carbs,
  fat,
  position,
  canMoveUp,
  canMoveDown,
  onEdit,
  onRemove,
  onMoveUp,
  onMoveDown,
}: MealEditRowProps) {
  const chips = macroChips(kcal, protein, carbs, fat);

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
        <View style={styles.metaLine}>
          <AppText variant="metaSmall" color="tertiary">
            {`${position.toString().padStart(2, '0')}`}
          </AppText>
          {time ? (
            <AppText variant="metaSmall" color="neon">
              {time}
            </AppText>
          ) : null}
        </View>
        <AppText variant="h4" numberOfLines={2}>
          {name}
        </AppText>
        {chips.length > 0 ? (
          <View style={styles.chips}>
            {chips.map((c) => (
              <Tag key={c.key} label={c.label} tone="neutral" />
            ))}
          </View>
        ) : null}
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
  metaLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
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
