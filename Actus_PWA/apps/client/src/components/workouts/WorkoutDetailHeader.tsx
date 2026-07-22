import { View } from 'react-native';
import { CalendarCheck } from 'phosphor-react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppText } from '@/components/ui';
import { darkTheme } from '@/theme';
import { WeekdayChips } from './WeekdayChips';

const { colors } = darkTheme;

type Props = {
  focus: string;
  exerciseCount: number;
  estMinutes: number;
  weekdays: number[];
  // Grupos musculares agregados (ex.: "Peito · Tríceps"). Vazio → omitido.
  muscleGroups?: string;
  // Vigência do plano (ex.: "Plano até 30 jun"). null → sem indicador.
  validityLabel?: string | null;
};

export function WorkoutDetailHeader({
  focus,
  exerciseCount,
  estMinutes,
  weekdays,
  muscleGroups,
  validityLabel,
}: Props) {
  const meta =
    estMinutes > 0
      ? `${exerciseCount} exercícios · ~${estMinutes} min`
      : `${exerciseCount} exercícios`;
  return (
    <View>
      <AppText variant="h2">
        {focus}
      </AppText>
      {muscleGroups ? (
        <AppText variant="metaSmall" color="neon" style={styles.groups}>
          {muscleGroups}
        </AppText>
      ) : null}
      <AppText variant="bodySm" color="secondary" style={styles.meta}>
        {meta}
      </AppText>
      <WeekdayChips active={weekdays} />
      {validityLabel ? (
        <View style={styles.validity}>
          <CalendarCheck size={13} weight="duotone" color={colors.textTertiary} />
          <AppText variant="metaSmall" color="tertiary">
            {validityLabel}
          </AppText>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  groups: { marginTop: theme.spacing.sm },
  meta: { marginTop: theme.spacing.xs, marginBottom: theme.spacing.sm },
  validity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.md,
  },
}));
