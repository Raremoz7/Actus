import { Redirect, Stack } from 'expo-router';

import { useAuthStore } from '@/store/authStore';

// Guard de papel: só personal autenticado entra.
export default function PersonalLayout() {
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);

  if (status !== 'authenticated' || user?.tipo !== 'personal') {
    return <Redirect href="/" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
