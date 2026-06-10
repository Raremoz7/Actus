import { create } from 'zustand';
import { api } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { tokenStorage } from '@/api/storage';
import { parseApi } from '@/api/parseApi';
import { isApiError } from '@/api/errors';
import {
  TokensResponseSchema,
  type LoginBody,
  type RegisterBody,
  type RegisterProfessionalBody,
} from '@/types/auth';
import { MeSchema, type Me, type UserTipo } from '@/types/me';
import { DEV_BYPASS_AUTH, DEV_USER, setDevTipo, hydrateDevTipo } from '@/lib/devAuth';

// 4 estados, conforme contrato — nunca há um quinto.
// 'hydrating'   → boot, ainda decidindo se há sessão válida
// 'unauthenticated' → sem sessão (ou sessão encerrada)
// 'authenticated'   → sessão válida + /me resolvido
// 'must_change_password' → senha provisória, gate de troca antes de qualquer tela
export type AuthStatus =
  | 'hydrating'
  | 'unauthenticated'
  | 'authenticated'
  | 'must_change_password';

export interface AuthState {
  status: AuthStatus;
  user: Me | null;
  hydrate: () => Promise<void>;
  login: (email: string, senha: string) => Promise<void>;
  register: (body: RegisterBody) => Promise<void>;
  registerProfessional: (body: RegisterProfessionalBody) => Promise<void>;
  logout: () => Promise<void>;
  completePasswordChange: () => Promise<void>;
  refreshUser: () => Promise<void>;
  // [DEV — bypass de auth] Troca o tipo do usuário falso em runtime (switcher de área
  // no perfil). Inerte fora do bypass. Atualiza o store e o mock de /me (via setDevTipo).
  devSetTipo: (tipo: UserTipo) => void;
}

// GET /me validado — fonte única do usuário autenticado.
async function fetchMe(): Promise<Me> {
  const { data } = await api.get(endpoints.me.root);
  return parseApi(MeSchema, data);
}

// Resolve o /me logo após gravar os tokens e decide o status final.
// TRANSAÇÃO ATÔMICA: enquanto o /me não resolve, o status NUNCA vira 'authenticated'.
// Se o backend exigir troca de senha, paramos em 'must_change_password' sem passar por 'authenticated'.
async function resolveSessionStatus(
  set: (partial: Partial<AuthState>) => void,
): Promise<void> {
  try {
    const user = await fetchMe();
    set({ status: 'authenticated', user });
  } catch (err: unknown) {
    if (isApiError(err) && err.code === 'must_change_password') {
      set({ status: 'must_change_password', user: null });
      return;
    }
    throw err;
  }
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  status: 'hydrating',
  user: null,

  // Boot da app: decide a partir do refresh_token persistido + /me.
  async hydrate() {
    // [DEV — bypass de auth] Sessão falsa: nunca toca na rede, cai direto na área persistida
    // pelo switcher (ou no DEV_TIPO do env). hydrateDevTipo cobre o native, onde a leitura
    // do tipo persistido é assíncrona.
    if (DEV_BYPASS_AUTH) {
      const tipo = await hydrateDevTipo();
      set({ status: 'authenticated', user: { ...DEV_USER, tipo } });
      return;
    }

    const refresh = await tokenStorage.getRefresh();
    if (!refresh) {
      set({ status: 'unauthenticated', user: null });
      return;
    }

    try {
      const user = await fetchMe();
      set({ status: 'authenticated', user });
    } catch (err: unknown) {
      if (isApiError(err)) {
        // Senha provisória: gate de troca, sem limpar tokens.
        if (err.code === 'must_change_password') {
          set({ status: 'must_change_password', user: null });
          return;
        }
        // Rede caiu no boot: NÃO limpa tokens — a tela de login mostra o aviso
        // e o usuário pode tentar de novo sem perder a sessão.
        if (err.code === 'network_error') {
          set({ status: 'unauthenticated', user: null });
          return;
        }
      }
      // Qualquer outro erro (sessão inutilizável, perfil ausente): encerra a sessão.
      await tokenStorage.clear();
      set({ status: 'unauthenticated', user: null });
    }
  },

  // POST /auth/login → tokens → /me. Erros de credencial sobem para a UI.
  async login(email, senha) {
    const body: LoginBody = { email, password: senha };
    const { data } = await api.post(endpoints.auth.login, body);
    const tokens = parseApi(TokensResponseSchema, data);
    await tokenStorage.setTokens(tokens.access_token, tokens.refresh_token);
    await resolveSessionStatus(set);
  },

  // POST /auth/register → tokens → /me. Mesmo fluxo atômico do login.
  async register(body) {
    const { data } = await api.post(endpoints.auth.register, body);
    const tokens = parseApi(TokensResponseSchema, data);
    await tokenStorage.setTokens(tokens.access_token, tokens.refresh_token);
    await resolveSessionStatus(set);
  },

  // POST /auth/register-professional → tokens → /me. Mesmo fluxo atômico do register.
  // [pendente no backend] — em dev bypass, o devMocks responde.
  async registerProfessional(body) {
    const { data } = await api.post(endpoints.auth.registerProfessional, body);
    const tokens = parseApi(TokensResponseSchema, data);
    await tokenStorage.setTokens(tokens.access_token, tokens.refresh_token);
    await resolveSessionStatus(set);
  },

  // Logout best-effort: avisa o backend (ignora falha) e sempre limpa o local.
  async logout() {
    const refresh = await tokenStorage.getRefresh();
    if (refresh) {
      try {
        await api.post(endpoints.auth.logout, { refresh_token: refresh });
      } catch {
        // best-effort — a sessão local é encerrada de qualquer forma
      }
    }
    await tokenStorage.clear();
    set({ status: 'unauthenticated', user: null });
  },

  // Chamado após change-password bem-sucedido: revalida o /me e libera o app.
  async completePasswordChange() {
    const user = await fetchMe();
    set({ status: 'authenticated', user });
  },

  // Recarrega o usuário sem mexer no status (ex.: após PATCH /me).
  async refreshUser() {
    if (get().status !== 'authenticated') return;
    const user = await fetchMe();
    set({ user });
  },

  // [DEV — bypass de auth] Só faz sentido com sessão falsa. Atualiza o tipo do mock de
  // /me e o user do store; o roteamento por tipo (app/index) leva à área correspondente.
  devSetTipo(tipo) {
    if (!DEV_BYPASS_AUTH) return;
    setDevTipo(tipo);
    const u = get().user ?? DEV_USER;
    set({ user: { ...u, tipo } });
  },
}));
