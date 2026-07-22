import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppText, type AppTextColor } from './Text';

export type TagTone = 'neutral' | 'active' | 'success' | 'warning';

type TagProps = {
  label: string;
  tone?: TagTone;
};

// Cor do texto por tom: neutral sobre surface escura; active/success/warning sobre fundo claro.
const TONE_TEXT: Record<TagTone, AppTextColor> = {
  neutral: 'secondary',
  active: 'inverse',
  success: 'inverse',
  warning: 'inverse',
};

export function Tag({ label, tone = 'neutral' }: TagProps) {
  styles.useVariants({ tone });

  return (
    <View style={styles.container}>
      <AppText variant="eyebrow" color={TONE_TEXT[tone]} numberOfLines={1}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    alignSelf: 'flex-start',
    borderRadius: theme.radius.tag,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    variants: {
      tone: {
        neutral: { backgroundColor: theme.colors.surface2 },
        active: { backgroundColor: theme.colors.neon },
        success: { backgroundColor: theme.colors.success },
        warning: { backgroundColor: theme.colors.warning },
      },
    },
  },
}));
