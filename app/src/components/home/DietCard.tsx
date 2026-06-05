import { Pressable, View } from 'react-native';
import { ForkKnife } from 'phosphor-react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppText } from '@/components/ui';
import { darkTheme } from '@/theme';

const { colors } = darkTheme;

type Props = { title: string; nextMealTime: string; onPress: () => void };

export function DietCard({ title, nextMealTime, onPress }: Props) {
  return (
    <Pressable style={styles.card} onPress={onPress} accessibilityRole="button">
      <View style={styles.head}>
        <ForkKnife size={14} weight="duotone" color={colors.textTertiary} />
        <AppText variant="eyebrow" color="tertiary">
          Dieta
        </AppText>
      </View>
      <AppText variant="h3" style={styles.name}>
        {title}
      </AppText>
      <AppText variant="metaSmall" color="tertiary">
        {`Almoço · ${nextMealTime}`}
      </AppText>
    </Pressable>
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
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs },
  name: { marginTop: theme.spacing.xs, marginBottom: 2 },
}));
