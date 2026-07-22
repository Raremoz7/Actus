import { StyleSheet } from 'react-native-unistyles';

import { AppText, Card, KpiNumber } from '@/components/ui';

type Props = {
  value: number | string;
  label: string;
};

// Card de KPI: número mono grande (KpiNumber) + rótulo discreto.
export function KpiCard({ value, label }: Props) {
  return (
    <Card emphasis style={styles.cardExtra}>
      <KpiNumber value={value} size="big" tone="neon" />
      <AppText variant="metaSmall" color="secondary">
        {label}
      </AppText>
    </Card>
  );
}

const styles = StyleSheet.create((theme) => ({
  cardExtra: {
    flex: 1,
    gap: theme.spacing.xs,
  },
}));
