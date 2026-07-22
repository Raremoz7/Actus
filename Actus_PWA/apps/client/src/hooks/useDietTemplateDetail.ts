import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { api } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { parseApi } from '@/api/parseApi';
import { DietTemplateDetailSchema, type DietTemplateDetail } from '@/types/diets';
import { useAuthStore } from '@/store/authStore';

// Chave de cache do detalhe de um template de dieta do nutricionista.
export function dietTemplateDetailQueryKey(dietTemplateId: string) {
  return ['diet-templates', 'detail', dietTemplateId] as const;
}

// GET /diet-templates/:id → detalhe do template (FLAT { id, name, body, created_at }).
// Verificado no backend: retorna o objeto direto (não embrulhado em { template }).
// `body` é jsonb LIVRE — use parseDietBody() para obter a forma estruturada.
// Só dispara quando autenticado e com dietTemplateId presente.
export function useDietTemplateDetail(
  dietTemplateId: string | undefined,
): UseQueryResult<DietTemplateDetail, unknown> {
  const status = useAuthStore((s) => s.status);

  return useQuery({
    queryKey: dietTemplateDetailQueryKey(dietTemplateId ?? ''),
    queryFn: async (): Promise<DietTemplateDetail> => {
      const { data } = await api.get(
        `${endpoints.dietTemplates}/${dietTemplateId as string}`,
      );
      return parseApi(DietTemplateDetailSchema, data);
    },
    enabled: status === 'authenticated' && Boolean(dietTemplateId),
  });
}
