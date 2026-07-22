import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppText } from '@/components/ui';

type Props = {
  icon: ReactNode;
  label: string;
  onPress: () => void;
};

// Ação rápida do dashboard: card com ícone (duotone) + rótulo.
export function QuickAction({ icon, label, onPress }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={styles.action}
    >
      <View style={styles.icon}>{icon}</View>
      <AppText variant="label" color="inverse" numberOfLines={2} style={styles.label}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create((theme) => ({
  action: {
    flex: 1,
    alignItems: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.neon,
    borderRadius: theme.radius.card,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
  },
  label: { textAlign: 'center' },
  icon: {
    width: 44,
    height: 44,
    borderRadius: theme.radius.pill,
    // Véu escuro discreto sobre o verde para dar profundidade ao ícone.
    backgroundColor: 'rgba(20, 20, 20, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
}));
