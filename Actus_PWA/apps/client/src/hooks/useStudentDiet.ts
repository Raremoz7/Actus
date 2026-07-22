import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { api } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { parseApi } from '@/api/parseApi';
import { StudentDietsResponseSchema, type StudentDietsResponse } from '@/types/diets';
import { useAuthStore } from '@/store/authStore';

export const studentDietsQueryKey = ['me', 'diets', 'list'] as const;

// GET /me/diets — dietas atribuídas ao aluno (a lista já traz template_body).
export function useStudentDiet(): UseQueryResult<StudentDietsResponse, unknown> {
  const status = useAuthStore((s) => s.status);
  return useQuery({
    queryKey: studentDietsQueryKey,
    queryFn: async (): Promise<StudentDietsResponse> => {
      const { data } = await api.get(endpoints.me.diets);
      return parseApi(StudentDietsResponseSchema, data);
    },
    enabled: status === 'authenticated',
  });
}
