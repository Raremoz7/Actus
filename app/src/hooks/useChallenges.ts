import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { api } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { parseApi } from '@/api/parseApi';
import { ChallengesResponseSchema, type ChallengesResponse } from '@/types/challenges';
import { useAuthStore } from '@/store/authStore';

// Chave de cache da lista de desafios — invalidável após accept/decline.
export const challengesListQueryKey = ['me', 'challenges', 'list'] as const;

// GET /me/challenges como query cacheada. Só dispara com sessão autenticada.
// A lista NÃO traz progresso numérico — a tela deriva "dia X de Y" das datas.
export function useChallenges(): UseQueryResult<ChallengesResponse, unknown> {
  const status = useAuthStore((s) => s.status);

  return useQuery({
    queryKey: challengesListQueryKey,
    queryFn: async (): Promise<ChallengesResponse> => {
      const { data } = await api.get(endpoints.me.challenges);
      return parseApi(ChallengesResponseSchema, data);
    },
    enabled: status === 'authenticated',
  });
}
