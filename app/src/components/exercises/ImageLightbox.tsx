import { useEffect } from 'react';
import type { ImageSourcePropType } from 'react-native';
import { Image, Modal, Pressable, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { StyleSheet } from 'react-native-unistyles';
import { X } from 'phosphor-react-native';
import { darkTheme } from '@/theme';

interface ImageLightboxProps {
  images: ImageSourcePropType[];
  initialIndex: number;
  visible: boolean;
  onClose: () => void;
}

const { colors, spacing, radius } = darkTheme;

export function ImageLightbox({ images, initialIndex, visible, onClose }: ImageLightboxProps) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const translateX = useSharedValue(-initialIndex * width);
  const page = useSharedValue(initialIndex);

  useEffect(() => {
    if (visible) {
      page.value = initialIndex;
      translateX.value = -initialIndex * width;
    }
  }, [visible, initialIndex, width]);

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      translateX.value = -page.value * width + e.translationX;
    })
    .onEnd((e) => {
      if (e.velocityY > 600 && Math.abs(e.velocityY) > Math.abs(e.velocityX)) {
        runOnJS(onClose)();
        return;
      }
      const shouldAdvance =
        images.length > 1 &&
        (Math.abs(e.translationX) > width * 0.3 || Math.abs(e.velocityX) > 400);
      const dir = e.translationX < 0 ? 1 : -1;
      const target = shouldAdvance
        ? Math.max(0, Math.min(images.length - 1, page.value + dir))
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

  const imgHeight = Math.min(width, height * 0.75);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Pressable
        style={styles.backdrop}
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Fechar"
      >
        <GestureDetector gesture={panGesture}>
          <Pressable
            style={{ justifyContent: 'center', overflow: 'hidden', width }}
            onPress={() => {
              // absorve o tap para não fechar o backdrop
            }}
          >
            <Animated.View
              style={[{ flexDirection: 'row', width: width * images.length }, rowStyle]}
            >
              {images.map((src, i) => (
                <Image
                  key={i}
                  accessible={false}
                  source={src}
                  resizeMode="contain"
                  style={{ width, height: imgHeight }}
                />
              ))}
            </Animated.View>
          </Pressable>
        </GestureDetector>

        {images.length >= 2 && (
          <View style={styles.dots}>
            <Animated.View style={[styles.dot, dot0Style]} />
            <Animated.View style={[styles.dot, dot1Style]} />
          </View>
        )}
      </Pressable>

      <Pressable
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Fechar"
        hitSlop={12}
        style={[styles.closeBtn, { top: insets.top + spacing.md, right: spacing.lg }]}
      >
        <X size={22} weight="bold" color={colors.textPrimary} />
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtn: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dots: {
    flexDirection: 'row',
    gap: 5,
    marginTop: spacing.lg,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.neon,
  },
});
