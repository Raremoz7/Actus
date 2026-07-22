// [DEV — bypass de auth] Liga uma sessão FALSA para navegar as telas sem backend/login.
// Controlado 100% por env: com EXPO_PUBLIC_DEV_BYPASS_AUTH != '1' este módulo é inerte.
// NUNCA habilitar em build de produção. Para remover o bypass de vez, apague este arquivo
// e os pontos marcados com `[DEV — bypass de auth]` (authStore + guards de layout).
import * as SecureStore from '@/lib/secureStorage';
import { reloadApp } from '@/lib/reloadApp';
import type { Me, UserTipo } from '@/types/me';

// Liga/desliga o bypass. Só vale quando explicitamente '1' no .env.
export const DEV_BYPASS_AUTH = process.env.EXPO_PUBLIC_DEV_BYPASS_AUTH === '1';

// Tipo do usuário falso — decide em qual área você cai no boot.
// Valores: 'aluno' | 'personal' | 'nutricionista'. Troque no .env e recarregue.
const tipoFromEnv = process.env.EXPO_PUBLIC_DEV_TIPO as UserTipo | undefined;
const DEV_TIPO_FALLBACK: UserTipo = tipoFromEnv ?? 'aluno';

// Chave durável do tipo escolhido no switcher de área (perfil). Precisa sobreviver ao
// reload porque a troca de área REINICIA o app (ver reloadApp): as 3 áreas compartilham
// as mesmas URLs (grupos são invisíveis na rota), então só um boot limpo monta a área alvo.
const DEV_TIPO_KEY = 'actus.dev_tipo';

function isAreaTipo(v: unknown): v is UserTipo {
  return v === 'aluno' || v === 'personal' || v === 'nutricionista';
}

// Tipo de DEV corrente — começa no DEV_TIPO do env e pode ser trocado em runtime
// pelo switcher de área (o persistido é lido no hydrateDevTipo, assíncrono).
let devTipo: UserTipo = DEV_TIPO_FALLBACK;

// Tipo de boot (compat com quem importava a const).
export const DEV_TIPO: UserTipo = devTipo;

// Usuário injetado no store quando o bypass está ligado. O `tipo` é resolvido de novo no
// hydrate (hydrateDevTipo) para cobrir o native, onde a leitura do persistido é assíncrona.
export const DEV_USER: Me = {
  id: '00000000-0000-4000-8000-000000000000',
  tipo: devTipo,
  display_name: 'Dev (bypass)',
};

export function getDevTipo(): UserTipo {
  return devTipo;
}

export function setDevTipo(tipo: UserTipo): void {
  devTipo = tipo;
  // Persiste para sobreviver ao reload da troca de área.
  void SecureStore.setItemAsync(DEV_TIPO_KEY, tipo);
}

// Boot: garante que `devTipo` reflita o valor persistido antes do dispatch por tipo.
export async function hydrateDevTipo(): Promise<UserTipo> {
  try {
    const v = await SecureStore.getItemAsync(DEV_TIPO_KEY);
    if (isAreaTipo(v)) devTipo = v;
  } catch {
    // Sem persistência disponível → mantém o fallback do env.
  }
  return devTipo;
}

// [DEV] Reinicia o app. Usado pelo switcher de área: a troca só fica limpa via boot do
// dispatcher (app/index), já que as áreas compartilham URLs e o router não troca de
// navegador montado in-app. Web recarrega a página; native usa o reload do dev client.
export { reloadApp };
