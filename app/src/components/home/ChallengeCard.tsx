import { View } from 'react-native';
import { Trophy } from 'phosphor-react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppText, Card } from '@/components/ui';
import { darkTheme } from '@/theme';
import { ProgressRing } from './ProgressRing';

const { colors } = darkTheme;

type Props = {
  title: string;
  current: number;
  total: number;
  onPress: () => void;
  // Quando o card ocupa a largura total (sem dieta ao lado), expande o layout.
  wide?: boolean;
};

export function ChallengeCard({ title, current, total, onPress, wide = false }: Props) {
  const progress = total > 0 ? current / total : 0;
  const pct = Math.round(Math.min(Math.max(progress, 0), 1) * 100);

  return (
    <Card
      onPress={onPress}
      padding={wide ? 'lg' : 'md'}
      style={styles.cardFlex}
      accessibilityLabel={`Desafio ${title}, dia ${current} de ${total}`}
    >
      <View style={styles.head}>
        <Trophy size={14} weight="duotone" color={colors.textTertiary} />
        <AppText variant="eyebrow" color="tertiary">
          Desafio
        </AppText>
      </View>
      <View style={[styles.body, wide && styles.bodyWide]}>
        <View style={styles.text}>
          <AppText variant="h3" style={styles.name} numberOfLines={wide ? 1 : 2}>
            {title}
          </AppText>
          <AppText variant="metaSmall" color="tertiary">
            {`Dia ${current} de ${total}`}
          </AppText>
        </View>
        <ProgressRing progress={progress} size={wide ? 64 : 52} strokeWidth={4}>
          <AppText variant="metaSmall" color="neon">
            {`${pct}%`}
          </AppText>
        </ProgressRing>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create((theme) => ({
  cardFlex: {
    flex: 1,
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs },
  body: {
    marginTop: theme.spacing.sm,
    gap: theme.spacing.md,
  },
  bodyWide: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  text: {
    flex: 1,
  },
  name: { marginBottom: 2 },
}));
