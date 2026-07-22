import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { api } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { parseApi } from '@/api/parseApi';
import { WorkoutDetailSchema, type WorkoutDetail } from '@/types/workouts';
import { useAuthStore } from '@/store/authStore';

export function workoutDetailQueryKey(id: string) {
  return ['me', 'workouts', 'detail', id] as const;
}

export function useWorkoutDetail(studentWorkoutId: string): UseQueryResult<WorkoutDetail, unknown> {
  const status = useAuthStore((s) => s.status);
  return useQuery({
    queryKey: workoutDetailQueryKey(studentWorkoutId),
    queryFn: async (): Promise<WorkoutDetail> => {
      const { data } = await api.get(`${endpoints.me.workouts}/${studentWorkoutId}`);
      return parseApi(WorkoutDetailSchema, data);
    },
    enabled: status === 'authenticated' && studentWorkoutId.length > 0,
  });
}
