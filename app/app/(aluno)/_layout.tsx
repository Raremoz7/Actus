import { Redirect, Stack } from 'expo-router';

import { useAuthStore } from '@/store/authStore';
import { DEV_BYPASS_AUTH } from '@/lib/devAuth';

// Guard de papel: só aluno autenticado entra. Demais voltam ao dispatch.
export default function AlunoLayout() {
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);

  // [DEV — bypass de auth] Com a flag ligada, qualquer um navega esta área.
  if (!DEV_BYPASS_AUTH && (status !== 'authenticated' || user?.tipo !== 'aluno')) {
    return <Redirect href="/" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
