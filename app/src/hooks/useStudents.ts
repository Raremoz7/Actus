import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { api } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { parseApi } from '@/api/parseApi';
import { StudentsResponseSchema, type StudentsResponse } from '@/types/professional';
import { useAuthStore } from '@/store/authStore';

// Chave de cache da lista de alunos vinculados ao profissional.
export const studentsQueryKey = ['professional', 'students', 'list'] as const;

// GET /professional/students → alunos vinculados.
// 403 se a sessão não for de um profissional; só dispara quando autenticado.
export function useStudents(): UseQueryResult<StudentsResponse, unknown> {
  const status = useAuthStore((s) => s.status);

  return useQuery({
    queryKey: studentsQueryKey,
    queryFn: async (): Promise<StudentsResponse> => {
      const { data } = await api.get(endpoints.professional.students);
      return parseApi(StudentsResponseSchema, data);
    },
    enabled: status === 'authenticated',
  });
}
