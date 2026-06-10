import { Redirect, Stack } from 'expo-router';

import { useAuthStore } from '@/store/authStore';

// Guard de papel: só nutricionista autenticado entra.
export default function NutriLayout() {
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);

  if (status !== 'authenticated' || user?.tipo !== 'nutricionista') {
    return <Redirect href="/" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
