import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { api } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { parseApi } from '@/api/parseApi';
import {
  ProChallengesResponseSchema,
  type ProChallengesResponse,
} from '@/types/challenges';
import { useAuthStore } from '@/store/authStore';

// Chave de cache da lista de desafios do profissional logado.
export const proChallengesListQueryKey = [
  'professional',
  'challenges',
  'list',
] as const;

// GET /professional/challenges → { challenges: [ChallengeSchema...] }.
// 403 (only_personal) se a sessão não for de um personal; só dispara quando
// autenticado. A lista REAL não traz participant_count.
export function useProChallenges(): UseQueryResult<
  ProChallengesResponse,
  unknown
> {
  const status = useAuthStore((s) => s.status);

  return useQuery({
    queryKey: proChallengesListQueryKey,
    queryFn: async (): Promise<ProChallengesResponse> => {
      const { data } = await api.get(endpoints.professionalChallenges);
      return parseApi(ProChallengesResponseSchema, data);
    },
    enabled: status === 'authenticated',
  });
}
