import { Redirect, Stack } from 'expo-router';

import { useAuthStore } from '@/store/authStore';
import { AUTH_ENTRY, homeForTipo } from '@/lib/authRoutes';

// Onboarding pós-cadastro do aluno. Raiz (fora de (aluno)) com guard próprio.
// Sem header/voltar: conta criada, o fluxo só avança (passos puláveis quando cabível).
export default function OnboardingAlunoLayout() {
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);

  if (status !== 'authenticated' || !user) return <Redirect href={AUTH_ENTRY} />;
  if (user.tipo !== 'aluno') return <Redirect href={homeForTipo(user.tipo)} />;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        animationDuration: 300,
        gestureEnabled: false,
      }}
    />
  );
}
