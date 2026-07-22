import {
  useMutation,
  useQueryClient,
  type UseMutationResult,
} from '@tanstack/react-query';
import { api } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { parseApi } from '@/api/parseApi';
import {
  CreateDietResponseSchema,
  DietTemplateDetailSchema,
  type CreateDietBody,
  type CreateDietResponse,
  type DietTemplateDetail,
  type PatchDietBody,
} from '@/types/diets';
import { dietTemplatesQueryKey } from './useDietTemplates';
import { dietTemplateDetailQueryKey } from './useDietTemplateDetail';

export interface UpdateDietVars {
  id: string;
  body: PatchDietBody;
}

export interface DietMutations {
  // POST /diet-templates → cria template. Resposta: { ok, diet_template_id }.
  create: UseMutationResult<CreateDietResponse, unknown, CreateDietBody>;
  // PATCH /diet-templates/:id → atualiza template (patch parcial). Resposta: detalhe FLAT completo.
  update: UseMutationResult<DietTemplateDetail, unknown, UpdateDietVars>;
}

// Mutations dos templates de dieta do nutricionista.
// O `body` é jsonb LIVRE no backend — a forma é definida/validada PELO APP
// (DietBodySchema): { meals: [{ name, foods?, kcal?, protein?, carbs?, fat? }], notes? }.
export function useDietMutations(): DietMutations {
  const queryClient = useQueryClient();

  // POST /diet-templates → 201 { ok: true, diet_template_id }.
  const create = useMutation({
    mutationFn: async (body: CreateDietBody): Promise<CreateDietResponse> => {
      const { data } = await api.post(endpoints.dietTemplates, body);
      return parseApi(CreateDietResponseSchema, data);
    },
    onSuccess: (): void => {
      // Novo template entra na lista do nutricionista.
      queryClient.invalidateQueries({ queryKey: dietTemplatesQueryKey });
    },
  });

  // PATCH /diet-templates/:id → 200 detalhe FLAT completo ({ id, name, body, created_at }).
  const update = useMutation({
    mutationFn: async ({ id, body }: UpdateDietVars): Promise<DietTemplateDetail> => {
      const { data } = await api.patch(`${endpoints.dietTemplates}/${id}`, body);
      return parseApi(DietTemplateDetailSchema, data);
    },
    onSuccess: (detail: DietTemplateDetail, { id }: UpdateDietVars): void => {
      // Grava o detalhe retornado no cache (sem refetch) e revalida a lista
      // (o nome pode ter mudado).
      queryClient.setQueryData(dietTemplateDetailQueryKey(id), detail);
      queryClient.invalidateQueries({ queryKey: dietTemplatesQueryKey });
    },
  });

  return { create, update };
}
