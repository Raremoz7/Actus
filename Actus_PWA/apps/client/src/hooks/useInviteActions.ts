import {
  useMutation,
  useQueryClient,
  type UseMutationResult,
} from '@tanstack/react-query';
import { api } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { parseApi } from '@/api/parseApi';
import { isoInDays } from '@/lib/invite';
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

// Reativar um convite inativo: id + estado de usos (para decidir se precisa
// devolver folga de usos quando esgotado).
export interface ReactivateInviteArgs {
  id: string;
  usedCount: number;
  maxUses: number;
}

export interface InviteActions {
  create: UseMutationResult<CreatedInviteResult, unknown, CreateInviteArgs>;
  revoke: UseMutationResult<void, unknown, string>;
  reactivate: UseMutationResult<void, unknown, ReactivateInviteArgs>;
}

// Validade padrão (dias) ao reativar um convite — decisão de UX "um toque". (TEC-71)
const REACTIVATE_DAYS = 7;

// Mutations de gestão de convites do profissional. Ambas invalidam a lista no
// onSuccess para refletir o novo estado via refetch.
export function useInviteActions(): InviteActions {
  const queryClient = useQueryClient();

  const invalidateList = (): void => {
    queryClient.invalidateQueries({ queryKey: invitesListQueryKey });
  };

  // POST /invites { expires_at, max_uses } → 201 { id, code } (flat).
  const create = useMutation({
    mutationFn: async ({
      expiresAt,
      maxUses,
    }: CreateInviteArgs): Promise<CreatedInviteResult> => {
      const { data } = await api.post(endpoints.invites, {
        expires_at: expiresAt,
        max_uses: maxUses,
      });
      return parseApi(CreatedInviteSchema, data);
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

  // Reativar = PATCH que empurra expires_at para o futuro (agora + N dias). Se o
  // convite ficou inativo por usos ESGOTADOS (used_count >= max_uses), estender a
  // validade não basta — também sobe max_uses devolvendo a folga original
  // (used_count + max_uses), senão continuaria inativo. Instante em ISO completo.
  const reactivate = useMutation({
    mutationFn: async ({ id, usedCount, maxUses }: ReactivateInviteArgs): Promise<void> => {
      const body: { expires_at: string; max_uses?: number } = {
        expires_at: isoInDays(REACTIVATE_DAYS),
      };
      if (usedCount >= maxUses) {
        body.max_uses = usedCount + maxUses;
      }
      await api.patch(`${endpoints.invites}/${id}`, body);
    },
    onSuccess: invalidateList,
  });

  return { create, revoke, reactivate };
}
