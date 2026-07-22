import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { api } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { parseApi } from '@/api/parseApi';
import { StudentDietDetailSchema, type StudentDietDetail } from '@/types/diets';
import { useAuthStore } from '@/store/authStore';

export function studentDietDetailQueryKey(id: string) {
  return ['me', 'diets', 'detail', id] as const;
}

export function useStudentDietDetail(
  studentDietId: string,
): UseQueryResult<StudentDietDetail, unknown> {
  const status = useAuthStore((s) => s.status);
  return useQuery({
    queryKey: studentDietDetailQueryKey(studentDietId),
    queryFn: async (): Promise<StudentDietDetail> => {
      const { data } = await api.get(`${endpoints.me.diets}/${studentDietId}`);
      return parseApi(StudentDietDetailSchema, data);
    },
    enabled: status === 'authenticated' && studentDietId.length > 0,
  });
}
