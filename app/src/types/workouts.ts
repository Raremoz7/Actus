import { z } from 'zod';

// TODO Bloco 4: schemas completos de treinos (templates, exercícios, séries, atribuição ao aluno).

// Dia da semana no padrão ISO-8601: 1 = segunda ... 7 = domingo.
export const WeekdaySchema = z.number().int().min(1).max(7);
export type Weekday = z.infer<typeof WeekdaySchema>;

// [Bloco 2] Resumo do treino do dia para o card do HOJE.
// SHAPE A CONFIRMAR no backend (/me/workouts). Detalhe profundo = Bloco 4.
export const TodayWorkoutSummarySchema = z.object({
  has_workout: z.boolean(),
  workout: z
    .object({
      id: z.string().uuid(),
      name: z.string(),
      muscle_groups: z.string(),
      exercise_count: z.number().int().nonnegative(),
      est_minutes: z.number().int().nonnegative(),
    })
    .nullable(),
  next_workout: z
    .object({
      weekday: WeekdaySchema,
      muscle_groups: z.string(),
    })
    .nullable(),
});
export type TodayWorkoutSummary = z.infer<typeof TodayWorkoutSummarySchema>;
