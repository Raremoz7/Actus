import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Me } from '../lib/schemas';

export type AuthUser = {
  id: string;
  display_name: string | null;
  tipo: string;
  roles: string[];
};

type AuthState = {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setUser: (me: Me, roles: string[]) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      setTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),
      setUser: (me, roles) =>
        set({ user: { id: me.id, display_name: me.display_name, tipo: me.tipo, roles } }),
      logout: () => set({ accessToken: null, refreshToken: null, user: null }),
    }),
    { name: 'actus-auth' },
  ),
);

export const selectIsAuthenticated = (s: AuthState) => s.accessToken !== null;
export const selectIsAdmin = (s: AuthState) => s.user?.roles.includes('actus_admin') ?? false;
