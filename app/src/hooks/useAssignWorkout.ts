import {
  useMutation,
  useQueryClient,
  type UseMutationResult,
} from '@tanstack/react-query';
import { api } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { parseApi } from '@/api/parseApi';
import {
  AssignWorkoutResponseSchema,
  type AssignWorkoutBody,
  type AssignWorkoutResponse,
} from '@/types/workouts';

export interface AssignWorkoutVars {
  studentId: string;
  body: AssignWorkoutBody;
}

// POST /students/:student_id/workouts → atribui um template de treino a um aluno.
// Resposta: 201 { ok: true, student_workout_id }. Verificado no backend (studentWorkouts.ts).
//
// NOTA: não existe GET /students/:id/workouts na API v1 — não há query de
// "treinos atribuídos a um aluno" para invalidar no cliente. Invalidamos a
// atividade recente do aluno (check-ins) por precaução; quando o endpoint de
// lista por aluno existir, adicionar a invalidação aqui.
export function useAssignWorkout(): UseMutationResult<
  AssignWorkoutResponse,
  unknown,
  AssignWorkoutVars
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ studentId, body }: AssignWorkoutVars): Promise<AssignWorkoutResponse> => {
      const { data } = await api.post(endpoints.studentWorkouts(studentId), body);
      return parseApi(AssignWorkoutResponseSchema, data);
    },
    onSuccess: (_data: AssignWorkoutResponse, { studentId }: AssignWorkoutVars): void => {
      // Atribuir um treino afeta a atividade/programa do aluno.
      queryClient.invalidateQueries({
        queryKey: ['professional', 'students', studentId],
      });
    },
  });
}
