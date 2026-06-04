import { View } from 'react-native';
import { Flame } from 'phosphor-react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppText } from '@/components/ui';
import { darkTheme } from '@/theme';
import type { Greeting } from '@/lib/greeting';

const { colors } = darkTheme;

type Props = {
  greeting: Greeting;
  name: string | null;
  streakCurrent: number;
  dateLabel: string;
};

export function HomeHeader({ greeting, name, streakCurrent, dateLabel }: Props) {
  const title = name ? `${greeting}, ${name}` : greeting;
  return (
    <View>
      <View style={styles.topRow}>
        <AppText variant="eyebrow" color="tertiary">
          {dateLabel}
        </AppText>
        <View style={styles.streakChip}>
          <Flame size={15} weight="duotone" color={colors.neon} />
          <AppText variant="metaSmall" color="secondary">
            {String(streakCurrent)}
          </AppText>
        </View>
      </View>
      <AppText variant="h2" style={styles.greet} numberOfLines={1}>
        {title}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  streakChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    borderRadius: theme.radius.pill,
    paddingVertical: 4,
    paddingHorizontal: theme.spacing.md,
  },
  greet: {
    marginBottom: theme.spacing.lg,
  },
}));
