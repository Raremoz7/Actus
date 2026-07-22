import {
  useMutation,
  useQueryClient,
  type UseMutationResult,
} from '@tanstack/react-query';
import { api } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { parseApi } from '@/api/parseApi';
import {
  CreateWorkoutResponseSchema,
  ProWorkoutDetailSchema,
  type CreateWorkoutBody,
  type CreateWorkoutResponse,
  type PatchWorkoutBody,
  type ProWorkoutDetail,
} from '@/types/workouts';
import { proWorkoutsQueryKey } from './useProWorkouts';
import { proWorkoutDetailQueryKey } from './useProWorkoutDetail';

export interface UpdateWorkoutVars {
  id: string;
  body: PatchWorkoutBody;
}

export interface WorkoutMutations {
  // POST /workouts → cria template. Resposta: { ok, workout_id }.
  create: UseMutationResult<CreateWorkoutResponse, unknown, CreateWorkoutBody>;
  // PATCH /workouts/:id → atualiza template (exercises = full replace). Resposta: detalhe completo.
  update: UseMutationResult<ProWorkoutDetail, unknown, UpdateWorkoutVars>;
}

// Mutations dos templates de treino do profissional.
// NOTA WGER: a API exige `wger_exercise_id` (int>=1) e NÃO há busca de catálogo
// Wger na v1. A UI envia os exercícios como formulário manual (nome digitado em
// `name_snapshot`) usando `wger_exercise_id: 1` como placeholder.
// [MOCK — sem busca Wger na API v1: id placeholder; nome digitado manualmente]
export function useWorkoutMutations(): WorkoutMutations {
  const queryClient = useQueryClient();

  // POST /workouts → 201 { ok: true, workout_id }.
  const create = useMutation({
    mutationFn: async (body: CreateWorkoutBody): Promise<CreateWorkoutResponse> => {
      const { data } = await api.post(endpoints.workouts, body);
      return parseApi(CreateWorkoutResponseSchema, data);
    },
    onSuccess: (): void => {
      // Novo template entra na lista do profissional.
      queryClient.invalidateQueries({ queryKey: proWorkoutsQueryKey });
    },
  });

  // PATCH /workouts/:id → 200 detalhe completo (workout FLAT com exercises).
  const update = useMutation({
    mutationFn: async ({ id, body }: UpdateWorkoutVars): Promise<ProWorkoutDetail> => {
      const { data } = await api.patch(`${endpoints.workouts}/${id}`, body);
      return parseApi(ProWorkoutDetailSchema, data);
    },
    onSuccess: (detail: ProWorkoutDetail, { id }: UpdateWorkoutVars): void => {
      // Grava o detalhe retornado no cache (sem refetch) e revalida a lista
      // (nome / exercise_count podem ter mudado).
      queryClient.setQueryData(proWorkoutDetailQueryKey(id), detail);
      queryClient.invalidateQueries({ queryKey: proWorkoutsQueryKey });
    },
  });

  return { create, update };
}
