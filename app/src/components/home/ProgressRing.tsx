import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { StyleSheet } from 'react-native-unistyles';

import { darkTheme } from '@/theme';

const { colors } = darkTheme;

type Props = {
  // 0..1. Fração do anel preenchida.
  progress: number;
  size?: number;
  strokeWidth?: number;
  // Conteúdo central (ex.: número grande mono); fica sobreposto ao anel.
  children?: React.ReactNode;
};

// Anel de progresso fino — usado no card de desafio (dia X de Y).
// Sem animação aqui: o único momento de motion da Home é o reveal da tela.
export function ProgressRing({ progress, size = 56, strokeWidth = 4, children }: Props) {
  const clamped = Math.min(Math.max(progress, 0), 1);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - clamped);
  const center = size / 2;

  return (
    <View style={[styles.root, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={colors.surface3}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={colors.neon}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          // Começa o preenchimento no topo (12h) em vez de 3h.
          transform={`rotate(-90 ${center} ${center})`}
        />
      </Svg>
      {children ? <View style={styles.center}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create(() => ({
  root: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
}));
