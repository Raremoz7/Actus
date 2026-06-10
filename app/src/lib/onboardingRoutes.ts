import type { Href } from 'expo-router';
import type { UserTipo } from '@/types/me';

// Primeira tela do onboarding por tipo (null = tipo sem onboarding: nutri/staff).
export function onboardingEntry(tipo: UserTipo): Href | null {
  switch (tipo) {
    case 'aluno':
      return '/onboarding-aluno/foto' as Href;
    case 'personal':
      return '/onboarding-professor/foto' as Href;
    default:
      return null;
  }
}
