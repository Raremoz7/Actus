import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../store/authStore';
import { SessionResponseSchema } from '../lib/schemas';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000',
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Single-flight: uma única promise de refresh compartilhada por todas as requests 401.
let refreshing: Promise<string | null> | null = null;

async function doRefresh(): Promise<string | null> {
  const { refreshToken, setTokens, logout } = useAuthStore.getState();
  if (!refreshToken) {
    logout();
    return null;
  }
  try {
    const r = await axios.post(`${api.defaults.baseURL}/auth/refresh`, {
      refresh_token: refreshToken,
    });
    const session = SessionResponseSchema.parse(r.data);
    // Refresh ROTACIONA: o refresh_token novo SEMPRE substitui o antigo.
    setTokens(session.access_token, session.refresh_token);
    return session.access_token;
  } catch {
    useAuthStore.getState().logout();
    return null;
  }
}

api.interceptors.response.use(undefined, async (err: AxiosError<{ error?: string }>) => {
  // Regra crítica: o branch vem SEMPRE no campo `error` do body — nunca pelo HTTP status.
  const branch = err.response?.data?.error;
  const original = err.config as (InternalAxiosRequestConfig & { _retried?: boolean }) | undefined;

  if (branch === 'invalid_token' && original && !original._retried) {
    refreshing ??= doRefresh().finally(() => {
      refreshing = null;
    });
    const token = await refreshing;
    if (token) {
      original._retried = true;
      original.headers.Authorization = `Bearer ${token}`;
      return api(original);
    }
  }

  if (branch === 'missing_authorization') useAuthStore.getState().logout();

  // `must_change_password` (403) e `invalid_credentials` NÃO deslogam — tratados na UI.
  return Promise.reject(err);
});
