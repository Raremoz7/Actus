import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { api } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { parseApi } from '@/api/parseApi';
import { StudentWorkoutsResponseSchema, type StudentWorkoutsResponse } from '@/types/workouts';
import { useAuthStore } from '@/store/authStore';

export const studentWorkoutsQueryKey = ['me', 'workouts', 'list'] as const;

export function useStudentWorkouts(): UseQueryResult<StudentWorkoutsResponse, unknown> {
  const status = useAuthStore((s) => s.status);
  return useQuery({
    queryKey: studentWorkoutsQueryKey,
    queryFn: async (): Promise<StudentWorkoutsResponse> => {
      const { data } = await api.get(endpoints.me.workouts);
      return parseApi(StudentWorkoutsResponseSchema, data);
    },
    enabled: status === 'authenticated',
  });
}
