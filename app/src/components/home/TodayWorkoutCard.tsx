import { Pressable, View } from 'react-native';
import { Play, MoonStars, CaretRight, Check } from 'phosphor-react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppText, Card } from '@/components/ui';
import { WorkoutCardPhoto } from '@/components/workouts/WorkoutCardPhoto';
import { darkTheme } from '@/theme';
import type { TodayWorkoutSummary } from '@/types/workouts';

const { colors } = darkTheme;

type Props = {
  summary: TodayWorkoutSummary;
  onStart: () => void;
  onSeeWeek: () => void;
  // true quando o treino de hoje já foi concluído (last_completed_date === hoje).
  done?: boolean;
};

// Texto secundário sem repetir o título. Quando muscle_groups e name coincidem
// (caso comum: sem notes, ambos caem no nome do treino), mostra só a contagem.
function metaLine(
  exerciseCount: number,
  estMinutes: number,
  name: string,
  title: string,
): string {
  const parts = [`${exerciseCount} exercícios`];
  if (estMinutes > 0) parts.push(`~${estMinutes} min`);
  if (name && name !== title) parts.push(name);
  return parts.join(' · ');
}

export function TodayWorkoutCard({ summary, onStart, onSeeWeek, done = false }: Props) {
  if (summary.has_workout && summary.workout) {
    const w = summary.workout;

    // Treino concluído hoje: selo + copy quiet-luxury, sem CTA de iniciar.
    if (done) {
      return (
        <Card padding="none" style={styles.cardExtra}>
          <WorkoutCardPhoto hint={w.muscle_groups} />
          <AppText variant="eyebrow" color="neon">
            Treino de hoje
          </AppText>
          <AppText variant="h1" style={styles.hero}>
            {w.muscle_groups}
          </AppText>
          <View style={[styles.cta, styles.ctaDone]}>
            <Check size={18} weight="bold" color={colors.neon} />
            <AppText variant="label" color="neon">
              Treino concluído
            </AppText>
          </View>
        </Card>
      );
    }

    return (
      <Card padding="none" style={styles.cardExtra}>
        <WorkoutCardPhoto hint={w.muscle_groups} />
        <AppText variant="eyebrow" color="neon">
          Treino de hoje
        </AppText>
        <AppText variant="h1" style={styles.hero}>
          {w.muscle_groups}
        </AppText>
        <AppText variant="dataMed" color="accentMuted" style={styles.meta}>
          {metaLine(w.exercise_count, w.est_minutes, w.name, w.muscle_groups)}
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
      </Card>
    );
  }

  const next = summary.next_workout;
  return (
    <Card padding="none" style={styles.cardExtra}>
      <View style={styles.restIcon}>
        <MoonStars size={26} weight="duotone" color={colors.secondary} />
      </View>
      <AppText variant="eyebrow" color="secondary">
        Hoje
      </AppText>
      <AppText variant="h2" style={styles.restTitle}>
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
    </Card>
  );
}

const styles = StyleSheet.create((theme) => ({
  cardExtra: {
    padding: theme.spacing.xl,
    // Clipa a foto full-bleed ao raio do card.
    overflow: 'hidden',
  },
  // Herói: título grande (h1) com respiro generoso acima.
  hero: {
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  restTitle: {
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  meta: {
    marginBottom: theme.spacing.xl,
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
  // Estado concluído: pílula vazada neon (afirmação, não ação).
  ctaDone: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.neon,
    marginTop: theme.spacing.xs,
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
