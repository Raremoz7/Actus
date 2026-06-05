// [DEV — bypass de auth] Liga uma sessão FALSA para navegar as telas sem backend/login.
// Controlado 100% por env: com EXPO_PUBLIC_DEV_BYPASS_AUTH != '1' este módulo é inerte.
// NUNCA habilitar em build de produção. Para remover o bypass de vez, apague este arquivo
// e os pontos marcados com `[DEV — bypass de auth]` (authStore + guards de layout).
import type { Me, UserTipo } from '@/types/me';

// Liga/desliga o bypass. Só vale quando explicitamente '1' no .env.
export const DEV_BYPASS_AUTH = process.env.EXPO_PUBLIC_DEV_BYPASS_AUTH === '1';

// Tipo do usuário falso — decide em qual área você cai no boot.
// Valores: 'aluno' | 'personal' | 'nutricionista'. Troque no .env e recarregue.
const tipoFromEnv = process.env.EXPO_PUBLIC_DEV_TIPO as UserTipo | undefined;
export const DEV_TIPO: UserTipo = tipoFromEnv ?? 'aluno';

// Usuário injetado no store quando o bypass está ligado.
export const DEV_USER: Me = {
  id: '00000000-0000-4000-8000-000000000000',
  tipo: DEV_TIPO,
  display_name: 'Dev (bypass)',
};
