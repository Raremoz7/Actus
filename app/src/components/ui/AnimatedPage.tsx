import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { Platform } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { darkTheme } from '@/theme';

const { motion } = darkTheme;
const isWeb = Platform.OS === 'web';

export function AnimatedPage({ children }: { children: ReactNode }) {
  const opacity = useSharedValue(isWeb ? 1 : 0);
  const translateY = useSharedValue(isWeb ? 0 : 12);

  useEffect(() => {
    if (isWeb) return;
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
