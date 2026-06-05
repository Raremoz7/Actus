import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppText } from '@/components/ui';
import { weekdayLetter } from '@/lib/weekday';
import type { Weekday } from '@/types/workouts';

const ALL: Weekday[] = [1, 2, 3, 4, 5, 6, 7];

type Props = { active: number[] };

export function WeekdayChips({ active }: Props) {
  return (
    <View style={styles.row}>
      {ALL.map((wd) => {
        const on = active.includes(wd);
        return (
          <View key={wd} style={[styles.chip, on && styles.chipOn]}>
            <AppText variant="metaSmall" color={on ? 'inverse' : 'tertiary'}>
              {weekdayLetter(wd)}
            </AppText>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  row: { flexDirection: 'row', gap: theme.spacing.xs },
  chip: {
    width: 22,
    height: 22,
    borderRadius: theme.radius.tag,
    backgroundColor: theme.colors.surface3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipOn: { backgroundColor: theme.colors.neon },
}));
