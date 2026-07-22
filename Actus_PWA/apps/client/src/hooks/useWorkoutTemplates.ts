import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';

import { api } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { parseApi } from '@/api/parseApi';
import { useAuthStore } from '@/store/authStore';
import {
  WorkoutTemplatesResponseSchema,
  WorkoutTemplateDetailSchema,
  CopiedWorkoutSchema,
  type WorkoutTemplatesResponse,
  type WorkoutTemplateDetail,
  type CopiedWorkout,
} from '@/types/workoutTemplates';
import { proWorkoutsQueryKey } from './useProWorkouts';

// Chaves de cache do Banco de Treinos curado.
export const workoutTemplatesListQueryKey = ['workout-templates', 'list'] as const;
export const workoutTemplateDetailQueryKey = (id: string) =>
  ['workout-templates', 'detail', id] as const;

// GET /workout-templates — lista de templates curados (todos os autenticados).
export function useWorkoutTemplates(): UseQueryResult<WorkoutTemplatesResponse, unknown> {
  const status = useAuthStore((s) => s.status);

  return useQuery({
    queryKey: workoutTemplatesListQueryKey,
    queryFn: async (): Promise<WorkoutTemplatesResponse> => {
      const { data } = await api.get(endpoints.workoutTemplates);
      return parseApi(WorkoutTemplatesResponseSchema, data);
    },
    enabled: status === 'authenticated',
  });
}

// GET /workout-templates/:id — detalhe com os exercícios.
export function useWorkoutTemplateDetail(
  id: string | undefined,
): UseQueryResult<WorkoutTemplateDetail, unknown> {
  const status = useAuthStore((s) => s.status);

  return useQuery({
    queryKey: workoutTemplateDetailQueryKey(id ?? ''),
    queryFn: async (): Promise<WorkoutTemplateDetail> => {
      const { data } = await api.get(endpoints.workoutTemplateById(id as string));
      return parseApi(WorkoutTemplateDetailSchema, data);
    },
    enabled: status === 'authenticated' && !!id,
  });
}

// POST /workout-templates/:id/copy — personal clona o template para a própria
// biblioteca (cria um workout no servidor) e recebe o workout_id. Invalida a
// lista "Meus treinos" para o novo aparecer.
export function useCopyWorkoutTemplate(): UseMutationResult<CopiedWorkout, unknown, string> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (templateId: string): Promise<CopiedWorkout> => {
      const { data } = await api.post(endpoints.workoutTemplateCopy(templateId));
      return parseApi(CopiedWorkoutSchema, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: proWorkoutsQueryKey });
    },
  });
}
