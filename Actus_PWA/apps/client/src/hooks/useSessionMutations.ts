import {
  useMutation,
  useQueryClient,
  type UseMutationResult,
} from '@tanstack/react-query';
import { api } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { parseApi } from '@/api/parseApi';
import {
  WorkoutSessionSchema,
  WorkoutFinishResponseSchema,
  type WorkoutSession,
  type WorkoutFinishResponse,
  type WorkoutFinishSummary,
  type SessionSet,
} from '@/types/sessions';
import { sessionQueryKey } from './useSession';

// Entrada para logar séries de um exercício. weight_kg/reps_done/rest_seconds_actual
// são opcionais — o aluno pode logar parcialmente.
export interface LogSetInput {
  set_index: number;
  weight_kg?: number;
  reps_done?: number;
  rest_seconds_actual?: number;
}

export interface LogSetsVars {
  workoutExerciseId: string;
  sets: LogSetInput[];
}

export interface FinishVars {
  early_finish: boolean;
  with_check_in: boolean;
}

export interface SessionMutations {
  markExercise: UseMutationResult<WorkoutSession, unknown, string>;
  logSets: UseMutationResult<WorkoutSession, unknown, LogSetsVars>;
  // O finish entrega a sessão completa + o `summary` rico (duração, calorias,
  // volume, load_evolution/PR, branding do personal e DTO `share`) para a UI.
  finish: UseMutationResult<WorkoutFinishResponse, unknown, FinishVars>;
}

// Mutations da sessão de treino. Toda resposta é o payload completo da sessão —
// cada onSuccess grava o resultado parseado direto no cache da query da sessão,
// mantendo a tela em sincronia sem refetch.
export function useSessionMutations(sessionId: string): SessionMutations {
  const queryClient = useQueryClient();

  const writeSession = (parsed: WorkoutSession): void => {
    queryClient.setQueryData(sessionQueryKey(sessionId), parsed);
  };

  // PATCH .../exercises/:id { completed: true } → marca exercício como concluído.
  const markExercise = useMutation({
    mutationFn: async (workoutExerciseId: string): Promise<WorkoutSession> => {
      const { data } = await api.patch(
        `${endpoints.me.workouts}/sessions/${sessionId}/exercises/${workoutExerciseId}`,
        { completed: true },
      );
      return parseApi(WorkoutSessionSchema, data);
    },
    onSuccess: writeSession,
  });

  // PUT .../exercises/:id/sets { sets } → loga as séries executadas.
  const logSets = useMutation({
    mutationFn: async ({ workoutExerciseId, sets }: LogSetsVars): Promise<WorkoutSession> => {
      const { data } = await api.put(
        `${endpoints.me.workouts}/sessions/${sessionId}/exercises/${workoutExerciseId}/sets`,
        { sets },
      );
      return parseApi(WorkoutSessionSchema, data);
    },
    onSuccess: writeSession,
  });

  // POST .../finish { early_finish, with_check_in } → finaliza a sessão.
  // A resposta traz a sessão completa + `summary` rico (irmão de session/exercises).
  // Finish grava check-in → afeta o streak; invalida a weekly-overview.
  const finish = useMutation({
    mutationFn: async ({
      early_finish,
      with_check_in,
    }: FinishVars): Promise<WorkoutFinishResponse> => {
      const { data } = await api.post(
        `${endpoints.me.workouts}/sessions/${sessionId}/finish`,
        { early_finish, with_check_in },
      );
      return parseApi(WorkoutFinishResponseSchema, data);
    },
    onSuccess: (parsed: WorkoutFinishResponse): void => {
      // O cache da sessão guarda só a sessão (sem o summary efêmero); a UI lê o
      // summary do resultado do mutation (mutation.data.summary).
      writeSession(parsed);
      // Finish grava check-in (streak) e conclui o treino do dia: revalida a
      // visão da semana e tudo de /me/workouts (lista + treino do dia/last_completed).
      queryClient.invalidateQueries({ queryKey: ['me', 'weekly-overview'] });
      queryClient.invalidateQueries({ queryKey: ['me', 'workouts'] });
      // Finish pode conceder badges → revalida lista de badges e o badge
      // ['me','badges','unseen'] (coberto por prefixo).
      queryClient.invalidateQueries({ queryKey: ['me', 'badges'] });
    },
  });

  return { markExercise, logSets, finish };
}

export type { SessionSet, WorkoutFinishResponse, WorkoutFinishSummary };
