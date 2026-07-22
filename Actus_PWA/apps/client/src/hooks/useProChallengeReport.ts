import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { api } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { parseApi } from '@/api/parseApi';
import {
  ProChallengeReportSchema,
  type ProChallengeReport,
} from '@/types/challenges';
import { useAuthStore } from '@/store/authStore';

// Chave de cache do relatório de um desafio (lado profissional).
export function proChallengeReportQueryKey(
  challengeId: string,
): readonly ['professional', 'challenges', 'report', string] {
  return ['professional', 'challenges', 'report', challengeId] as const;
}

// GET /professional/challenges/:id/report — métricas agregadas do desafio para o
// dono (invited/active/declined, médias de adesão, span de dias e participantes
// com hint de streak quebrada). Só dispara com sessão autenticada e id presente.
export function useProChallengeReport(
  challengeId: string | undefined,
): UseQueryResult<ProChallengeReport, unknown> {
  const status = useAuthStore((s) => s.status);

  return useQuery({
    queryKey: proChallengeReportQueryKey(challengeId ?? ''),
    queryFn: async (): Promise<ProChallengeReport> => {
      const { data } = await api.get(
        `${endpoints.professionalChallenges}/${challengeId}/report`,
      );
      return parseApi(ProChallengeReportSchema, data);
    },
    enabled: status === 'authenticated' && Boolean(challengeId),
  });
}
