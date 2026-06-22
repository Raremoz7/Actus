import { Redirect, Stack } from 'expo-router';

import { useAuthStore } from '@/store/authStore';
import { DEV_BYPASS_AUTH } from '@/lib/devAuth';
import { AUTH_ENTRY, homeForTipo } from '@/lib/authRoutes';
import { UnseenBadgeWatcher } from '@/components/gamification/UnseenBadgeWatcher';
import { useRegisterPushToken } from '@/hooks/useRegisterPushToken';

// Guard de papel: só aluno autenticado entra. Redirecionos vão a destinos INEQUÍVOCOS
// (nunca '/', que é ambíguo e causa loop de redirect — ver authRoutes).
export default function AlunoLayout() {
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);

  // Registra o push token ao autenticar e trata o tap da notificação de conquista.
  // Chamado antes de qualquer early-return para manter a ordem dos hooks estável.
  useRegisterPushToken();

  // [DEV — bypass de auth] Com a flag ligada, qualquer um navega esta área.
  if (!DEV_BYPASS_AUTH) {
    if (status !== 'authenticated' || !user) {
      return <Redirect href={AUTH_ENTRY} />;
    }
    if (user.tipo !== 'aluno') {
      return <Redirect href={homeForTipo(user.tipo)} />;
    }
  }

  // O watcher fica AO LADO do Stack para flutuar sobre as tabs (banner absoluto)
  // e, ao tocar, abrir a fila de conquista (Modal) por cima de qualquer rota.
  return (
    <>
      <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right', animationDuration: 300 }} />
      <UnseenBadgeWatcher />
    </>
  );
}
