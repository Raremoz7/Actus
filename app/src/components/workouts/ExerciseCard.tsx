import { View } from 'react-native';
import { Timer } from 'phosphor-react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppText, Tag } from '@/components/ui';
import { darkTheme } from '@/theme';

const { colors } = darkTheme;

type Props = {
  name: string;
  sets: number;
  reps: number;
  restSeconds: number;
  muscleGroup: string | null;
};

export function ExerciseCard({ name, sets, reps, restSeconds, muscleGroup }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.left}>
        <AppText variant="h3" numberOfLines={2}>
          {name}
        </AppText>
        {muscleGroup ? (
          <View style={styles.tagWrap}>
            <Tag label={muscleGroup} />
          </View>
        ) : null}
      </View>
      <View style={styles.right}>
        <AppText variant="dataMed" color="neon">
          {`${sets}×${reps}`}
        </AppText>
        <View style={styles.rest}>
          <Timer size={12} weight="duotone" color={colors.textTertiary} />
          <AppText variant="metaSmall" color="tertiary">
            {`${restSeconds}s`}
          </AppText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    backgroundColor: theme.colors.surface1,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    borderRadius: theme.radius.card,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  left: { flex: 1, paddingRight: theme.spacing.sm },
  tagWrap: { flexDirection: 'row', marginTop: theme.spacing.xs },
  right: { alignItems: 'flex-end', gap: theme.spacing.xs },
  rest: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs },
}));
