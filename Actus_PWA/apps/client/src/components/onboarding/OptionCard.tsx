// Card selecionável (uma escolha por tela — história de baixa fricção).
import { Pressable } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppText } from '@/components/ui';

type Props = {
  label: string;
  selected: boolean;
  onPress: () => void;
};

export function OptionCard({ label, selected, onPress }: Props) {
  styles.useVariants({ selected });
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={styles.card}
    >
      <AppText variant="bodyLg" color={selected ? 'inverse' : 'primary'}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create((theme) => ({
  card: {
    borderRadius: theme.radius.card,
    borderWidth: 1,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    variants: {
      selected: {
        true: { backgroundColor: theme.colors.neon, borderColor: theme.colors.neon },
        false: {
          backgroundColor: theme.colors.surface1,
          borderColor: theme.colors.outlineVariant,
        },
      },
    },
  },
}));
