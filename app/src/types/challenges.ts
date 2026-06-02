import { z } from 'zod';

// TODO Bloco 7: schemas completos de desafios (ranking, participação, regras, recompensas).

// Identidade mínima de um desafio.
export const ChallengeSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
});
export type Challenge = z.infer<typeof ChallengeSchema>;
