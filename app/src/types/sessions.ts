import { z } from 'zod';

const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

// Estado de uma sessão de treino.
export const WorkoutSessionStatusSchema = z.enum([
  'in_progress',
  'completed',
  'completed_partial',
  'abandoned',
]);
export type WorkoutSessionStatus = z.infer<typeof WorkoutSessionStatusSchema>;

// Série executada (logada) dentro de um exercício da sessão.
export const SessionSetSchema = z.object({
  set_index: z.number().int().min(1),
  weight_kg: z.number().nullable(),
  reps_done: z.number().int().nullable(),
  rest_seconds_actual: z.number().int().nullable(),
});
export type SessionSet = z.infer<typeof SessionSetSchema>;

// Exercício dentro de uma sessão (snapshot do prescrito + séries logadas).
export const SessionExerciseSchema = z.object({
  workout_exercise_id: z.string().uuid(),
  completed: z.boolean(),
  completed_at: z.string().nullable(),
  position: z.number().int().positive(),
  wger_exercise_id: z.number().int(),
  name_snapshot: z.string(),
  sets: z.number().int().positive(),
  reps: z.number().int().positive(),
  rest_seconds: z.number().int().nonnegative(),
  notes: z.string().nullable(),
  muscle_group: z.string().nullable(),
  sets_logged: z.array(SessionSetSchema),
});
export type SessionExercise = z.infer<typeof SessionExerciseSchema>;

// Sessão completa — shape REAL de GET /me/workouts/sessions/:id e do retorno
// de todas as mutações (start/finish/log de séries/marcar concluído).
// .passthrough() tolera campos extras opcionais como schedule_hint.
export const WorkoutSessionSchema = z
  .object({
    session: z.object({
      id: z.string().uuid(),
      student_workout_id: z.string().uuid(),
      scheduled_for_date: dateOnly,
      status: WorkoutSessionStatusSchema,
      started_at: z.string(),
      completed_at: z.string().nullable(),
    }),
    exercises: z.array(SessionExerciseSchema),
  })
  .passthrough();
export type WorkoutSession = z.infer<typeof WorkoutSessionSchema>;
