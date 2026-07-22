import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { api } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { parseApi } from '@/api/parseApi';
import {
  ProStudentWorkoutsResponseSchema,
  type ProStudentWorkoutsResponse,
} from '@/types/workouts';
import { useAuthStore } from '@/store/authStore';

// Chave filha de ['professional','students',studentId] — assim invalidar o aluno
// (em useAssignWorkout / useUpdateStudentWorkout) também revalida esta lista.
export const proStudentWorkoutsKey = (studentId: string) =>
  ['professional', 'students', studentId, 'workouts'] as const;

// [Pro] Treinos atribuídos a um aluno (GET /students/:id/workouts).
// CONTRATO PROPOSTO: o backend v1 ainda não expõe este GET — enquanto não existir, a
// query falha/retorna vazio e a tela mostra o estado vazio. A forma esperada espelha
// /me/student/workouts (ver ProStudentWorkoutsResponseSchema).
export function useProStudentWorkouts(
  studentId: string | undefined,
): UseQueryResult<ProStudentWorkoutsResponse, unknown> {
  const status = useAuthStore((s) => s.status);
  return useQuery({
    queryKey: proStudentWorkoutsKey(studentId ?? 'none'),
    queryFn: async (): Promise<ProStudentWorkoutsResponse> => {
      const { data } = await api.get(endpoints.studentWorkouts(studentId as string));
      return parseApi(ProStudentWorkoutsResponseSchema, data);
    },
    enabled: status === 'authenticated' && Boolean(studentId),
    // Endpoint ainda inexistente: não insistir em retry para não floodar 404.
    retry: false,
  });
}
