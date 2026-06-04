import { View } from 'react-native';
import { Check } from 'phosphor-react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppText } from '@/components/ui';
import { darkTheme } from '@/theme';
import { weekdayLetter } from '@/lib/weekday';
import type { WeeklyOverview } from '@/types/gamification';

const { colors } = darkTheme;

type Props = { overview: WeeklyOverview };

export function WeekStrip({ overview }: Props) {
  return (
    <View>
      <View style={styles.header}>
        <AppText variant="eyebrow" color="tertiary">
          Sua semana
        </AppText>
        <AppText variant="metaSmall" color="neon">
          {`${overview.streak_current} dias seguidos`}
        </AppText>
      </View>
      <View style={styles.row}>
        {overview.days.map((day) => {
          const isToday = day.date === overview.today_date;
          return (
            <View key={day.date} style={styles.day}>
              <AppText variant="metaSmall" color="tertiary">
                {weekdayLetter(day.weekday)}
              </AppText>
              <View
                style={[
                  styles.dot,
                  day.completed && styles.dotDone,
                  !day.completed && isToday && styles.dotToday,
                ]}
              >
                {day.completed ? (
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
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
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
  dotDone: {
    backgroundColor: theme.colors.neon,
  },
  dotToday: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: theme.colors.neon,
  },
}));
