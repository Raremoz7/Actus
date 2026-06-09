import { Redirect, Stack } from 'expo-router';

import { useAuthStore } from '@/store/authStore';
import { DEV_BYPASS_AUTH } from '@/lib/devAuth';
import { AUTH_ENTRY, homeForTipo } from '@/lib/authRoutes';

// Guard de papel: só nutricionista autenticado entra. Redirecionos vão a destinos
// INEQUÍVOCOS (nunca '/', que é ambíguo e causa loop de redirect — ver authRoutes).
export default function NutriLayout() {
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);

  // [DEV — bypass de auth] Com a flag ligada, qualquer um navega esta área.
  if (!DEV_BYPASS_AUTH) {
    if (status !== 'authenticated' || !user) {
      return <Redirect href={AUTH_ENTRY} />;
    }
    if (user.tipo !== 'nutricionista') {
      return <Redirect href={homeForTipo(user.tipo)} />;
    }
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
