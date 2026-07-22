import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { api } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { parseApi } from '@/api/parseApi';
import { MeSchema, type Me } from '@/types/me';
import { useAuthStore } from '@/store/authStore';

// Chave de cache compartilhada — invalidável após PATCH /me, por exemplo.
export const meQueryKey = ['me'] as const;

// GET /me como query cacheada. Só dispara quando a sessão está autenticada
// (durante hydrating / must_change_password não faz sentido buscar o perfil).
export function useMe(): UseQueryResult<Me, unknown> {
  const status = useAuthStore((s) => s.status);

  return useQuery({
    queryKey: meQueryKey,
    queryFn: async (): Promise<Me> => {
      const { data } = await api.get(endpoints.me.root);
      return parseApi(MeSchema, data);
    },
    enabled: status === 'authenticated',
  });
}
