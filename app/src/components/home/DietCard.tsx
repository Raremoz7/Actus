import { View } from 'react-native';
import { ForkKnife } from 'phosphor-react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppText, Card } from '@/components/ui';
import { darkTheme } from '@/theme';

const { colors } = darkTheme;

type Props = {
  title: string;
  mealCount: number;
  targetKcal?: number | null;
  onPress?: () => void;
};

export function DietCard({ title, mealCount, targetKcal, onPress }: Props) {
  const mealLabel = `${mealCount} ${mealCount === 1 ? 'refeição' : 'refeições'}`;
  const detail =
    targetKcal && targetKcal > 0
      ? `${mealLabel} · ${targetKcal.toLocaleString('pt-BR')} kcal`
      : mealLabel;

  const inner = (
    <>
      {/* Ícone decorativo de fundo — discreta textura visual */}
      <View style={styles.bgIcon} pointerEvents="none">
        <ForkKnife size={72} weight="duotone" color={colors.neon} />
      </View>
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

  return (
    <Card onPress={onPress} style={styles.cardExtra}>
      {inner}
    </Card>
  );
}

const styles = StyleSheet.create((theme) => ({
  cardExtra: {
    flex: 1,
    overflow: 'hidden',
  },
  bgIcon: {
    position: 'absolute',
    right: -12,
    bottom: -12,
    opacity: 0.06,
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs },
  name: { marginTop: theme.spacing.xs, marginBottom: 2 },
}));
