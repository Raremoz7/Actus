import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { api } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { parseApi } from '@/api/parseApi';
import { RankingResponseSchema, type RankingResponse } from '@/types/challenges';
import { useAuthStore } from '@/store/authStore';

// Chave de cache do ranking de um desafio específico.
export function challengeRankingQueryKey(challengeId: string): readonly string[] {
  return ['me', 'challenges', 'ranking', challengeId];
}

// GET /me/challenges/:id/ranking como query cacheada. Só dispara com sessão
// autenticada e um challengeId presente.
// Só funciona p/ visibility 'public_among_participants' E participante 'active' —
// senão a API responde 403 (ranking_private / forbidden_not_participant), que vira
// isError aqui e é tratado pela tela ("ranking indisponível").
export function useChallengeRanking(
  challengeId: string | undefined,
): UseQueryResult<RankingResponse, unknown> {
  const status = useAuthStore((s) => s.status);

  return useQuery({
    queryKey: challengeRankingQueryKey(challengeId ?? ''),
    queryFn: async (): Promise<RankingResponse> => {
      const { data } = await api.get(
        `${endpoints.me.challenges}/${challengeId}/ranking`,
      );
      return parseApi(RankingResponseSchema, data);
    },
    enabled: status === 'authenticated' && Boolean(challengeId),
  });
}
