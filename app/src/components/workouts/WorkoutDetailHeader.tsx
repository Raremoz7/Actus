import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppText } from '@/components/ui';
import { WeekdayChips } from './WeekdayChips';

type Props = {
  focus: string;
  exerciseCount: number;
  estMinutes: number;
  weekdays: number[];
};

export function WorkoutDetailHeader({ focus, exerciseCount, estMinutes, weekdays }: Props) {
  const meta =
    estMinutes > 0
      ? `${exerciseCount} exercícios · ~${estMinutes} min`
      : `${exerciseCount} exercícios`;
  return (
    <View>
      <AppText variant="h1" style={styles.focus}>
        {focus}
      </AppText>
      <AppText variant="bodySm" color="secondary" style={styles.meta}>
        {meta}
      </AppText>
      <WeekdayChips active={weekdays} />
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  focus: { fontSize: 36, lineHeight: 34 },
  meta: { marginTop: theme.spacing.sm, marginBottom: theme.spacing.sm },
}));
