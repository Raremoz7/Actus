// Destinos de roteamento por estado de auth — centralizados para os guards de layout e o
// dispatcher (app/index) não divergirem. NUNCA redirecionar para '/': a raiz é AMBÍGUA
// (colide entre app/index e (aluno)/(tabs)/index, ambos mapeiam para '/'), e um guard que
// manda para '/' pode cair de volta na própria área e entrar em loop de redirect.
import type { Href } from 'expo-router';
import type { UserTipo } from '@/types/me';

// Entrada do fluxo não autenticado.
export const AUTH_ENTRY = '/(auth)/escolha-perfil' as Href;

// Gate de senha provisória.
export const PASSWORD_GATE = '/(auth)/trocar-senha' as Href;

// Home por tipo de usuário autenticado. Aluno cai no index das suas (tabs); personal e
// nutri têm a aba "inicio" (dashboard) como landing dedicada.
export function homeForTipo(tipo: UserTipo): Href {
  switch (tipo) {
    case 'aluno':
      return '/(aluno)/(tabs)' as Href;
    case 'personal':
      return '/(personal)/(tabs)/inicio' as Href;
    case 'nutricionista':
      return '/(nutri)/(tabs)/inicio' as Href;
    // staff não tem área (não aparece em /me); fallback seguro para a escolha de perfil.
    default:
      return AUTH_ENTRY;
  }
}
