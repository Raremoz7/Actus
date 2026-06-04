import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { api } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { parseApi } from '@/api/parseApi';
import { WeeklyOverviewSchema, type WeeklyOverview } from '@/types/gamification';
import { useAuthStore } from '@/store/authStore';

export const weeklyOverviewQueryKey = ['me', 'weekly-overview'] as const;

export function useWeeklyOverview(): UseQueryResult<WeeklyOverview, unknown> {
  const status = useAuthStore((s) => s.status);
  return useQuery({
    queryKey: weeklyOverviewQueryKey,
    queryFn: async (): Promise<WeeklyOverview> => {
      const { data } = await api.get(endpoints.me.weeklyOverview);
      return parseApi(WeeklyOverviewSchema, data);
    },
    enabled: status === 'authenticated',
  });
}
