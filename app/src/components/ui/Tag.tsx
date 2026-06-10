import { Text, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

export type TagTone = 'neutral' | 'active' | 'success';

type TagProps = {
  label: string;
  tone?: TagTone;
};

export function Tag({ label, tone = 'neutral' }: TagProps) {
  styles.useVariants({ tone });

  return (
    <View style={styles.container}>
      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
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
      },
    },
  },
  label: {
    fontFamily: theme.fontFamily.mono,
    fontSize: 10,
    lineHeight: 12,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    variants: {
      tone: {
        neutral: { color: theme.colors.textSecondary },
        // textInverse (#141414) é o token de texto sobre fundos claros (neon/success).
        active: { color: theme.colors.textInverse },
        success: { color: theme.colors.textInverse },
      },
    },
  },
}));
