import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { api } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { parseApi } from '@/api/parseApi';
import { HealthSchema, type Health } from '@/types/health';

export const healthQueryKey = ['health'] as const;

// GET /health — liveness do backend. Não exige autenticação.
export function useHealth(): UseQueryResult<Health, unknown> {
  return useQuery({
    queryKey: healthQueryKey,
    queryFn: async (): Promise<Health> => {
      const { data } = await api.get(endpoints.health);
      return parseApi(HealthSchema, data);
    },
  });
}
