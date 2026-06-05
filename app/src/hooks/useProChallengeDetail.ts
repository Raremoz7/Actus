import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { api } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { parseApi } from '@/api/parseApi';
import {
  ProChallengeDetailSchema,
  type ProChallengeDetail,
} from '@/types/challenges';
import { useAuthStore } from '@/store/authStore';

// Chave de cache do detalhe de um desafio do profissional.
export function proChallengeDetailQueryKey(
  challengeId: string,
): readonly string[] {
  return ['professional', 'challenges', 'detail', challengeId];
}

// GET /professional/challenges/:id → { challenge, participants }.
// Só dispara quando autenticado e com challengeId presente.
export function useProChallengeDetail(
  challengeId: string | undefined,
): UseQueryResult<ProChallengeDetail, unknown> {
  const status = useAuthStore((s) => s.status);

  return useQuery({
    queryKey: proChallengeDetailQueryKey(challengeId ?? ''),
    queryFn: async (): Promise<ProChallengeDetail> => {
      const { data } = await api.get(
        `${endpoints.professionalChallenges}/${challengeId as string}`,
      );
      return parseApi(ProChallengeDetailSchema, data);
    },
    enabled: status === 'authenticated' && Boolean(challengeId),
  });
}
