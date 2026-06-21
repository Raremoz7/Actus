import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AcademyContext, Me } from '../lib/schemas';

export type AuthUser = {
  id: string;
  display_name: string | null;
  tipo: string;
  roles: string[];
  academy: AcademyContext | null;
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
        set({
          user: {
            id: me.id,
            display_name: me.display_name,
            tipo: me.tipo,
            roles,
            academy: me.academy ?? null,
          },
        }),
      logout: () => set({ accessToken: null, refreshToken: null, user: null }),
    }),
    { name: 'actus-auth' },
  ),
);

export const selectIsAuthenticated = (s: AuthState) => s.accessToken !== null;
export const selectIsAdmin = (s: AuthState) => s.user?.roles.includes('actus_admin') ?? false;
// Gestor de academia: tipo='gestor' → JWT roles=['gestor']. Gestão pura (não atende alunos).
export const selectIsAcademyManager = (s: AuthState) => s.user?.roles.includes('gestor') ?? false;
// Instrutor: personal com vínculo de academia (academy.role === 'instructor').
export const selectIsAcademyInstructor = (s: AuthState) => s.user?.academy?.role === 'instructor';
export const selectAcademy = (s: AuthState) => s.user?.academy ?? null;
export const selectAcademyId = (s: AuthState) => s.user?.academy?.id ?? null;

/** Rota inicial conforme o papel: gestor → academia; admin → admin; demais → app. */
export function landingPathForUser(user: AuthUser | null): string {
  if (!user) return '/app';
  if (user.roles.includes('gestor')) return '/app/academia';
  if (user.roles.includes('actus_admin')) return '/app/admin';
  return '/app';
}
