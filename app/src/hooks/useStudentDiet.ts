import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { api } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { parseApi } from '@/api/parseApi';
import { StudentDietSummarySchema, type StudentDietSummary } from '@/types/diets';
import { useAuthStore } from '@/store/authStore';

export const studentDietQueryKey = ['me', 'diets', 'current'] as const;

export function useStudentDiet(): UseQueryResult<StudentDietSummary, unknown> {
  const status = useAuthStore((s) => s.status);
  return useQuery({
    queryKey: studentDietQueryKey,
    queryFn: async (): Promise<StudentDietSummary> => {
      const { data } = await api.get(endpoints.me.diets);
      return parseApi(StudentDietSummarySchema, data);
    },
    enabled: status === 'authenticated',
  });
}
