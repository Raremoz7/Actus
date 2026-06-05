import { Redirect, Stack } from 'expo-router';

import { useAuthStore } from '@/store/authStore';
import { DEV_BYPASS_AUTH } from '@/lib/devAuth';

// Stack de autenticação: headerless, slide horizontal. Usuário já autenticado é
// devolvido ao dispatch (que roteia por tipo).
export default function AuthLayout() {
  const status = useAuthStore((s) => s.status);

  // [DEV — bypass de auth] Com a flag ligada, as telas de auth ficam navegáveis.
  if (!DEV_BYPASS_AUTH && status === 'authenticated') {
    return <Redirect href="/" />;
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
