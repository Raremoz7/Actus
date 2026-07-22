import type { ReactNode } from 'react';
import type { ImageSourcePropType } from 'react-native';
import { Image, Pressable, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { StyleSheet } from 'react-native-unistyles';
import { darkTheme } from '@/theme';

interface HeroCarouselProps {
  images: ImageSourcePropType[];
  height: number;
  onTap?: (index: number) => void;
  children?: ReactNode;
}

const { colors, spacing, radius } = darkTheme;

export function HeroCarousel({ images, height, onTap, children }: HeroCarouselProps) {
  const { width } = useWindowDimensions();
  const hasTwo = images.length >= 2;

  const translateX = useSharedValue(0);
  const page = useSharedValue(0);

  const panGesture = Gesture.Pan()
    .activeOffsetX([-12, 12])
    .failOffsetY([-8, 8])
    .onUpdate((e) => {
      if (!hasTwo) return;
      // Clampa nas bordas: sem arrastar além da 1ª/última imagem (elimina o bounce/
      // overscroll de "borracha" ao puxar contra o limite). (TEC-87)
      const raw = -page.value * width + e.translationX;
      const min = -(Math.max(images.length, 1) - 1) * width;
      translateX.value = Math.max(min, Math.min(0, raw));
    })
    .onEnd((e) => {
      if (!hasTwo) return;
      const shouldAdvance =
        Math.abs(e.translationX) > width * 0.3 || Math.abs(e.velocityX) > 400;
      const dir = e.translationX < 0 ? 1 : -1;
      const target = shouldAdvance
        ? Math.max(0, Math.min(1, page.value + dir))
        : page.value;
      page.value = target;
      translateX.value = withSpring(-target * width, { damping: 22, stiffness: 200 });
    });

  const rowStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const dot0Style = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [-width, 0], [0.35, 1], 'clamp'),
  }));
  const dot1Style = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [-width, 0], [1, 0.35], 'clamp'),
  }));

  function handlePress() {
    onTap?.(page.value);
  }

  return (
    <GestureDetector gesture={panGesture}>
      <Pressable
        style={{ height, overflow: 'hidden' }}
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityLabel="Ampliar imagem"
      >
        <Animated.View
          style={[
            {
              flexDirection: 'row',
              width: width * Math.max(images.length, 1),
              height,
            },
            rowStyle,
          ]}
        >
          {images.map((src, i) => (
            <Image
              key={i}
              accessible={false}
              source={src}
              resizeMode="cover"
              style={{ width, height }}
            />
          ))}
        </Animated.View>

        {children}

        {hasTwo && (
          <View style={styles.dots}>
            <Animated.View style={[styles.dot, dot0Style]} />
            <Animated.View style={[styles.dot, dot1Style]} />
          </View>
        )}
      </Pressable>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  dots: {
    position: 'absolute',
    bottom: spacing.lg,
    right: spacing.lg,
    flexDirection: 'row',
    gap: 5,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.neon,
  },
});
