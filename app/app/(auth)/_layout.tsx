import { Redirect, Stack } from 'expo-router';

import { useAuthStore } from '@/store/authStore';
import { DEV_BYPASS_AUTH } from '@/lib/devAuth';
import { homeForTipo } from '@/lib/authRoutes';

// Stack de autenticação: headerless, slide horizontal. Usuário já autenticado é mandado
// direto à home do seu tipo (destino INEQUÍVOCO; '/' é ambíguo — ver authRoutes).
export default function AuthLayout() {
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);

  // [DEV — bypass de auth] Com a flag ligada, as telas de auth ficam navegáveis.
  if (!DEV_BYPASS_AUTH && status === 'authenticated' && user) {
    return <Redirect href={homeForTipo(user.tipo)} />;
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
