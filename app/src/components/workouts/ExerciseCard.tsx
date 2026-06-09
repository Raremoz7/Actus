import { Pressable, View } from 'react-native';
import { Barbell, Note, Timer } from 'phosphor-react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppText, Tag } from '@/components/ui';
import { darkTheme } from '@/theme';

import { ExerciseThumb } from './ExerciseThumb';

const { colors } = darkTheme;

type Props = {
  name: string;
  sets: number;
  reps: number;
  restSeconds: number;
  muscleGroup: string | null;
  equipment?: string | null;
  // Nota do personal para o exercício — linha discreta abaixo do nome.
  notes?: string | null;
  // Posição (1-based) p/ numerar exercícios em treinos longos. Omitido → sem número.
  position?: number;
  wgerExerciseId?: number | null;
  onPress?: () => void;
};

export function ExerciseCard({
  name,
  sets,
  reps,
  restSeconds,
  muscleGroup,
  equipment,
  notes,
  position,
  wgerExerciseId,
  onPress,
}: Props) {
  const content = (
    <>
      <ExerciseThumb size={56} wgerExerciseId={wgerExerciseId} muscleGroup={muscleGroup} />
      <View style={styles.left}>
        <AppText variant="h3" numberOfLines={2}>
          {position ? `${position}. ${name}` : name}
        </AppText>
        {muscleGroup ? (
          <View style={styles.tagWrap}>
            <Tag label={muscleGroup} />
          </View>
        ) : null}
        {equipment ? (
          <View style={styles.equipment}>
            <Barbell size={12} weight="duotone" color={colors.textTertiary} />
            <AppText variant="metaSmall" color="tertiary">
              {equipment}
            </AppText>
          </View>
        ) : null}
        {notes ? (
          <View style={styles.notes}>
            <Note size={12} weight="duotone" color={colors.textTertiary} />
            <AppText variant="bodySm" color="tertiary" style={styles.notesText}>
              {notes}
            </AppText>
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
    </>
  );

  // Rótulo agregado p/ leitor de tela: nome, séries×reps, descanso e nota numa frase.
  const a11yLabel = [
    name,
    `${sets} séries de ${reps}`,
    `descanso ${restSeconds}s`,
    notes ? `nota: ${notes}` : null,
  ]
    .filter(Boolean)
    .join(', ');

  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={a11yLabel}
        onPress={onPress}
        style={styles.card}
      >
        {content}
      </Pressable>
    );
  }

  return <View style={styles.card}>{content}</View>;
}

const styles = StyleSheet.create((theme) => ({
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.surface1,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    borderRadius: theme.radius.card,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  left: { flex: 1, paddingRight: theme.spacing.sm },
  tagWrap: { flexDirection: 'row', marginTop: theme.spacing.xs },
  equipment: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.xs,
  },
  notes: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.xs,
  },
  notesText: { flex: 1 },
  right: { alignItems: 'flex-end', gap: theme.spacing.xs },
  rest: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs },
}));
