import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
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
//
// Motion (Task 16): o componente detecta a TRANSIÇÃO do valor entre renders
// (comparando com o último streak conhecido via ref):
//  - incremento (streak novo > anterior) → pulso de escala na chama;
//  - quebra (anterior > 0 e novo 0 / is_broken) → mensagem de "fumaça" que
//    aparece e some em ~2s.
// A detecção é puramente interna: a API pública (streak/isBroken) e os textos
// continuam idênticos, então os testes existentes seguem verdes.
export function StreakCounter({ streak, isBroken }: Props) {
  const alive = streak > 0;

  // Último valor conhecido entre renders (memória da sessão — suficiente p/ V1).
  const prevRef = useRef<number | null>(null);
  const scale = useSharedValue(1);
  const smoke = useSharedValue(0);
  const [showSmoke, setShowSmoke] = useState(false);

  useEffect(() => {
    const prev = prevRef.current;
    prevRef.current = streak;
    // Primeiro render: nada a comparar (apenas registra a linha de base).
    if (prev == null) return;

    // Incremento → pulso de escala (sobe rápido, assenta suave).
    if (streak > prev) {
      scale.value = withSequence(
        withTiming(1.25, { duration: 180 }),
        withTiming(1, { duration: 220 }),
      );
    }

    // Quebra (de viva para 0/quebrada) → fumaça: fade-in rápido, fade-out lento.
    if (prev > 0 && (streak === 0 || isBroken)) {
      setShowSmoke(true);
      smoke.value = withSequence(
        withTiming(1, { duration: 300 }),
        withTiming(0, { duration: 1500 }),
      );
      const t = setTimeout(() => setShowSmoke(false), 2000);
      return () => clearTimeout(t);
    }
  }, [streak, isBroken, scale, smoke]);

  const flameStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const smokeStyle = useAnimatedStyle(() => ({ opacity: smoke.value }));

  return (
    <View style={styles.container}>
      <Animated.View style={flameStyle}>
        <Flame
          testID="streak-flame"
          size={36}
          weight="duotone"
          color={alive ? colors.flame : colors.textTertiary}
        />
      </Animated.View>
      <View style={styles.body}>
        <AppText variant="dataBig" color={alive ? 'primary' : 'tertiary'}>
          {String(streak)}
        </AppText>
        <AppText variant="metaSmall" color="secondary">
          {isBroken ? 'Comece de novo, você consegue!' : 'dias seguidos'}
        </AppText>
      </View>

      {showSmoke ? (
        <Animated.View style={[styles.smoke, smokeStyle]} pointerEvents="none">
          <AppText variant="metaSmall" color="tertiary">
            A sequência esfriou…
          </AppText>
        </Animated.View>
      ) : null}
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
  // Mensagem de fumaça: flutua ao lado do contador sem deslocar o layout.
  smoke: {
    marginLeft: theme.spacing.sm,
  },
}));
