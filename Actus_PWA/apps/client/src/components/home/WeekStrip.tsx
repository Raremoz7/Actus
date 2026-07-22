import { View } from 'react-native';
import { Check, Flame } from 'phosphor-react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppText } from '@/components/ui';
import { darkTheme } from '@/theme';
import { weekdayLetter } from '@/lib/weekday';
import type { WeeklyOverview } from '@/types/gamification';
import type { Weekday } from '@/types/workouts';

const { colors } = darkTheme;

type Props = {
  overview: WeeklyOverview;
  // Weekdays (ISO 1..7) com treino planejado — cruzados com os dias da semana
  // para marcar anel (planejado), preenchido (concluído) e apagado (perdido).
  plannedWeekdays: Weekday[];
};

// Estado visual de um dia da semana, derivado do cruzamento concluído × planejado × tempo.
type DayState = 'done' | 'planned-today' | 'planned-future' | 'missed' | 'rest';

function dayState(
  completed: boolean,
  isPlanned: boolean,
  isToday: boolean,
  isPast: boolean,
): DayState {
  if (completed) return 'done';
  if (!isPlanned) return 'rest';
  if (isToday) return 'planned-today';
  if (isPast) return 'missed';
  return 'planned-future';
}

export function WeekStrip({ overview, plannedWeekdays }: Props) {
  const planned = new Set(plannedWeekdays);
  return (
    <View>
      <View style={styles.header}>
        <View style={styles.kpi}>
          {overview.streak_current >= 3 ? (
            <Flame size={22} weight="duotone" color={colors.flame} />
          ) : null}
          <AppText variant="dataBig" color="neon">
            {String(overview.streak_current)}
          </AppText>
        </View>
        <View style={styles.kpiSide}>
          <AppText variant="eyebrow" color="tertiary">
            Sequência
          </AppText>
          <AppText variant="metaSmall" color="secondary">
            {`Recorde ${overview.streak_best}`}
          </AppText>
        </View>
      </View>
      <View style={styles.row}>
        {overview.days.map((day) => {
          const isToday = day.date === overview.today_date;
          const isPast = day.date < overview.today_date;
          const state = dayState(
            day.completed,
            planned.has(day.weekday as Weekday),
            isToday,
            isPast,
          );
          return (
            <View key={day.date} style={styles.day}>
              <AppText
                variant="metaSmall"
                color={isToday ? 'secondary' : 'tertiary'}
              >
                {weekdayLetter(day.weekday as Weekday)}
              </AppText>
              <View
                style={[
                  styles.dot,
                  state === 'done' && styles.dotDone,
                  state === 'planned-today' && styles.dotToday,
                  state === 'planned-future' && styles.dotPlanned,
                  state === 'missed' && styles.dotMissed,
                ]}
              >
                {state === 'done' ? (
                  <Check size={13} weight="bold" color={colors.textInverse} />
                ) : null}
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  kpi: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  kpiSide: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.xs,
  },
  day: {
    flex: 1,
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  dot: {
    width: 28,
    height: 28,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Concluído: preenchido neon.
  dotDone: {
    backgroundColor: theme.colors.neon,
  },
  // Planejado hoje: anel neon vazado (afordância da ação do dia).
  dotToday: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: theme.colors.neon,
  },
  // Planejado futuro: ponto neutro com leve marcador (anel discreto).
  dotPlanned: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.outline,
  },
  // Planejado e perdido (passado, não concluído): error sutil, apagado.
  dotMissed: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.error,
    opacity: 0.5,
  },
}));
