import { Pressable, View } from 'react-native';
import { Play, MoonStars, CaretRight } from 'phosphor-react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppText } from '@/components/ui';
import { darkTheme } from '@/theme';
import type { TodayWorkoutSummary } from '@/types/workouts';

const { colors } = darkTheme;

type Props = {
  summary: TodayWorkoutSummary;
  onStart: () => void;
  onSeeWeek: () => void;
};

export function TodayWorkoutCard({ summary, onStart, onSeeWeek }: Props) {
  if (summary.has_workout && summary.workout) {
    const w = summary.workout;
    return (
      <View style={styles.card}>
        <AppText variant="eyebrow" color="neon">
          Treino de hoje
        </AppText>
        <AppText variant="h2" style={styles.muscle}>
          {w.muscle_groups}
        </AppText>
        <AppText variant="bodySm" color="secondary" style={styles.meta}>
          {`${w.exercise_count} exercícios${w.est_minutes > 0 ? ` · ~${w.est_minutes} min` : ''} · ${w.name}`}
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
      </View>
    );
  }

  const next = summary.next_workout;
  return (
    <View style={styles.card}>
      <View style={styles.restIcon}>
        <MoonStars size={26} weight="duotone" color={colors.secondary} />
      </View>
      <AppText variant="eyebrow" color="secondary">
        Hoje
      </AppText>
      <AppText variant="h2" style={styles.muscle}>
        Dia de descanso
      </AppText>
      <AppText variant="bodySm" color="secondary" style={styles.meta}>
        {next
          ? `Recuperação faz parte do plano. Próximo treino: ${next.muscle_groups}`
          : 'Recuperação faz parte do plano.'}
      </AppText>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Ver treinos da semana"
        hitSlop={{ top: 8, bottom: 8 }}
        style={styles.ghostLine}
        onPress={onSeeWeek}
      >
        <AppText variant="bodyMd" color="secondary">
          Ver treinos da semana
        </AppText>
        <CaretRight size={16} weight="bold" color={colors.textTertiary} />
      </Pressable>
    </View>
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
  muscle: {
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  meta: {
    marginBottom: theme.spacing.lg,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.neon,
    borderRadius: theme.radius.pill,
    paddingVertical: theme.spacing.md,
  },
  ghostLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: theme.colors.outlineVariant,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
    marginTop: theme.spacing.xs,
  },
  restIcon: {
    width: 46,
    height: 46,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
  },
}));
