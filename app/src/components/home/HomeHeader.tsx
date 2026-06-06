import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppText } from '@/components/ui';
import type { Greeting } from '@/lib/greeting';

type Props = {
  greeting: Greeting;
  name: string | null;
  dateLabel: string;
  // Frase de estado do dia (heroína do header): "Treino de pernas hoje",
  // "Você está em dia", "Descanso programado". Promovida a H2.
  headline: string;
};

export function HomeHeader({ greeting, name, dateLabel, headline }: Props) {
  // Saudação recua a eyebrow secundária — o estado do dia é o que importa.
  const eyebrow = name ? `${greeting}, ${name}` : greeting;
  return (
    <View style={styles.root}>
      <AppText variant="eyebrow" color="tertiary">
        {dateLabel}
      </AppText>
      <AppText variant="metaSmall" color="secondary" style={styles.greet} numberOfLines={1}>
        {eyebrow}
      </AppText>
      <AppText variant="h2" style={styles.headline} numberOfLines={2}>
        {headline}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  root: {
    marginBottom: theme.spacing.xl,
  },
  greet: {
    marginTop: theme.spacing.xs,
  },
  headline: {
    marginTop: theme.spacing.sm,
  },
}));
