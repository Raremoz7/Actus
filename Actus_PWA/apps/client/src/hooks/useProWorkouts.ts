import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { api } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { parseApi } from '@/api/parseApi';
import { ProWorkoutsResponseSchema, type ProWorkoutsResponse } from '@/types/workouts';
import { useAuthStore } from '@/store/authStore';

// Chave de cache da lista de templates de treino do profissional logado.
export const proWorkoutsQueryKey = ['workouts', 'list'] as const;

// GET /workouts → templates de treino do profissional logado.
// 403 (only_personal) se a sessão não for de um personal; só dispara quando autenticado.
export function useProWorkouts(): UseQueryResult<ProWorkoutsResponse, unknown> {
  const status = useAuthStore((s) => s.status);

  return useQuery({
    queryKey: proWorkoutsQueryKey,
    queryFn: async (): Promise<ProWorkoutsResponse> => {
      const { data } = await api.get(endpoints.workouts);
      return parseApi(ProWorkoutsResponseSchema, data);
    },
    enabled: status === 'authenticated',
  });
}
