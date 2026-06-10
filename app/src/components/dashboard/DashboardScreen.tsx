import { Screen } from '@/components/ui';
import { useMe } from '@/hooks/useMe';

import { PersonalDashboard } from './PersonalDashboard';
import { NutriDashboard } from './NutriDashboard';

// Dashboard (aba Início) compartilhado: escolhe o conteúdo pelo tipo do usuário.
// Cada sub-dashboard chama só os hooks do seu papel (evita 403 cruzado e hooks
// condicionais). Enquanto /me resolve, mostra um Screen vazio.
export function DashboardScreen() {
  const tipo = useMe().data?.tipo;
  if (tipo === 'nutricionista') return <NutriDashboard />;
  if (tipo === 'personal') return <PersonalDashboard />;
  return <Screen edges={['top']}>{null}</Screen>;
}
