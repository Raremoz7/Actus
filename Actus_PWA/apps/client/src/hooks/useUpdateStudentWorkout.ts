import {
  useMutation,
  useQueryClient,
  type UseMutationResult,
} from '@tanstack/react-query';
import { api } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import type { Weekday } from '@/types/workouts';

export interface UpdateStudentWorkoutBody {
  weekdays?: Weekday[];
  start_date?: string | null;
  end_date?: string | null;
  display_order?: number;
  // is_active=false é o "remover" do programa (a API não tem DELETE; é soft-disable).
  is_active?: boolean;
}

export interface UpdateStudentWorkoutVars {
  studentId: string;
  studentWorkoutId: string;
  body: UpdateStudentWorkoutBody;
}

// PATCH /students/:student_id/workouts/:student_workout_id — edita os dias/datas de uma
// atribuição, ou a desativa (is_active:false = "remover"). Verificado no backend
// (studentWorkouts.ts). A resposta não é consumida; só invalidamos o aluno.
export function useUpdateStudentWorkout(): UseMutationResult<
  unknown,
  unknown,
  UpdateStudentWorkoutVars
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      studentId,
      studentWorkoutId,
      body,
    }: UpdateStudentWorkoutVars): Promise<unknown> => {
      const { data } = await api.patch(
        `${endpoints.studentWorkouts(studentId)}/${studentWorkoutId}`,
        body,
      );
      return data;
    },
    onSuccess: (_data: unknown, { studentId }: UpdateStudentWorkoutVars): void => {
      // Prefixo do aluno → revalida a lista de treinos atribuídos (proStudentWorkoutsKey).
      queryClient.invalidateQueries({
        queryKey: ['professional', 'students', studentId],
      });
    },
  });
}
