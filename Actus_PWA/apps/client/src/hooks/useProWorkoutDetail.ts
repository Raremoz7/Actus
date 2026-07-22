import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { api } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { parseApi } from '@/api/parseApi';
import { ProWorkoutDetailSchema, type ProWorkoutDetail } from '@/types/workouts';
import { useAuthStore } from '@/store/authStore';

// Chave de cache do detalhe de um template de treino do profissional.
export function proWorkoutDetailQueryKey(workoutId: string) {
  return ['workouts', 'detail', workoutId] as const;
}

// GET /workouts/:id → detalhe do template (workout FLAT com exercises).
// Verificado no backend: retorna o objeto do workout direto (não embrulhado em { workout }).
// Só dispara quando autenticado e com workoutId presente.
export function useProWorkoutDetail(
  workoutId: string | undefined,
): UseQueryResult<ProWorkoutDetail, unknown> {
  const status = useAuthStore((s) => s.status);

  return useQuery({
    queryKey: proWorkoutDetailQueryKey(workoutId ?? ''),
    queryFn: async (): Promise<ProWorkoutDetail> => {
      const { data } = await api.get(`${endpoints.workouts}/${workoutId as string}`);
      return parseApi(ProWorkoutDetailSchema, data);
    },
    enabled: status === 'authenticated' && Boolean(workoutId),
  });
}
