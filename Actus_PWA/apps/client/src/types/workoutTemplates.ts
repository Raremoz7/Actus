import { z } from 'zod';

// Banco de Treinos curado — contrato de GET /workout-templates (admin cria no web,
// todos os autenticados leem). Espelha backend/api/src/routes/workoutTemplates.ts.

// Item da lista: nome + notas + contagem de exercícios.
export const WorkoutTemplateSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  notes: z.string().nullable(),
  created_at: z.string(),
  exercise_count: z.number(),
});
export type WorkoutTemplateSummary = z.infer<typeof WorkoutTemplateSummarySchema>;

export const WorkoutTemplatesResponseSchema = z.object({
  templates: z.array(WorkoutTemplateSummarySchema),
});
export type WorkoutTemplatesResponse = z.infer<typeof WorkoutTemplatesResponseSchema>;

// Exercício do template (snapshot de nome + prescrição). exercise_id (catálogo
// PT-BR) e/ou wger_exercise_id (legado) — ao menos um presente.
export const WorkoutTemplateExerciseSchema = z.object({
  id: z.string(),
  position: z.number(),
  exercise_id: z.string().nullable(),
  wger_exercise_id: z.number().nullable(),
  name_snapshot: z.string(),
  sets: z.number(),
  reps: z.number(),
  rest_seconds: z.number(),
  notes: z.string().nullable(),
  muscle_group: z.string().nullable(),
});
export type WorkoutTemplateExercise = z.infer<typeof WorkoutTemplateExerciseSchema>;

// Detalhe de GET /workout-templates/:id.
export const WorkoutTemplateDetailSchema = z.object({
  id: z.string(),
  name: z.string(),
  notes: z.string().nullable(),
  created_at: z.string(),
  exercises: z.array(WorkoutTemplateExerciseSchema),
});
export type WorkoutTemplateDetail = z.infer<typeof WorkoutTemplateDetailSchema>;

// Resposta de POST /workout-templates/:id/copy → id do workout clonado.
export const CopiedWorkoutSchema = z.object({
  workout_id: z.string(),
});
export type CopiedWorkout = z.infer<typeof CopiedWorkoutSchema>;
