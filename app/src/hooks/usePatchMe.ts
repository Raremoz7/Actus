import {
  useMutation,
  useQueryClient,
  type UseMutationResult,
} from '@tanstack/react-query';
import { api } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { parseApi } from '@/api/parseApi';
import { MeSchema, PatchMeBodySchema, type Me, type PatchMeBody } from '@/types/me';
import { meQueryKey } from './useMe';

// PATCH /me → atualiza o perfil. O body é validado por PatchMeBodySchema antes do
// request (pelo menos 1 campo). A resposta devolve só a identidade mínima
// ({ id, tipo, display_name } — MeSchema): os demais campos são write-only e não
// voltam em nenhum GET. No sucesso, grava o resultado no cache de meQueryKey e
// invalida para revalidar.
export function usePatchMe(): UseMutationResult<Me, unknown, PatchMeBody> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (body: PatchMeBody): Promise<Me> => {
      const payload = PatchMeBodySchema.parse(body);
      const { data } = await api.patch(endpoints.me.root, payload);
      return parseApi(MeSchema, data);
    },
    onSuccess: (parsed: Me): void => {
      queryClient.setQueryData(meQueryKey, parsed);
      queryClient.invalidateQueries({ queryKey: meQueryKey });
    },
  });
}
