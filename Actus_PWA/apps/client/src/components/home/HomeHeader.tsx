import { StyleSheet } from 'react-native-unistyles';

import { AppText, TopBar } from '@/components/ui';
import type { Greeting } from '@/lib/greeting';

type Props = {
  greeting: Greeting;
  name: string | null;
  dateLabel: string;
};

// Top bar fixa da Home: data (eyebrow) + saudação. O estado do dia NÃO vive mais aqui —
// o card de treino logo abaixo já é a heroína, então o antigo headline era redundante.
export function HomeHeader({ greeting, name, dateLabel }: Props) {
  const greet = name ? `${greeting}, ${name}` : greeting;
  return (
    <TopBar>
      <AppText variant="eyebrow" color="tertiary">
        {dateLabel}
      </AppText>
      <AppText variant="bodyLg" color="primary" style={styles.greet} numberOfLines={1}>
        {greet}
      </AppText>
    </TopBar>
  );
}

const styles = StyleSheet.create((theme) => ({
  greet: {
    marginTop: theme.spacing.xs,
  },
}));
