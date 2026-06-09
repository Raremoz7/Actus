import { Pressable, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppText } from '@/components/ui';

type Props = {
  text: string;
  // null = ainda não respondida.
  value: boolean | null;
  onChange: (value: boolean) => void;
};

// Linha do questionário: texto da pergunta + par de toggles pill Sim/Não.
export function ParqQuestionRow({ text, value, onChange }: Props) {
  return (
    <View style={styles.row}>
      <AppText variant="bodyMd" style={styles.question}>
        {text}
      </AppText>
      <View style={styles.toggle}>
        <Pill label="Sim" selected={value === true} onPress={() => onChange(true)} />
        <Pill label="Não" selected={value === false} onPress={() => onChange(false)} />
      </View>
    </View>
  );
}

function Pill({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  styles.useVariants({ selected });
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={styles.pill}
    >
      <AppText variant="label" color={selected ? 'inverse' : 'secondary'}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create((theme) => ({
  row: {
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outlineVariant,
    gap: theme.spacing.sm,
  },
  question: { color: theme.colors.textPrimary },
  toggle: { flexDirection: 'row', gap: theme.spacing.sm },
  pill: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    variants: {
      selected: {
        true: { backgroundColor: theme.colors.neon, borderColor: theme.colors.neon },
        false: { backgroundColor: 'transparent', borderColor: theme.colors.surface4 },
      },
    },
  },
}));
