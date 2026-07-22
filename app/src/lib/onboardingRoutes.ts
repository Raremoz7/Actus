import type { Href } from '@/navigation';
import type { UserTipo } from '@/types/me';
import { homeForTipo } from '@/lib/authRoutes';

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

// Destino de um usuário autenticado: onboarding (se há fluxo e ainda não foi
// concluído) ou a home do tipo. Fonte ÚNICA usada pelo dispatcher (app/index) e
// pelo guard do grupo (auth) — assim o onboarding abre já no 1º login, sem um
// deles pular o gate. Requer o store de onboarding hidratado (isDone confiável).
export function authedDestination(
  user: { id: string; tipo: UserTipo },
  isOnboardingDone: (userId: string) => boolean,
): Href {
  const entry = onboardingEntry(user.tipo);
  if (entry && !isOnboardingDone(user.id)) return entry;
  return homeForTipo(user.tipo);
}
