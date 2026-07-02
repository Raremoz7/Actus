import { useEffect } from 'react';
import { Redirect, Stack } from 'expo-router';

import { useAuthStore } from '@/store/authStore';
import { useOnboardingStore } from '@/store/onboardingStore';
import { DEV_BYPASS_AUTH } from '@/lib/devAuth';
import { AUTH_ENTRY, homeForTipo } from '@/lib/authRoutes';
import { authedDestination } from '@/lib/onboardingRoutes';

// Stack de autenticação: headerless, slide horizontal. Usuário já autenticado é mandado
// direto ao destino do seu tipo. Esse destino passa pelo MESMO gate de onboarding do
// dispatcher (app/index) — assim o onboarding abre já no 1º login, e não só no boot
// seguinte (o layout não pula mais o gate indo direto à home). (TEC-72)
export default function AuthLayout() {
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);
  const obHydrated = useOnboardingStore((s) => s.hydrated);
  const obHydrate = useOnboardingStore((s) => s.hydrate);
  const isOnboardingDone = useOnboardingStore((s) => s.isDone);

  // [DEV — bypass de auth] Com a flag ligada, as telas de auth ficam navegáveis.
  // Só redireciona quem tem home real (staff/desconhecido → AUTH_ENTRY entraria em
  // loop de redirect / tela branca).
  const shouldRedirect =
    !DEV_BYPASS_AUTH &&
    status === 'authenticated' &&
    !!user &&
    homeForTipo(user.tipo) !== AUTH_ENTRY;

  // Hidrata o store local de onboarding antes de decidir o destino (isDone confiável).
  useEffect(() => {
    if (shouldRedirect && !obHydrated) void obHydrate();
  }, [shouldRedirect, obHydrated, obHydrate]);

  if (shouldRedirect) {
    // Aguarda o hydrate — decidir com isDone=false mandaria quem já concluiu o
    // onboarding de volta a ele.
    if (!obHydrated) return null;
    if (user) {
      return <Redirect href={authedDestination(user, isOnboardingDone)} />;
    }
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        animationDuration: 300,
      }}
    />
  );
}
