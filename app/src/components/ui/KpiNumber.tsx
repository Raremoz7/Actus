import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppText } from './Text';

type KpiNumberProps = {
  value: string | number;
  size?: 'big' | 'medium';
  unit?: string;
  tone?: 'neon' | 'primary';
};

export function KpiNumber({
  value,
  size = 'big',
  unit,
  tone = 'neon',
}: KpiNumberProps) {
  // dataBig (36) / dataMed (18) já são mono no AppText.
  const variant = size === 'big' ? 'dataBig' : 'dataMed';

  return (
    <View style={styles.row}>
      <AppText variant={variant} color={tone}>
        {value}
      </AppText>
      {unit ? (
        <AppText variant="metaSmall" color="tertiary" style={styles.unit}>
          {unit}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  row: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: theme.spacing.xs,
  },
  unit: {
    marginBottom: 2,
  },
}));
