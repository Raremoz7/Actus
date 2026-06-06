import { router, type Href } from 'expo-router';

// Volta na pilha se houver histórico; senão cai num destino de fallback (ou no-op).
// Evita o warning de dev "The action 'GO_BACK' was not handled by any navigator"
// quando a tela é a entrada (deep link / dev bypass) e não há tela atrás.
export function goBackOr(fallback?: string) {
  if (router.canGoBack()) {
    router.back();
  } else if (fallback) {
    router.replace(fallback as Href);
  }
}
