import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { StyleSheet } from 'react-native-unistyles';

import { darkTheme } from '@/theme';

type WizardProgressProps = {
  // Total de passos do wizard.
  total: number;
  // Passo atual (1-based).
  current: number;
};

const { motion } = darkTheme;

// Um traço do progresso. Passos já feitos ficam neon; o atual preenche com
// withTiming (única animação do componente); pendentes ficam surface2.
function Segment({ index, current }: { index: number; current: number }) {
  // 0 = vazio (surface2), 1 = preenchido (neon).
  const fill = useSharedValue(index < current ? 1 : 0);

  useEffect(() => {
    fill.value = withTiming(index < current ? 1 : 0, {
      duration: motion.screenMs,
    });
  }, [index, current, fill]);

  const fillStyle = useAnimatedStyle(() => ({
    opacity: fill.value,
  }));

  return (
    <View style={styles.track}>
      <Animated.View style={[styles.fill, fillStyle]} />
    </View>
  );
}

export function WizardProgress({ total, current }: WizardProgressProps) {
  // index 0-based de cada traço; comparamos com current (1-based) via index < current.
  const segments = Array.from({ length: total }, (_, i) => i);

  return (
    <View
      style={styles.row}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 1, max: total, now: current }}
      accessibilityLabel={`Passo ${current} de ${total}`}
    >
      {segments.map((i) => (
        <Segment key={i} index={i} current={current} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  row: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    gap: theme.spacing.sm,
  },
  track: {
    flex: 1,
    height: 3,
    borderRadius: theme.radius.tag,
    backgroundColor: theme.colors.surface2,
    overflow: 'hidden',
  },
  fill: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: theme.radius.tag,
    backgroundColor: theme.colors.neon,
  },
}));
