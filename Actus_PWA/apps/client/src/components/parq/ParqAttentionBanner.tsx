import { View } from 'react-native';
import { Warning } from 'phosphor-react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppText } from '@/components/ui';
import { darkTheme } from '@/theme';

const { colors } = darkTheme;

// Aviso brando (NÃO bloqueia): o aluno marcou atenção no Par-Q. Decisão é do profissional.
export function ParqAttentionBanner() {
  return (
    <View style={styles.banner} accessibilityRole="alert">
      <Warning size={18} weight="duotone" color={colors.warning} />
      <AppText variant="bodySm" color="secondary" style={styles.text}>
        Este aluno marcou atenção no Par-Q. Avaliação médica recomendada antes de iniciar.
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.surface1,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.warning,
    borderRadius: theme.radius.card,
    padding: theme.spacing.md,
  },
  text: { flex: 1 },
}));
