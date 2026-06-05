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
