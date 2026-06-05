import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { api } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { parseApi } from '@/api/parseApi';
import { CheckInsResponseSchema, type CheckInsResponse } from '@/types/professional';
import { useAuthStore } from '@/store/authStore';

// Chave de cache dos check-ins de um aluno específico (atividade recente).
export const studentCheckInsQueryKey = (studentId: string) =>
  ['professional', 'students', studentId, 'check-ins'] as const;

// GET /professional/students/:id/check-ins → atividade recente do aluno.
// Só dispara quando autenticado e com um studentId presente.
export function useStudentCheckIns(
  studentId: string | undefined,
): UseQueryResult<CheckInsResponse, unknown> {
  const status = useAuthStore((s) => s.status);

  return useQuery({
    queryKey: studentCheckInsQueryKey(studentId ?? ''),
    queryFn: async (): Promise<CheckInsResponse> => {
      const { data } = await api.get(endpoints.professional.studentCheckIns(studentId as string));
      return parseApi(CheckInsResponseSchema, data);
    },
    enabled: status === 'authenticated' && Boolean(studentId),
  });
}
