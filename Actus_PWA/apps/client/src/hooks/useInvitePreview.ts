import { useMutation, type UseMutationResult } from '@tanstack/react-query';
import { api } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { parseApi } from '@/api/parseApi';
import { InvitePreviewSchema, type InvitePreview } from '@/types/invites';

// Valida um código de convite ANTES de criar a conta (passo 1 do cadastro), via
// GET /invites/:code/preview. Sucesso → resolve com o preview (inclui o convidador, quando
// o backend devolve); inválido/expirado/esgotado → rejeita com ApiError(code). Se o endpoint
// não existir, degrada: segue o fluxo e o register (passo 3) valida como antes.
export function useInvitePreview(): UseMutationResult<InvitePreview, unknown, string> {
  return useMutation({
    mutationFn: async (code: string): Promise<InvitePreview> => {
      const { data } = await api.get(endpoints.invitePreview(code));
      return parseApi(InvitePreviewSchema, data);
    },
  });
}
