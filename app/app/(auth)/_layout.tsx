import { Redirect, Stack } from 'expo-router';

import { useAuthStore } from '@/store/authStore';
import { DEV_BYPASS_AUTH } from '@/lib/devAuth';
import { AUTH_ENTRY, homeForTipo } from '@/lib/authRoutes';

// Stack de autenticação: headerless, slide horizontal. Usuário já autenticado é mandado
// direto à home do seu tipo (destino INEQUÍVOCO; '/' é ambíguo — ver authRoutes).
export default function AuthLayout() {
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);

  // [DEV — bypass de auth] Com a flag ligada, as telas de auth ficam navegáveis.
  // Só redireciona se o destino NÃO for a própria entrada do (auth) — senão um tipo
  // sem home (staff/desconhecido → AUTH_ENTRY) entraria em loop de redirect (tela branca).
  if (!DEV_BYPASS_AUTH && status === 'authenticated' && user) {
    const home = homeForTipo(user.tipo);
    if (home !== AUTH_ENTRY) {
      return <Redirect href={home} />;
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
