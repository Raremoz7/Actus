import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { router } from 'expo-router';
import { StyleSheet } from 'react-native-unistyles';

import { AppText, Logo } from '@/components/ui';
import { darkTheme } from '@/theme';
import { useAuthStore } from '@/store/authStore';
import { useOnboardingStore } from '@/store/onboardingStore';
import { AUTH_ENTRY, PASSWORD_GATE } from '@/lib/authRoutes';
import { authedDestination } from '@/lib/onboardingRoutes';

const { motion } = darkTheme;

export default function SplashScreenRoute() {
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);
  const obHydrated = useOnboardingStore((s) => s.hydrated);
  const obHydrate = useOnboardingStore((s) => s.hydrate);
  const isOnboardingDone = useOnboardingStore((s) => s.isDone);

  // ÚNICA animação da tela: reveal do símbolo (opacity 0→1 + scale 0.96→1).
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.96);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: motion.screenMs });
    scale.value = withTiming(1, { duration: motion.screenMs });
  }, [opacity, scale]);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  // Dispatch: assim que o hydrate decide o estado, roteia para o destino certo.
  useEffect(() => {
    if (status === 'hydrating') return;

    if (status === 'unauthenticated') {
      router.replace(AUTH_ENTRY);
      return;
    }
    if (status === 'must_change_password') {
      router.replace(PASSWORD_GATE);
      return;
    }
    if (status === 'authenticated' && user) {
      // Gate de onboarding: espera o store local hidratar antes de decidir.
      if (!obHydrated) {
        void obHydrate();
        return;
      }
      router.replace(authedDestination(user, isOnboardingDone));
    }
  }, [status, user, obHydrated, obHydrate, isOnboardingDone]);

  return (
    <View style={styles.container}>
      {/* Símbolo isolado, centrado — variação A do mockup. */}
      <Animated.View style={[styles.center, logoStyle]}>
        <Logo variant="symbol" color="neon" width={92} accessibilityLabel="Actus" />
      </Animated.View>

      {/* Wordmark discreto no rodapé. */}
      <Animated.View style={[styles.wordmark, logoStyle]}>
        <AppText variant="eyebrow" color="tertiary" style={styles.wordmarkText}>
          ACTUS
        </AppText>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.bgLowest,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wordmark: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingBottom: theme.spacing.xxl,
  },
  wordmarkText: {
    letterSpacing: 4,
    textAlign: 'center',
  },
}));
