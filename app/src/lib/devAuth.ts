// [DEV — bypass de auth] Liga uma sessão FALSA para navegar as telas sem backend/login.
// Controlado 100% por env: com EXPO_PUBLIC_DEV_BYPASS_AUTH != '1' este módulo é inerte.
// NUNCA habilitar em build de produção. Para remover o bypass de vez, apague este arquivo
// e os pontos marcados com `[DEV — bypass de auth]` (authStore + guards de layout).
import { DevSettings, Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import type { Me, UserTipo } from '@/types/me';

// Liga/desliga o bypass. Só vale quando explicitamente '1' no .env.
export const DEV_BYPASS_AUTH = process.env.EXPO_PUBLIC_DEV_BYPASS_AUTH === '1';

// Tipo do usuário falso — decide em qual área você cai no boot.
// Valores: 'aluno' | 'personal' | 'nutricionista'. Troque no .env e recarregue.
const tipoFromEnv = process.env.EXPO_PUBLIC_DEV_TIPO as UserTipo | undefined;
const DEV_TIPO_FALLBACK: UserTipo = tipoFromEnv ?? 'aluno';

const isWeb = Platform.OS === 'web';

// Chave durável do tipo escolhido no switcher de área (perfil). Precisa sobreviver ao
// reload porque a troca de área REINICIA o app (ver reloadApp): as 3 áreas compartilham
// as mesmas URLs (grupos são invisíveis na rota), então só um boot limpo monta a área alvo.
const DEV_TIPO_KEY = 'actus.dev_tipo';

function isAreaTipo(v: unknown): v is UserTipo {
  return v === 'aluno' || v === 'personal' || v === 'nutricionista';
}

// No web, localStorage é síncrono → já dá pra semear o tipo persistido no init do módulo,
// antes do dispatch por tipo. No native a leitura é async (ver hydrateDevTipo).
function readPersistedSync(): UserTipo | null {
  if (!isWeb) return null;
  const v = globalThis.localStorage?.getItem(DEV_TIPO_KEY);
  return isAreaTipo(v) ? v : null;
}

// Tipo de DEV corrente — começa no valor persistido (web) ou no DEV_TIPO do env, e pode ser
// trocado em runtime pelo switcher de área. O mock de /me lê daqui p/ manter coerência com
// a área para onde o roteamento leva.
let devTipo: UserTipo = readPersistedSync() ?? DEV_TIPO_FALLBACK;

// Tipo de boot (compat com quem importava a const). No web já reflete o persistido.
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
  if (isWeb) {
    globalThis.localStorage?.setItem(DEV_TIPO_KEY, tipo);
  } else {
    void SecureStore.setItemAsync(DEV_TIPO_KEY, tipo);
  }
}

// Boot: garante que `devTipo` reflita o valor persistido antes do dispatch por tipo.
// No web já foi resolvido no init do módulo (síncrono); no native lemos do SecureStore.
export async function hydrateDevTipo(): Promise<UserTipo> {
  if (isWeb) return devTipo;
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
export function reloadApp(): void {
  if (isWeb) {
    globalThis.location?.reload();
    return;
  }
  DevSettings.reload();
}
