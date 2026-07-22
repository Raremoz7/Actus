// Raiz do app (ex-app/_layout.tsx do expo-router): providers, fontes, splash,
// handlers de auth do interceptor e o NavigationContainer com deep links.
// IMPORTANTE: efeito colateral que configura o tema do unistyles — DEVE ser o 1º import.
import '@/theme/unistyles';

import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';
import { QueryClientProvider } from '@tanstack/react-query';
import { NavigationContainer, DarkTheme, type LinkingOptions } from '@react-navigation/native';
import BootSplash from 'react-native-bootsplash';

import { apiEvents } from '@/api/client';
import { ToastHost } from '@/components/ui';
import { queryClient } from '@/lib/queryClient';
import { useAppFonts } from '@/theme/fonts';
import { useAuthStore } from '@/store/authStore';
import { router, navigationRef } from '@/navigation/router';
import { RootNavigator, STACK_BG } from '@/navigation/navigators';

// O splash nativo (react-native-bootsplash) fica visível até BootSplash.hide()
// — chamado quando fontes + hydrate estão prontos.

// Tema de navegação escuro: força o fundo do design no container das telas.
const navTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: STACK_BG,
    card: STACK_BG,
  },
};

// Deep links: actus://register?code=XXX (convite) e actus://usar-convite.
// Query string vira params automaticamente (React Navigation).
const linking: LinkingOptions<object> = {
  prefixes: ['actus://'],
  config: {
    screens: {
      Register: 'register',
      UsarConvite: 'usar-convite',
      NotFound: '*',
    },
  },
};

function Root() {
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
      void BootSplash.hide({ fade: true }).catch(() => {});
    }
  }, [fontsLoaded, status]);

  // Mantém o splash nativo enquanto as fontes não estão prontas.
  if (!fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: STACK_BG }}>
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        <QueryClientProvider client={queryClient}>
          <NavigationContainer ref={navigationRef} theme={navTheme} linking={linking}>
            <RootNavigator />
          </NavigationContainer>
          <ToastHost />
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default Root;
