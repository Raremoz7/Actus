import {
  useMutation,
  useQueryClient,
  type UseMutationResult,
} from '@tanstack/react-query';
import { api } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { parseApi } from '@/api/parseApi';
import { CreatedInviteSchema } from '@/types/invites';
import { invitesListQueryKey } from './useInvites';

// Argumentos para criar um convite.
// expiresAt: instante de expiração em ISO 8601 completo (TIMESTAMP, com hora) —
//   a tela calcula (agora + N dias) usando o relógio do dispositivo.
// maxUses: número máximo de usos (>= 1).
export interface CreateInviteArgs {
  expiresAt: string;
  maxUses: number;
}

// Resultado de create — só id + code. A tela usa o code para montar o deep link
// (actus://register?code=<code>) e compartilhar.
export interface CreatedInviteResult {
  id: string;
  code: string;
}

export interface InviteActions {
  create: UseMutationResult<CreatedInviteResult, unknown, CreateInviteArgs>;
  revoke: UseMutationResult<void, unknown, string>;
}

// Mutations de gestão de convites do profissional. Ambas invalidam a lista no
// onSuccess para refletir o novo estado via refetch.
export function useInviteActions(): InviteActions {
  const queryClient = useQueryClient();

  const invalidateList = (): void => {
    queryClient.invalidateQueries({ queryKey: invitesListQueryKey });
  };

  // POST /invites { expires_at, max_uses } → { invite: { id, code } }.
  const create = useMutation({
    mutationFn: async ({
      expiresAt,
      maxUses,
    }: CreateInviteArgs): Promise<CreatedInviteResult> => {
      const { data } = await api.post(endpoints.invites, {
        expires_at: expiresAt,
        max_uses: maxUses,
      });
      const parsed = parseApi(CreatedInviteSchema, data);
      return parsed.invite;
    },
    onSuccess: invalidateList,
  });

  // Não há DELETE → "revogar" = PATCH /invites/:id { expires_at: <agora> }.
  // Expira imediatamente (active vira false). Instante em ISO completo, relógio
  // do dispositivo.
  const revoke = useMutation({
    mutationFn: async (inviteId: string): Promise<void> => {
      await api.patch(`${endpoints.invites}/${inviteId}`, {
        expires_at: new Date().toISOString(),
      });
    },
    onSuccess: invalidateList,
  });

  return { create, revoke };
}
