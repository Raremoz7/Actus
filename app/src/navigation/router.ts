// Shim com a MESMA API do expo-router (router.push/replace/back, useRouter,
// useLocalSearchParams, Redirect, Href) implementada sobre o React Navigation.
// Objetivo: os 60+ arquivos que navegavam por href continuam funcionando
// trocando apenas o import de 'expo-router' para '@/navigation'.
import { useEffect } from 'react';
import {
  createNavigationContainerRef,
  StackActions,
  useRoute,
} from '@react-navigation/native';

import { resolveHref, toNavigateArgs, type ResolvedRoute } from './routes';

// Href do expo-router: path em string (com ou sem grupos) ou objeto {pathname, params}.
export type Href = string | { pathname: string; params?: Record<string, unknown> };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const navigationRef = createNavigationContainerRef<any>();

function resolveOrWarn(href: Href): ResolvedRoute | null {
  const resolved = resolveHref(href as Parameters<typeof resolveHref>[0]);
  if (!resolved && __DEV__) {
    console.warn(`[navigation] href sem rota correspondente: ${JSON.stringify(href)}`);
  }
  return resolved;
}

function currentRootRouteName(): string | undefined {
  if (!navigationRef.isReady()) return undefined;
  const state = navigationRef.getRootState();
  return state?.routes[state.index ?? 0]?.name;
}

export const router = {
  push(href: Href) {
    const resolved = resolveOrWarn(href);
    if (!resolved || !navigationRef.isReady()) return;
    const { name, params } = toNavigateArgs(resolved);

    // Push dentro da MESMA área/stack: empilha de verdade (navigate atualizaria a
    // tela existente em vez de criar outra instância — ex.: exercício → exercício).
    if (resolved.target.kind === 'area' && resolved.target.area === currentRootRouteName()) {
      navigationRef.dispatch(StackActions.push(resolved.target.screen, resolved.params));
      return;
    }
    if (resolved.target.kind === 'root' && resolved.target.name !== currentRootRouteName()) {
      navigationRef.dispatch(StackActions.push(name, params));
      return;
    }
    navigationRef.navigate(name, params);
  },

  replace(href: Href) {
    const resolved = resolveOrWarn(href);
    if (!resolved || !navigationRef.isReady()) return;
    const { name, params } = toNavigateArgs(resolved);

    // Replace dentro da mesma área (ex.: exercício → próximo exercício): troca a
    // tela do topo do stack focado, preservando o restante do histórico.
    if (resolved.target.kind === 'area' && resolved.target.area === currentRootRouteName()) {
      navigationRef.dispatch(StackActions.replace(resolved.target.screen, resolved.params));
      return;
    }

    // Troca de área (login→home, logout→auth, dispatcher da splash…): reseta o
    // histórico — semântica desejada nessas fronteiras (sem "voltar" para a área velha).
    navigationRef.reset({ index: 0, routes: [{ name, params }] });
  },

  back() {
    if (navigationRef.isReady() && navigationRef.canGoBack()) {
      navigationRef.goBack();
    }
  },

  canGoBack(): boolean {
    return navigationRef.isReady() && navigationRef.canGoBack();
  },
};

export function useRouter() {
  return router;
}

// Params da rota atual (dinâmicos + query + extras do push em objeto).
export function useLocalSearchParams<
  T extends Record<string, string | string[] | undefined> = Record<string, string | undefined>,
>(): T {
  const route = useRoute();
  return (route.params ?? {}) as T;
}

// Redireciona ao montar — substitui o <Redirect /> dos guards de layout.
export function Redirect({ href }: { href: Href }) {
  useEffect(() => {
    router.replace(href);
  }, [href]);
  return null;
}
