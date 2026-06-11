import axios, { AxiosError } from 'axios';
import { api } from './client';
import { useAuthStore } from '../store/authStore';
import { decodeJwtPayload, MeSchema, SessionResponseSchema } from '../lib/schemas';

export type LoginResult =
  | { ok: true }
  | { ok: false; error: 'invalid_credentials' | 'must_change_password' | 'unknown' };

export async function login(email: string, password: string): Promise<LoginResult> {
  const { setTokens, setUser } = useAuthStore.getState();
  try {
    const r = await api.post('/auth/login', { email, password });
    const session = SessionResponseSchema.parse(r.data);
    setTokens(session.access_token, session.refresh_token);

    // Roles vivem no payload do JWT (GET /me só devolve id/tipo/display_name).
    const claims = decodeJwtPayload(session.access_token);
    const roles = claims.roles ?? [];

    const meRes = await api.get('/me');
    const me = MeSchema.parse(meRes.data);
    setUser(me, roles);

    // must_change_password chega como 403 nas rotas protegidas; o claim já avisa no login.
    if (claims.must_change_password) return { ok: false, error: 'must_change_password' };
    return { ok: true };
  } catch (e) {
    if (axios.isAxiosError(e)) {
      const branch = (e as AxiosError<{ error?: string }>).response?.data?.error;
      if (branch === 'invalid_credentials') return { ok: false, error: 'invalid_credentials' };
      if (branch === 'must_change_password') return { ok: false, error: 'must_change_password' };
    }
    return { ok: false, error: 'unknown' };
  }
}
