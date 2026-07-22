import { useMutation, type UseMutationResult } from '@tanstack/react-query';
import { api } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { parseApi } from '@/api/parseApi';
import { formatDateLocal } from '@/lib/format';
import { WorkoutSessionSchema, type WorkoutSession } from '@/types/sessions';

// POST /me/workouts/:studentWorkoutId/sessions → cria (ou retoma) a sessão do dia.
// scheduled_for_date é HOJE no fuso LOCAL (formatDateLocal) — nunca toISOString,
// que viraria o dia em UTC-3. A tela usa session.id para navegar.
export function useCreateSession(): UseMutationResult<WorkoutSession, unknown, string> {
  return useMutation({
    mutationFn: async (studentWorkoutId: string): Promise<WorkoutSession> => {
      const scheduled_for_date = formatDateLocal(new Date());
      const { data } = await api.post(
        `${endpoints.me.workouts}/${studentWorkoutId}/sessions`,
        { scheduled_for_date },
      );
      return parseApi(WorkoutSessionSchema, data);
    },
  });
}
