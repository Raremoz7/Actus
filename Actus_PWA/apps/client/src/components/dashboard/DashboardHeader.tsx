import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppText } from '@/components/ui';

type Props = {
  greeting: string;
  name: string | null;
};

// Cabeçalho do dashboard: saudação pela hora + nome do profissional.
export function DashboardHeader({ greeting, name }: Props) {
  const title = name && name.trim().length > 0 ? `${greeting}, ${name}` : greeting;
  return (
    <View style={styles.wrap}>
      <AppText variant="eyebrow" color="tertiary">
        Painel
      </AppText>
      <AppText variant="h2">{title}</AppText>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  wrap: { gap: theme.spacing.xs, marginBottom: theme.spacing.lg },
}));
