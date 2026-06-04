import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { api } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { parseApi } from '@/api/parseApi';
import { ChallengeTeaserSchema, type ChallengeTeaser } from '@/types/challenges';
import { useAuthStore } from '@/store/authStore';

export const challengeTeaserQueryKey = ['me', 'challenges', 'teaser'] as const;

export function useChallengeTeaser(): UseQueryResult<ChallengeTeaser, unknown> {
  const status = useAuthStore((s) => s.status);
  return useQuery({
    queryKey: challengeTeaserQueryKey,
    queryFn: async (): Promise<ChallengeTeaser> => {
      const { data } = await api.get(endpoints.me.challenges);
      return parseApi(ChallengeTeaserSchema, data);
    },
    enabled: status === 'authenticated',
  });
}
