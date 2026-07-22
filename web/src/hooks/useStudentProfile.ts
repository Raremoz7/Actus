import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { StudentBadgesResponseSchema } from '../lib/schemas';

export function useStudentBadges(studentId: string) {
  return useQuery({
    queryKey: ['student-badges', studentId],
    enabled: studentId !== '',
    queryFn: async () => {
      const r = await api.get(`/professional/students/${studentId}/badges`);
      return StudentBadgesResponseSchema.parse(r.data).badges;
    },
    staleTime: 60_000,
  });
}

export type EditStudentInput = {
  full_name?: string;
  phone?: string | null;
  gender?: 'masculino' | 'feminino' | 'nao_informar' | 'outro';
  birth_date?: string;
  body_weight_kg?: number | null;
  height_cm?: number | null;
};

export function useUpdateStudent(studentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: EditStudentInput) => {
      await api.patch(`/professional/students/${studentId}`, input);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['students'] });
    },
  });
}

export function useSetStudentStatus(studentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (status: 'active' | 'revoked') => {
      await api.patch(`/professional/students/${studentId}/status`, { status });
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['students'] });
    },
  });
}
