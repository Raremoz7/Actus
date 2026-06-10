import {
  useMutation,
  useQueryClient,
  type UseMutationResult,
} from '@tanstack/react-query';
import { api } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { parseApi } from '@/api/parseApi';
import {
  ConsumeInviteResponseSchema,
  type ConsumeInviteResponse,
} from '@/types/invites';

// POST /invites/consume { code } → vincula o aluno logado a um novo profissional.
// Endpoint REAL. Sucesso invalida ['me'] por prefixo (cobre /me, workouts, diets, weekly).
export function useConsumeInvite(): UseMutationResult<
  ConsumeInviteResponse,
  unknown,
  string
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (code: string): Promise<ConsumeInviteResponse> => {
      const { data } = await api.post(endpoints.invitesConsume, { code: code.trim() });
      return parseApi(ConsumeInviteResponseSchema, data);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['me'] });
    },
  });
}
