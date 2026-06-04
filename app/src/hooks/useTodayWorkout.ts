import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { api } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { parseApi } from '@/api/parseApi';
import { TodayWorkoutSummarySchema, type TodayWorkoutSummary } from '@/types/workouts';
import { useAuthStore } from '@/store/authStore';

export const todayWorkoutQueryKey = ['me', 'workouts', 'today'] as const;

export function useTodayWorkout(): UseQueryResult<TodayWorkoutSummary, unknown> {
  const status = useAuthStore((s) => s.status);
  return useQuery({
    queryKey: todayWorkoutQueryKey,
    queryFn: async (): Promise<TodayWorkoutSummary> => {
      const { data } = await api.get(endpoints.me.workouts);
      return parseApi(TodayWorkoutSummarySchema, data);
    },
    enabled: status === 'authenticated',
  });
}
