import { Pressable, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppText } from '@/components/ui';

export type WorkoutScope = 'meus' | 'banco';

type Props = {
  value: WorkoutScope;
  onChange: (v: WorkoutScope) => void;
};

// Segmented control "Meus | Banco" no topo da aba Treinos.
export function WorkoutScopeToggle({ value, onChange }: Props) {
  return (
    <View style={styles.track}>
      <Seg label="Meus" active={value === 'meus'} onPress={() => onChange('meus')} />
      <Seg label="Banco" active={value === 'banco'} onPress={() => onChange('banco')} />
    </View>
  );
}

function Seg({
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
      style={styles.seg}
    >
      <AppText variant="label" color={active ? 'inverse' : 'secondary'}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create((theme) => ({
  track: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface1,
    borderRadius: theme.radius.pill,
    padding: 4,
    gap: 4,
  },
  seg: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.pill,
    variants: {
      active: {
        true: { backgroundColor: theme.colors.neon },
        false: { backgroundColor: 'transparent' },
      },
    },
  },
}));
