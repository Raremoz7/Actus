import { Redirect, Stack } from 'expo-router';

import { useAuthStore } from '@/store/authStore';

// Guard de papel: só aluno autenticado entra. Demais voltam ao dispatch.
export default function AlunoLayout() {
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);

  if (status !== 'authenticated' || user?.tipo !== 'aluno') {
    return <Redirect href="/" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
