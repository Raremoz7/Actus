import { Pressable } from 'react-native';
import { Play } from 'phosphor-react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppText } from '@/components/ui';
import { darkTheme } from '@/theme';

const { colors } = darkTheme;

type Props = {
  title: string;
  exerciseCount: number;
  estMinutes: number;
  isToday: boolean;
  lastCompletedLabel?: string;
  onStart: () => void;
  onOpen: () => void;
};

export function NextWorkoutCard({
  title,
  exerciseCount,
  estMinutes,
  isToday,
  lastCompletedLabel,
  onStart,
  onOpen,
}: Props) {
  const meta =
    estMinutes > 0
      ? `${exerciseCount} exercícios · ~${estMinutes} min`
      : `${exerciseCount} exercícios`;
  return (
    <Pressable style={styles.card} onPress={onOpen} accessibilityRole="button">
      <AppText variant="eyebrow" color="neon">
        {isToday ? 'Próximo · hoje' : 'Próximo treino'}
      </AppText>
      <AppText variant="h2" style={styles.title}>
        {title}
      </AppText>
      <AppText variant="bodySm" color="secondary" style={styles.metaTight}>
        {meta}
      </AppText>
      <AppText variant="metaSmall" color="tertiary" style={styles.meta}>
        {lastCompletedLabel ?? ''}
      </AppText>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Iniciar treino"
        style={styles.cta}
        onPress={onStart}
      >
        <Play size={18} weight="fill" color={colors.textInverse} />
        <AppText variant="label" color="inverse">
          Iniciar treino
        </AppText>
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create((theme) => ({
  card: {
    backgroundColor: theme.colors.surface1,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    borderRadius: theme.radius.card,
    padding: theme.spacing.lg,
  },
  title: { marginTop: theme.spacing.sm },
  metaTight: { marginTop: theme.spacing.xs },
  meta: { marginTop: theme.spacing.xs, marginBottom: theme.spacing.lg },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.neon,
    borderRadius: theme.radius.pill,
    paddingVertical: theme.spacing.md,
  },
}));
