import { useEffect } from 'react';
import type { ReactNode } from 'react';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { darkTheme } from '@/theme';

const { motion } = darkTheme;

export function AnimatedPage({ children }: { children: ReactNode }) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(12);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: motion.screenMs });
    translateY.value = withTiming(0, { duration: motion.screenMs });
  }, [opacity, translateY]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[{ flex: 1 }, style]}>
      {children}
    </Animated.View>
  );
}
