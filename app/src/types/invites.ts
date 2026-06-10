import { z } from 'zod';

// Resposta ao consumir um convite (aluno vinculando-se a um profissional).
// note opcional indica que o vínculo já existia. passthrough() preserva campos extras.
export const ConsumeInviteResponseSchema = z
  .object({
    ok: z.literal(true),
    professional_id: z.string().uuid(),
    professional_role: z.enum(['personal', 'nutricionista']),
    note: z.literal('already_linked').optional(),
  })
  .passthrough();

export type ConsumeInviteResponse = z.infer<typeof ConsumeInviteResponseSchema>;

// --- Lado profissional: gestão de convites (GET/POST/PATCH /invites) ---

// Convite emitido pelo profissional — shape REAL de GET /invites.
// active = derivado no backend (não expirado E used_count < max_uses).
// expires_at/created_at são TIMESTAMPS (instante, ISO completo com hora).
export const ProInviteSchema = z.object({
  id: z.string().uuid(),
  code: z.string(),
  expires_at: z.string(),
  max_uses: z.number().int().min(1),
  used_count: z.number().int().min(0),
  created_at: z.string(),
  active: z.boolean(),
});
export type ProInvite = z.infer<typeof ProInviteSchema>;

// Resposta de GET /invites.
export const InvitesResponseSchema = z.object({
  invites: z.array(ProInviteSchema),
});
export type InvitesResponse = z.infer<typeof InvitesResponseSchema>;

// Resposta de POST /invites — o backend devolve o convite recém-criado FLAT
// (201 com { id, code }, sem wrapper).
export const CreatedInviteSchema = z.object({
  id: z.string().uuid(),
  code: z.string(),
});
export type CreatedInvite = z.infer<typeof CreatedInviteSchema>;

// Resposta de GET /invites/:code/preview — valida o código no passo 1 do cadastro.
// Mínimo necessário (só sinaliza que o convite é válido); passthrough preserva campos
// futuros (ex.: nome do convidador, quando o backend implementar o endpoint).
export const InvitePreviewSchema = z.object({ ok: z.literal(true) }).passthrough();
export type InvitePreview = z.infer<typeof InvitePreviewSchema>;
