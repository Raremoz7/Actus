import { z } from 'zod';

// TODO Bloco 7: schemas completos de desafios (ranking, participação, regras, recompensas).

// Identidade mínima de um desafio.
export const ChallengeSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
});
export type Challenge = z.infer<typeof ChallengeSchema>;

// [Bloco 2] Teaser de desafio ativo para o card do HOJE. Detalhe = Bloco 7.
// SHAPE A CONFIRMAR no backend (/me/challenges).
export const ChallengeTeaserSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  progress_current: z.number().int().nonnegative(),
  progress_total: z.number().int().positive(),
});
export type ChallengeTeaser = z.infer<typeof ChallengeTeaserSchema>;
