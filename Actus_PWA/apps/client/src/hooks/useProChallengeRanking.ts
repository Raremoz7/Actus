import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { api } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { parseApi } from '@/api/parseApi';
import { RankingResponseSchema, type RankingResponse } from '@/types/challenges';
import { useAuthStore } from '@/store/authStore';

// Chave de cache do ranking de um desafio (visão do profissional dono).
export function proChallengeRankingQueryKey(
  challengeId: string,
): readonly string[] {
  return ['professional', 'challenges', 'ranking', challengeId];
}

// GET /professional/challenges/:id/ranking → { visibility, ranking }.
// Mesmo shape do ranking do aluno — reusa RankingResponseSchema. O dono sempre
// enxerga o ranking (sem gate de visibility). Só dispara quando autenticado e
// com challengeId presente.
export function useProChallengeRanking(
  challengeId: string | undefined,
): UseQueryResult<RankingResponse, unknown> {
  const status = useAuthStore((s) => s.status);

  return useQuery({
    queryKey: proChallengeRankingQueryKey(challengeId ?? ''),
    queryFn: async (): Promise<RankingResponse> => {
      const { data } = await api.get(
        `${endpoints.professionalChallenges}/${challengeId as string}/ranking`,
      );
      return parseApi(RankingResponseSchema, data);
    },
    enabled: status === 'authenticated' && Boolean(challengeId),
  });
}
