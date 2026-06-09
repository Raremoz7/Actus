import { useMutation, type UseMutationResult } from '@tanstack/react-query';
import { api } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { parseApi } from '@/api/parseApi';
import { InvitePreviewSchema } from '@/types/invites';

// Valida um código de convite ANTES de criar a conta (passo 1 do cadastro), via
// GET /invites/:code/preview. Sucesso → resolve; convite inválido/expirado/esgotado →
// rejeita com ApiError(code). Se o endpoint ainda não existir no backend (está pendente),
// a tela degrada com elegância: segue o fluxo e o register (passo 3) valida como antes.
export function useInvitePreview(): UseMutationResult<void, unknown, string> {
  return useMutation({
    mutationFn: async (code: string): Promise<void> => {
      const { data } = await api.get(endpoints.invitePreview(code));
      parseApi(InvitePreviewSchema, data);
    },
  });
}
