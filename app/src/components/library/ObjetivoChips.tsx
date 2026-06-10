import { Pressable, ScrollView } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppText } from '@/components/ui';
import { OBJETIVOS, OBJETIVO_LABEL, type Objetivo } from '@/types/workoutLibrary';

type Props = {
  // null = "Todos" (sem filtro).
  selected: Objetivo | null;
  onChange: (o: Objetivo | null) => void;
};

// Linha horizontal de chips de objetivo. "Todos" no início limpa o filtro.
export function ObjetivoChips({ selected, onChange }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      <Chip label="Todos" active={selected === null} onPress={() => onChange(null)} />
      {OBJETIVOS.map((o) => (
        <Chip
          key={o}
          label={OBJETIVO_LABEL[o]}
          active={selected === o}
          onPress={() => onChange(o)}
        />
      ))}
    </ScrollView>
  );
}

function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  styles.useVariants({ active });
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={styles.chip}
    >
      <AppText variant="label" color={active ? 'inverse' : 'secondary'}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create((theme) => ({
  row: { gap: theme.spacing.sm, paddingVertical: theme.spacing.sm },
  chip: {
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    variants: {
      active: {
        true: { backgroundColor: theme.colors.neon, borderColor: theme.colors.neon },
        false: { backgroundColor: theme.colors.surface2, borderColor: theme.colors.surface2 },
      },
    },
  },
}));
