import { Pressable, View } from 'react-native';
import { Barbell } from 'phosphor-react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppText } from '@/components/ui';
import { OBJETIVO_LABEL, NIVEL_LABEL, type LibraryWorkout } from '@/types/workoutLibrary';
import { darkTheme } from '@/theme';

const { colors } = darkTheme;

type Props = {
  workout: LibraryWorkout;
  onPress: () => void;
};

// Card de um treino da biblioteca: objetivo (eyebrow) + nome + meta (nível · grupos · nº).
export function LibraryWorkoutCard({ workout, onPress }: Props) {
  const n = workout.exercises.length;
  const meta = `${NIVEL_LABEL[workout.nivel]} · ${workout.muscle_groups} · ${n} ${
    n === 1 ? 'exercício' : 'exercícios'
  }`;
  return (
    <Pressable style={styles.card} onPress={onPress} accessibilityRole="button">
      <View style={styles.head}>
        <Barbell size={14} weight="duotone" color={colors.textTertiary} />
        <AppText variant="eyebrow" color="tertiary">
          {OBJETIVO_LABEL[workout.objetivo]}
        </AppText>
      </View>
      <AppText variant="h3" style={styles.name} numberOfLines={1}>
        {workout.name}
      </AppText>
      <AppText variant="metaSmall" color="tertiary">
        {meta}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create((theme) => ({
  card: {
    backgroundColor: theme.colors.surface1,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    borderRadius: theme.radius.card,
    padding: theme.spacing.md,
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs },
  name: { marginTop: theme.spacing.xs, marginBottom: 2 },
}));
