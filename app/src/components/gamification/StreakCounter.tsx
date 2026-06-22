import { View } from 'react-native';
import { Flame } from 'phosphor-react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppText } from '@/components/ui';
import { darkTheme } from '@/theme';

const { colors } = darkTheme;

type Props = {
  // Sequência atual de dias (streak_current do weekly-overview).
  streak: number;
  // true quando a sequência foi quebrada — troca o rótulo por um recomeço.
  isBroken: boolean;
};

// Contador de sequência da Home do aluno: chama + número grande + rótulo.
// Quando há sequência viva, a chama acende na cor de fogo (token `flame`,
// EXCEÇÃO consciente ao neon — ver tokens.ts); quando quebrada/zerada, a
// chama esfria para um tom secundário e o rótulo vira convite ao recomeço.
// (A animação de pulso/fumaça fica para uma task futura — aqui é só exibir.)
export function StreakCounter({ streak, isBroken }: Props) {
  const alive = streak > 0;

  return (
    <View style={styles.container}>
      <Flame
        testID="streak-flame"
        size={36}
        weight="duotone"
        color={alive ? colors.flame : colors.textTertiary}
      />
      <View style={styles.body}>
        <AppText variant="dataBig" color={alive ? 'primary' : 'tertiary'}>
          {String(streak)}
        </AppText>
        <AppText variant="metaSmall" color="secondary">
          {isBroken ? 'Comece de novo, você consegue!' : 'dias seguidos'}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  body: { alignItems: 'flex-start' },
}));
