import { Redirect, Stack } from 'expo-router';

import { useAuthStore } from '@/store/authStore';

// Stack de autenticação: headerless, slide horizontal. Usuário já autenticado é
// devolvido ao dispatch (que roteia por tipo).
export default function AuthLayout() {
  const status = useAuthStore((s) => s.status);

  if (status === 'authenticated') {
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
