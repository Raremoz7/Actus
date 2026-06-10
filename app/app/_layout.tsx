// IMPORTANTE: efeito colateral que configura o tema do unistyles — DEVE ser o 1º import.
import '@/theme/unistyles';

import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClientProvider } from '@tanstack/react-query';
import { Stack, router } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';

import { apiEvents } from '@/api/client';
import { queryClient } from '@/lib/queryClient';
import { initSentry, Sentry } from '@/observability/sentry';
import { useAppFonts } from '@/theme/fonts';
import { useAuthStore } from '@/store/authStore';

// Sentry inicializado no módulo (antes de qualquer render).
initSentry();

// Segura o splash nativo até fontes + hydrate prontos.
void SplashScreen.preventAutoHideAsync();

// bgLowest do design — exceção legítima a hex hardcoded (contentStyle nativo do Stack).
const STACK_BG = '#10252D';

function RootLayout() {
  const fontsLoaded = useAppFonts();
  const hydrate = useAuthStore((s) => s.hydrate);
  const status = useAuthStore((s) => s.status);

  // Hydrate uma única vez no boot.
  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  // Registra os handlers de auth do interceptor. IDEMPOTENTES:
  // só agem quando o estado realmente precisa mudar.
  useEffect(() => {
    apiEvents.onLogout = () => {
      const current = useAuthStore.getState().status;
      if (current !== 'unauthenticated') {
        // Logout LOCAL: o interceptor já limpou os tokens; aqui só zeramos o estado (sem POST).
        useAuthStore.setState({ status: 'unauthenticated', user: null });
        router.replace('/');
      }
    };

    apiEvents.onMustChangePassword = () => {
      const current = useAuthStore.getState().status;
      if (current !== 'must_change_password') {
        useAuthStore.setState({ status: 'must_change_password', user: null });
        router.replace('/(auth)/trocar-senha');
      }
    };

    return () => {
      // Restaura no-ops ao desmontar (evita chamar router de uma árvore morta).
      apiEvents.onLogout = () => {};
      apiEvents.onMustChangePassword = () => {};
    };
  }, []);

  // Esconde o splash assim que fontes carregaram e o hydrate saiu de 'hydrating'.
  useEffect(() => {
    if (fontsLoaded && status !== 'hydrating') {
      void SplashScreen.hideAsync();
    }
  }, [fontsLoaded, status]);

  // Mantém o splash nativo enquanto as fontes não estão prontas.
  if (!fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: STACK_BG },
          }}
        />
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

export default Sentry.wrap(RootLayout);
