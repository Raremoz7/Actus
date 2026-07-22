import { Platform } from 'react-native';
import axios, {
  AxiosError,
  type AxiosInstance,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';
import { ApiErrorBodySchema } from '@/types/error';
import { TokensResponseSchema } from '@/types/auth';
import { ApiError } from './errors';
import { tokenStorage } from './storage';
import { endpoints } from './endpoints';
import { DEV_BYPASS_AUTH } from '@/lib/devAuth';
import { installDevMockAdapter } from './devMocks';

// Estende a config do axios com o guard de retry (evita refresh em loop na mesma request).
declare module 'axios' {
  export interface InternalAxiosRequestConfig {
    _retry?: boolean;
  }
}

// Eventos que o root layout sobrescreve para reagir ao ciclo de auth.
// As implementações DEVEM ser idempotentes — o interceptor pode chamá-las mais de uma vez.
export const apiEvents: {
  onLogout: () => void;
  onMustChangePassword: () => void;
} = {
  onLogout: () => {},
  onMustChangePassword: () => {},
};

// Dispara um evento de auth sem nunca quebrar o interceptor (o handler é externo).
function emit(event: 'onLogout' | 'onMustChangePassword'): void {
  try {
    apiEvents[event]();
  } catch {
    // handler externo falhou — engolimos para não corromper a cadeia de erro do axios
  }
}

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? '';

// Túnel ngrok (usado em builds de QA contra o backend local): sem este header o
// ngrok-free intercepta a request e devolve uma página de aviso em HTML em vez de
// repassar pro backend. Inofensivo fora do ngrok — por isso condicionado à base URL.
const baseHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
if (BASE_URL.includes('ngrok')) {
  baseHeaders['ngrok-skip-browser-warning'] = 'true';
}

// Instância principal — todas as chamadas da app passam por aqui.
export const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { ...baseHeaders },
});

// [DEV — bypass de auth] Popula as telas com dados fake sem backend.
if (DEV_BYPASS_AUTH) {
  installDevMockAdapter(api);
}

// Instância CRUA, sem interceptors — usada só para o refresh, evitando recursão.
const rawAxios: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { ...baseHeaders },
});

// Paths de auth que NÃO recebem Bearer (o token ainda não existe ou está sendo trocado).
const NO_AUTH_PATHS: readonly string[] = [
  endpoints.auth.register,
  endpoints.auth.registerProfessional,
  endpoints.auth.login,
  endpoints.auth.refresh,
];

function isNoAuthPath(url: string | undefined): boolean {
  if (!url) return false;
  return NO_AUTH_PATHS.some((p) => url === p || url.endsWith(p));
}

// ─── Request interceptor: injeta Bearer exceto nos paths de auth ───
api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  if (!isNoAuthPath(config.url)) {
    const access = await tokenStorage.getAccess();
    if (access) {
      config.headers.set('Authorization', `Bearer ${access}`);
    }
  }
  return config;
});

// ─── Single-flight refresh ───
// Um único refresh em voo por vez; requests concorrentes aguardam a mesma promise.
let refreshPromise: Promise<string> | null = null;

async function runRefresh(): Promise<string> {
  const refresh = await tokenStorage.getRefresh();
  if (!refresh) {
    // Sem refresh_token não há como renovar — sessão encerrada.
    throw new ApiError('invalid_refresh_token');
  }

  const response = await rawAxios.post(endpoints.auth.refresh, { refresh_token: refresh });
  const parsed = TokensResponseSchema.safeParse(response.data);
  if (!parsed.success) {
    throw new ApiError('invalid_response_shape', {
      extras: { issues: parsed.error.issues },
    });
  }

  // Refresh ROTACIONA o refresh_token — persistimos o par novo.
  await tokenStorage.setTokens(parsed.data.access_token, parsed.data.refresh_token);
  return parsed.data.access_token;
}

// Garante que só exista um refresh ativo; em falha, limpa sessão e dispara logout.
function getRefreshedAccess(): Promise<string> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = runRefresh()
    .catch(async (err: unknown) => {
      await tokenStorage.clear();
      emit('onLogout');
      throw err;
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}

// Lê o código de erro do body (campo "error"), sem assumir status HTTP.
function extractErrorCode(data: unknown): string | null {
  const parsed = ApiErrorBodySchema.safeParse(data);
  return parsed.success ? parsed.data.error : null;
}

// Extrai os extras do body (o body inteiro quando é objeto), preservando detalhes.
function extractExtras(data: unknown): Record<string, unknown> {
  if (data !== null && typeof data === 'object') {
    return { ...(data as Record<string, unknown>) };
  }
  return {};
}

// Repete a request original com o novo access token.
async function retryWithNewAccess(
  config: InternalAxiosRequestConfig,
  access: string,
): Promise<AxiosResponse> {
  config._retry = true;
  config.headers.set('Authorization', `Bearer ${access}`);
  return api.request(config);
}

// ─── Response interceptor de erro: branch SEMPRE por body.error, nunca por status ───
api.interceptors.response.use(
  (response) => response,
  async (error: unknown): Promise<AxiosResponse> => {
    // Erro já normalizado (ex.: vindo do request interceptor) — repropaga.
    if (error instanceof ApiError) {
      throw error;
    }

    // Qualquer rejeição que não seja AxiosError vira erro de rede genérico.
    if (!(error instanceof AxiosError)) {
      throw new ApiError('network_error', { cause: error });
    }

    const response = error.response;
    const config = error.config;

    // (a) Sem resposta = rede caiu / timeout / DNS.
    if (!response) {
      throw new ApiError('network_error', { cause: error });
    }

    const httpStatus = response.status;
    const code = extractErrorCode(response.data);

    // (g) status de erro sem body.error legível.
    if (!code) {
      throw new ApiError('network_error', { httpStatus });
    }

    const extras = extractExtras(response.data);

    // (b) invalid_token → refresh single-flight + retry (uma única vez por request).
    if (code === 'invalid_token') {
      if (!config || config._retry) {
        // Já tentamos refresh nesta request (ou não há config) — desiste.
        throw new ApiError(code, { httpStatus, extras });
      }
      try {
        const newAccess = await getRefreshedAccess();
        return await retryWithNewAccess(config, newAccess);
      } catch (refreshErr: unknown) {
        // getRefreshedAccess já limpou tokens e emitiu logout em caso de falha.
        if (refreshErr instanceof ApiError) throw refreshErr;
        throw new ApiError('invalid_refresh_token', { cause: refreshErr });
      }
    }

    // (c) missing_authorization → sessão inválida, logout imediato.
    if (code === 'missing_authorization') {
      await tokenStorage.clear();
      emit('onLogout');
      throw new ApiError(code, { httpStatus, extras });
    }

    // (e) invalid_refresh_token → refresh inutilizável, logout.
    if (code === 'invalid_refresh_token') {
      await tokenStorage.clear();
      emit('onLogout');
      throw new ApiError(code, { httpStatus, extras });
    }

    // (d) must_change_password → gate de troca de senha, SEM logout.
    if (code === 'must_change_password') {
      emit('onMustChangePassword');
      throw new ApiError(code, { httpStatus, extras });
    }

    // (f) qualquer outro código → propaga para a UI tratar.
    throw new ApiError(code, { httpStatus, extras });
  },
);
