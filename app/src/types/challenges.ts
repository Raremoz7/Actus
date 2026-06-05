import { z } from 'zod';

// Data no formato YYYY-MM-DD (string + regex, nunca z.date()).
const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

// ── Shapes REAIS (verificados no backend) ───────────────────────────────────

// Identidade completa de um desafio — shape REAL de GET /me/challenges.
// A lista NÃO traz progresso numérico: derive "dia X de Y" das datas
// (starts_on..ends_on vs hoje LOCAL).
export const ChallengeSchema = z.object({
  id: z.string().uuid(),
  owner_professional_id: z.string().uuid(),
  name: z.string(),
  starts_on: dateOnly,
  ends_on: dateOnly,
  visibility: z.enum(['private_ranking', 'public_among_participants']),
  status: z.enum(['draft', 'active', 'ended']),
  created_at: z.string(),
  updated_at: z.string(),
});
export type Challenge = z.infer<typeof ChallengeSchema>;

// Item da lista — desafio + status do participante (convidado ou ativo).
export const ChallengeListItemSchema = z.object({
  challenge: ChallengeSchema,
  participant_status: z.enum(['invited', 'active']),
});
export type ChallengeListItem = z.infer<typeof ChallengeListItemSchema>;

// Resposta de GET /me/challenges.
export const ChallengesResponseSchema = z.object({
  challenges: z.array(ChallengeListItemSchema),
});
export type ChallengesResponse = z.infer<typeof ChallengesResponseSchema>;

// Linha do ranking — shape REAL de GET /me/challenges/:id/ranking.
export const RankingRowSchema = z.object({
  position: z.number().int(),
  student_id: z.string().uuid(),
  display_name: z.string().nullable(),
  streak_current_in_challenge: z.number().int().nonnegative(),
  active_days: z.number().int().nonnegative(),
});
export type RankingRow = z.infer<typeof RankingRowSchema>;

// Resposta de GET /me/challenges/:id/ranking.
// Só funciona p/ visibility 'public_among_participants' E participante 'active'
// — senão 403 (ranking_private / forbidden_not_participant).
export const RankingResponseSchema = z
  .object({
    visibility: z.enum(['private_ranking', 'public_among_participants']),
    ranking: z.array(RankingRowSchema),
  })
  .passthrough();
export type RankingResponse = z.infer<typeof RankingResponseSchema>;

// ── Shapes REAIS — visão do PROFISSIONAL (/professional/challenges) ──────────

// GET /professional/challenges → { challenges: [ChallengeSchema...] }.
// A lista REAL não traz participant_count (confirmado no backend).
export const ProChallengesResponseSchema = z.object({
  challenges: z.array(ChallengeSchema),
});
export type ProChallengesResponse = z.infer<typeof ProChallengesResponseSchema>;

// Participante no detalhe — shape REAL de GET /professional/challenges/:id.
export const ProChallengeParticipantSchema = z.object({
  student_id: z.string().uuid(),
  status: z.enum(['invited', 'active', 'declined']),
  display_name: z.string().nullable(),
  invited_at: z.string(),
  responded_at: z.string().nullable(),
});
export type ProChallengeParticipant = z.infer<
  typeof ProChallengeParticipantSchema
>;

// GET /professional/challenges/:id → { challenge, participants }.
export const ProChallengeDetailSchema = z
  .object({
    challenge: ChallengeSchema,
    participants: z.array(ProChallengeParticipantSchema),
  })
  .passthrough();
export type ProChallengeDetail = z.infer<typeof ProChallengeDetailSchema>;

// Body de POST /professional/challenges (criar desafio).
// status só aceita 'draft' | 'active' na criação (publicar 'active' direto).
// Encerrar ('ended') é via PATCH. Valida ends_on >= starts_on.
export const CreateChallengeBodySchema = z
  .object({
    name: z.string().min(1),
    starts_on: dateOnly,
    ends_on: dateOnly,
    visibility: z
      .enum(['private_ranking', 'public_among_participants'])
      .optional(),
    status: z.enum(['draft', 'active']).optional(),
  })
  .refine((b) => b.ends_on >= b.starts_on, {
    message: 'ends_on deve ser >= starts_on',
    path: ['ends_on'],
  });
export type CreateChallengeBody = z.infer<typeof CreateChallengeBodySchema>;

// Body de PATCH /professional/challenges/:id (editar / publicar / encerrar).
// Todos os campos opcionais; status aceita 'ended' (encerrar) além de draft/active.
// Quando ambas as datas vêm juntas, valida ends_on >= starts_on (o backend
// também revalida contra o valor atual quando só uma das datas muda).
export const PatchChallengeBodySchema = z
  .object({
    name: z.string().min(1).optional(),
    starts_on: dateOnly.optional(),
    ends_on: dateOnly.optional(),
    visibility: z
      .enum(['private_ranking', 'public_among_participants'])
      .optional(),
    status: z.enum(['draft', 'active', 'ended']).optional(),
  })
  .refine(
    (b) =>
      b.starts_on === undefined ||
      b.ends_on === undefined ||
      b.ends_on >= b.starts_on,
    { message: 'ends_on deve ser >= starts_on', path: ['ends_on'] },
  );
export type PatchChallengeBody = z.infer<typeof PatchChallengeBodySchema>;

// Resposta REAL de POST e PATCH /professional/challenges[/:id] → { challenge }.
// O backend embrulha o desafio criado/atualizado em { challenge: ChallengeSchema }.
export const ChallengeMutationResponseSchema = z.object({
  challenge: ChallengeSchema,
});
export type ChallengeMutationResponse = z.infer<
  typeof ChallengeMutationResponseSchema
>;

// Body de POST /professional/challenges/:id/participants.
export const AddParticipantsBodySchema = z.object({
  student_ids: z.array(z.string().uuid()).min(1),
});
export type AddParticipantsBody = z.infer<typeof AddParticipantsBodySchema>;

// Resposta REAL de POST /professional/challenges/:id/participants → { invited_count }.
export const AddParticipantsResponseSchema = z.object({
  invited_count: z.number().int().nonnegative(),
});
export type AddParticipantsResponse = z.infer<
  typeof AddParticipantsResponseSchema
>;

// ── Teaser FICTÍCIO do HOJE (Bloco 2) ───────────────────────────────────────

// [Bloco 2] Teaser de desafio ativo para o card do HOJE. Detalhe = Bloco 7.
// SHAPE A CONFIRMAR no backend (/me/challenges).
export const ChallengeTeaserSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  progress_current: z.number().int().nonnegative(),
  progress_total: z.number().int().positive(),
});
export type ChallengeTeaser = z.infer<typeof ChallengeTeaserSchema>;
