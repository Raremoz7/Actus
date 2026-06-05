import { Redirect, Stack } from 'expo-router';

import { useAuthStore } from '@/store/authStore';
import { DEV_BYPASS_AUTH } from '@/lib/devAuth';

// Guard de papel: só personal autenticado entra.
export default function PersonalLayout() {
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);

  // [DEV — bypass de auth] Com a flag ligada, qualquer um navega esta área.
  if (!DEV_BYPASS_AUTH && (status !== 'authenticated' || user?.tipo !== 'personal')) {
    return <Redirect href="/" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
