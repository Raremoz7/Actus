import { z } from 'zod';

// TODO Bloco 5: schemas completos de sessões de treino (start/finish, séries executadas, transições).

// Estado de uma sessão de treino.
export const WorkoutSessionStatusSchema = z.enum([
  'in_progress',
  'completed',
  'completed_partial',
  'abandoned',
]);
export type WorkoutSessionStatus = z.infer<typeof WorkoutSessionStatusSchema>;
