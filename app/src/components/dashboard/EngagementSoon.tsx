import { View } from 'react-native';
import { ChartLineUp } from 'phosphor-react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppText } from '@/components/ui';
import { darkTheme } from '@/theme';

const { colors } = darkTheme;

// Bloco discreto sinalizando engajamento agregado (pendente de GET /professional/overview).
export function EngagementSoon() {
  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <ChartLineUp size={14} weight="duotone" color={colors.textTertiary} />
        <AppText variant="eyebrow" color="tertiary">
          Engajamento
        </AppText>
      </View>
      <AppText variant="bodySm" color="secondary">
        Em breve: adesão e check-ins dos seus alunos num só lugar.
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  card: {
    backgroundColor: theme.colors.surface1,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    borderRadius: theme.radius.card,
    padding: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs },
}));
