import { Pressable, View } from 'react-native';
import { ForkKnife } from 'phosphor-react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppText } from '@/components/ui';
import { darkTheme } from '@/theme';

const { colors } = darkTheme;

// onPress é opcional: sem tela de dieta do aluno (builder é do nutri), o card
// fica informativo em vez de navegar para o lugar errado.
// Dados honestos do body: nº de refeições e meta de kcal (quando o nutri preencheu).
type Props = {
  title: string;
  mealCount: number;
  targetKcal?: number | null;
  onPress?: () => void;
};

export function DietCard({ title, mealCount, targetKcal, onPress }: Props) {
  // Linha de dado real: "5 refeições · 2.400 kcal" (meta só se existir no body).
  const mealLabel = `${mealCount} ${mealCount === 1 ? 'refeição' : 'refeições'}`;
  const detail =
    targetKcal && targetKcal > 0
      ? `${mealLabel} · ${targetKcal.toLocaleString('pt-BR')} kcal`
      : mealLabel;

  const inner = (
    <>
      <View style={styles.head}>
        <ForkKnife size={14} weight="duotone" color={colors.textTertiary} />
        <AppText variant="eyebrow" color="tertiary">
          Dieta
        </AppText>
      </View>
      <AppText variant="h3" style={styles.name} numberOfLines={1}>
        {title}
      </AppText>
      <AppText variant="metaSmall" color="tertiary">
        {detail}
      </AppText>
    </>
  );

  if (onPress) {
    return (
      <Pressable style={styles.card} onPress={onPress} accessibilityRole="button">
        {inner}
      </Pressable>
    );
  }

  return <View style={styles.card}>{inner}</View>;
}

const styles = StyleSheet.create((theme) => ({
  card: {
    flex: 1,
    backgroundColor: theme.colors.surface1,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    borderRadius: theme.radius.card,
    padding: theme.spacing.md,
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs },
  name: { marginTop: theme.spacing.xs, marginBottom: 2 },
}));
