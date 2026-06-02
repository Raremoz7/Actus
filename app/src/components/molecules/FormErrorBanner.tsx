import { View } from 'react-native';
import { Warning } from 'phosphor-react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppText } from '@/components/ui';
import { darkTheme } from '@/theme';

type FormErrorBannerProps = {
  // Mensagem de erro form-level; null oculta o banner.
  message: string | null;
};

const { colors } = darkTheme;

// Banner sóbrio de erro form-level: borda error radius 4, sem animação.
// A presença do banner já é o feedback (decisão visual: nunca shake/alarme).
export function FormErrorBanner({ message }: FormErrorBannerProps) {
  if (!message) return null;

  return (
    <View
      style={styles.banner}
      accessibilityRole="alert"
      accessibilityLabel={message}
    >
      <Warning size={18} weight="duotone" color={colors.error} />
      <AppText variant="bodySm" color="onSurface" style={styles.text}>
        {message}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    alignSelf: 'stretch',
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.error,
    borderRadius: theme.radius.card,
  },
  text: {
    flex: 1,
  },
}));
