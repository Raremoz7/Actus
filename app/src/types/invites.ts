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
