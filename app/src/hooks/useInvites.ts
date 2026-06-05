import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { api } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { parseApi } from '@/api/parseApi';
import { InvitesResponseSchema, type InvitesResponse } from '@/types/invites';
import { useAuthStore } from '@/store/authStore';

// Chave de cache da lista de convites do profissional — invalidável após
// create/revoke (useInviteActions).
export const invitesListQueryKey = ['invites', 'list'] as const;

// GET /invites como query cacheada. Só dispara com sessão autenticada
// (/invites é requireAuth). active = derivado no backend (não expirado E
// used_count < max_uses).
export function useInvites(): UseQueryResult<InvitesResponse, unknown> {
  const status = useAuthStore((s) => s.status);

  return useQuery({
    queryKey: invitesListQueryKey,
    queryFn: async (): Promise<InvitesResponse> => {
      const { data } = await api.get(endpoints.invites);
      return parseApi(InvitesResponseSchema, data);
    },
    enabled: status === 'authenticated',
  });
}
