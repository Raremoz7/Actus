import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import {
  CheckInsResponseSchema,
  StudentWorkoutPatchResponseSchema,
  StudentWorkoutsResponseSchema,
} from '../lib/schemas';
import { formatDateLocal } from '../lib/studentStatus';

/** Janela de check-ins dos últimos `days` dias — datas LOCAIS (nunca toISOString). */
export function checkInsQueryOptions(studentId: string, days: number) {
  // `to` = hoje local; `from` = hoje - days. Chave usa só (id, days) para reuso de cache.
  return {
    queryKey: ['student-check-ins', studentId, days] as const,
    queryFn: async () => {
      const now = new Date();
      const from = new Date(now.getFullYear(), now.getMonth(), now.getDate() - days);
      const r = await api.get(`/professional/students/${studentId}/check-ins`, {
        params: { from: formatDateLocal(from), to: formatDateLocal(now), limit: 500 },
      });
      return CheckInsResponseSchema.parse(r.data).check_ins;
    },
    staleTime: 60_000,
  };
}

export function useStudentCheckIns(studentId: string, days = 60) {
  return useQuery({ ...checkInsQueryOptions(studentId, days), enabled: studentId !== '' });
}

export function workoutsQueryOptions(studentId: string) {
  return {
    queryKey: ['student-workouts', studentId] as const,
    queryFn: async () => {
      const r = await api.get(`/students/${studentId}/workouts`);
      return StudentWorkoutsResponseSchema.parse(r.data).student_workouts;
    },
    staleTime: 60_000,
  };
}

export function useStudentWorkouts(studentId: string) {
  return useQuery(workoutsQueryOptions(studentId));
}

/** PATCH is_active de uma atribuição (ativar/desativar treino do aluno). */
export function useToggleWorkoutActive(studentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ studentWorkoutId, isActive }: { studentWorkoutId: string; isActive: boolean }) => {
      const r = await api.patch(`/students/${studentId}/workouts/${studentWorkoutId}`, {
        is_active: isActive,
      });
      return StudentWorkoutPatchResponseSchema.parse(r.data);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['student-workouts', studentId] });
    },
  });
}
