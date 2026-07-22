import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { api } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { parseApi } from '@/api/parseApi';
import { WorkoutSessionSchema, type WorkoutSession } from '@/types/sessions';
import { useAuthStore } from '@/store/authStore';

// Chave de cache da sessão de treino — compartilhada com as mutations,
// que escrevem o payload retornado direto aqui via setQueryData.
export function sessionQueryKey(id: string): readonly ['me', 'workouts', 'session', string] {
  return ['me', 'workouts', 'session', id] as const;
}

// GET /me/workouts/sessions/:id. Só dispara com sessão autenticada e id válido.
export function useSession(sessionId: string): UseQueryResult<WorkoutSession, unknown> {
  const status = useAuthStore((s) => s.status);

  return useQuery({
    queryKey: sessionQueryKey(sessionId),
    queryFn: async (): Promise<WorkoutSession> => {
      const { data } = await api.get(`${endpoints.me.workouts}/sessions/${sessionId}`);
      return parseApi(WorkoutSessionSchema, data);
    },
    enabled: status === 'authenticated' && sessionId.length > 0,
  });
}
