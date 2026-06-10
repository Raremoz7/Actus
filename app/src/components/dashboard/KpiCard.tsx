import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppText, KpiNumber } from '@/components/ui';

type Props = {
  value: number | string;
  label: string;
};

// Card de KPI: número mono grande (KpiNumber) + rótulo discreto.
export function KpiCard({ value, label }: Props) {
  return (
    <View style={styles.card}>
      <KpiNumber value={value} size="big" />
      <AppText variant="metaSmall" color="tertiary">
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  card: {
    flex: 1,
    backgroundColor: theme.colors.surface1,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    borderRadius: theme.radius.card,
    padding: theme.spacing.md,
    gap: theme.spacing.xs,
  },
}));
