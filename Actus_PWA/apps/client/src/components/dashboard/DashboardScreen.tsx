import { Screen, ListState } from '@/components/ui';
import { useMe } from '@/hooks/useMe';

import { PersonalDashboard } from './PersonalDashboard';
import { NutriDashboard } from './NutriDashboard';

// Dashboard (aba Início) compartilhado: escolhe o conteúdo pelo tipo do usuário.
// Cada sub-dashboard chama só os hooks do seu papel (evita 403 cruzado e hooks
// condicionais).
export function DashboardScreen() {
  const me = useMe();
  const tipo = me.data?.tipo;

  if (tipo === 'nutricionista') return <NutriDashboard />;
  if (tipo === 'personal') return <PersonalDashboard />;

  // /me falhou: feedback explícito + retry (antes ficava em branco pra sempre).
  if (me.isError) {
    return (
      <Screen edges={['top']}>
        <ListState
          kind="error"
          title="Não foi possível carregar"
          message="Verifique sua conexão e tente novamente."
          actionLabel="Tentar de novo"
          onAction={() => void me.refetch()}
        />
      </Screen>
    );
  }

  // /me ainda resolvendo (ou tipo inesperado): loading em vez de tela branca.
  return (
    <Screen edges={['top']}>
      <ListState kind="loading" skeletonCount={3} />
    </Screen>
  );
}
