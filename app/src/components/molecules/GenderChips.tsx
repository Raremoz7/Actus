import { Pressable, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppText } from '@/components/ui';
import type { Gender } from '@/types/auth';

type GenderChipsProps = {
  // Valor selecionado (ou indefinido quando nada escolhido).
  value: Gender | undefined;
  onChange: (value: Gender) => void;
  // Label eyebrow mono opcional acima dos chips.
  label?: string;
};

// Ordem visual das opções; cada uma mapeia para o valor do backend (Gender).
const OPTIONS: readonly { label: string; value: Gender }[] = [
  { label: 'Feminino', value: 'feminino' },
  { label: 'Masculino', value: 'masculino' },
  { label: 'Outro', value: 'outro' },
  { label: 'Prefiro não dizer', value: 'nao_informar' },
];

export function GenderChips({ value, onChange, label }: GenderChipsProps) {
  return (
    <View style={styles.wrapper}>
      {label ? (
        <AppText variant="eyebrow" color="tertiary" style={styles.label}>
          {label}
        </AppText>
      ) : null}

      <View
        style={styles.row}
        accessibilityRole="radiogroup"
        accessibilityLabel={label ?? 'Gênero'}
      >
        {OPTIONS.map((option) => {
          const selected = value === option.value;
          styles.useVariants({ selected });

          return (
            <Pressable
              key={option.value}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={option.label}
              hitSlop={6}
              onPress={() => onChange(option.value)}
              style={styles.chip}
            >
              <AppText
                variant="bodySm"
                color={selected ? 'inverse' : 'secondary'}
              >
                {option.label}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  wrapper: {
    alignSelf: 'stretch',
    gap: theme.spacing.sm,
  },
  label: {
    marginBottom: theme.spacing.xs,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  chip: {
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    variants: {
      selected: {
        true: {
          backgroundColor: theme.colors.neon,
          borderColor: theme.colors.neon,
        },
        false: {
          backgroundColor: 'transparent',
          borderColor: theme.colors.outlineVariant,
        },
      },
    },
  },
}));
