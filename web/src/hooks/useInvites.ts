import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import {
  InviteCreateResponseSchema,
  InviteSchema,
  InvitesResponseSchema,
  type Invite,
} from '../lib/schemas';

export function invitesQueryOptions() {
  return {
    queryKey: ['invites'] as const,
    queryFn: async () => {
      const r = await api.get('/invites');
      return InvitesResponseSchema.parse(r.data).invites;
    },
    staleTime: 30_000,
  };
}

export function useInvites() {
  return useQuery(invitesQueryOptions());
}

// Status derivado: a API não tem campo de status — `active` + used_count contam a história.
// Não há revogação nativa: revogar = PATCH expires_at para agora (o convite expira).
// Por isso "revogado" e "expirado" são indistinguíveis depois do fato.
export type InviteStatus = 'pendente' | 'aceito' | 'expirado';

export function deriveInviteStatus(invite: Invite): InviteStatus {
  if (invite.used_count >= invite.max_uses) return 'aceito';
  if (!invite.active) return 'expirado';
  return 'pendente';
}

const DEFAULT_TTL_DAYS = 7;

export function useCreateInvite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const expiresAt = new Date(Date.now() + DEFAULT_TTL_DAYS * 24 * 60 * 60 * 1000);
      const r = await api.post('/invites', {
        expires_at: expiresAt.toISOString(),
        max_uses: 1,
      });
      // POST devolve só { id, code } (invites.ts:128).
      return InviteCreateResponseSchema.parse(r.data);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['invites'] });
    },
  });
}

export function useRevokeInvite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (inviteId: string) => {
      // Revogar = expirar agora. O PATCH devolve o convite completo.
      const r = await api.patch(`/invites/${inviteId}`, {
        expires_at: new Date().toISOString(),
      });
      return InviteSchema.parse(r.data);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['invites'] });
    },
  });
}
