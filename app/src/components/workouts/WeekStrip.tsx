import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppText } from '@/components/ui';
import type { StudentWorkout, Weekday } from '@/types/workouts';

const ORDER: Weekday[] = [1, 2, 3, 4, 5, 6, 7];
const SHORT: Record<Weekday, string> = {
  1: 'Seg', 2: 'Ter', 3: 'Qua', 4: 'Qui', 5: 'Sex', 6: 'Sáb', 7: 'Dom',
};

// Rótulo curto do treino do dia: prioriza o nome (1ª palavra), recorta em 8 chars.
function dayLabel(w: StudentWorkout): string {
  const base = w.workout_name.trim().split(/\s+/)[0] ?? '';
  return base.length > 8 ? `${base.slice(0, 7)}…` : base;
}

type Props = {
  workouts: StudentWorkout[];
  today: Weekday;
};

// Faixa Seg..Dom: dias com treino mostram o rótulo abreviado; hoje em neon;
// dias de descanso ficam esmaecidos. Visão de relance da semana do aluno.
export function WeekStrip({ workouts, today }: Props) {
  // weekday -> primeiro treino ativo agendado nele.
  const byDay = new Map<Weekday, StudentWorkout>();
  for (const w of workouts) {
    if (!w.is_active) continue;
    for (const wd of w.weekdays) {
      if (!byDay.has(wd as Weekday)) byDay.set(wd as Weekday, w);
    }
  }

  return (
    <View style={styles.row} accessibilityRole="summary" accessibilityLabel="Semana de treinos">
      {ORDER.map((wd) => {
        const workout = byDay.get(wd);
        const isToday = wd === today;
        const hasWorkout = Boolean(workout);
        return (
          <View key={wd} style={styles.col}>
            <AppText
              variant="metaSmall"
              color={isToday ? 'neon' : hasWorkout ? 'secondary' : 'tertiary'}
            >
              {SHORT[wd]}
            </AppText>
            <View
              style={[
                styles.cell,
                hasWorkout && styles.cellActive,
                isToday && styles.cellToday,
              ]}
            >
              {hasWorkout ? (
                <AppText
                  variant="metaSmall"
                  color={isToday ? 'inverse' : 'primary'}
                  numberOfLines={1}
                >
                  {dayLabel(workout!)}
                </AppText>
              ) : (
                <View style={styles.restDot} />
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  row: { flexDirection: 'row', gap: theme.spacing.xs },
  col: { flex: 1, alignItems: 'center', gap: theme.spacing.xs },
  cell: {
    alignSelf: 'stretch',
    height: 38,
    borderRadius: theme.radius.thumb,
    backgroundColor: theme.colors.surface1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  cellActive: { backgroundColor: theme.colors.surface3 },
  cellToday: { backgroundColor: theme.colors.neon },
  restDot: {
    width: 4,
    height: 4,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.textTertiary,
  },
}));
