import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { api } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { parseApi } from '@/api/parseApi';
import {
  DietTemplatesResponseSchema,
  type DietTemplatesResponse,
} from '@/types/diets';
import { useAuthStore } from '@/store/authStore';

// Chave de cache da lista de templates de dieta do nutricionista logado.
export const dietTemplatesQueryKey = ['diet-templates', 'list'] as const;

// GET /diet-templates → templates de dieta do nutricionista logado.
// 403 (only_nutritionist) se a sessão não for de um nutricionista; só dispara
// quando autenticado. A lista traz apenas id/name/created_at (sem body).
export function useDietTemplates(): UseQueryResult<DietTemplatesResponse, unknown> {
  const status = useAuthStore((s) => s.status);

  return useQuery({
    queryKey: dietTemplatesQueryKey,
    queryFn: async (): Promise<DietTemplatesResponse> => {
      const { data } = await api.get(endpoints.dietTemplates);
      return parseApi(DietTemplatesResponseSchema, data);
    },
    enabled: status === 'authenticated',
  });
}
