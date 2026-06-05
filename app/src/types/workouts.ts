import { z } from 'zod';

// TODO Bloco 4: schemas completos de treinos (templates, exercícios, séries, atribuição ao aluno).

// Dia da semana no padrão ISO-8601: 1 = segunda ... 7 = domingo.
export const WeekdaySchema = z.number().int().min(1).max(7);
export type Weekday = z.infer<typeof WeekdaySchema>;

const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

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

// [Bloco Treinos] Item da lista — shape REAL de GET /me/workouts.
export const StudentWorkoutSchema = z.object({
  id: z.string().uuid(),
  student_id: z.string().uuid(),
  workout_id: z.string().uuid(),
  weekdays: z.array(WeekdaySchema).min(1),
  start_date: dateOnly,
  end_date: dateOnly.nullable(),
  display_order: z.number().int(),
  is_active: z.boolean(),
  created_at: z.string(),
  workout_name: z.string(),
  workout_notes: z.string().nullable(),
  exercise_count: z.number().int().nonnegative(),
  last_completed_date: dateOnly.nullable(),
});
export type StudentWorkout = z.infer<typeof StudentWorkoutSchema>;

export const StudentWorkoutsResponseSchema = z.object({
  student_workouts: z.array(StudentWorkoutSchema),
});
export type StudentWorkoutsResponse = z.infer<typeof StudentWorkoutsResponseSchema>;

// [Bloco Treinos] Detalhe — shape REAL de GET /me/workouts/:id.
export const WorkoutExerciseSchema = z.object({
  id: z.string().uuid(),
  position: z.number().int().positive(),
  wger_exercise_id: z.number().int(),
  name_snapshot: z.string(),
  sets: z.number().int().positive(),
  reps: z.number().int().positive(),
  rest_seconds: z.number().int().nonnegative(),
  notes: z.string().nullable(),
  muscle_group: z.string().nullable(),
});
export type WorkoutExercise = z.infer<typeof WorkoutExerciseSchema>;

export const WorkoutDetailSchema = z.object({
  assignment: z.object({
    id: z.string().uuid(),
    workout_id: z.string().uuid(),
    weekdays: z.array(WeekdaySchema).min(1),
    start_date: dateOnly,
    end_date: dateOnly.nullable(),
    display_order: z.number().int(),
    is_active: z.boolean(),
    created_at: z.string(),
  }),
  workout: z.object({
    id: z.string().uuid(),
    name: z.string(),
    notes: z.string().nullable(),
    exercises: z.array(WorkoutExerciseSchema),
  }),
  recent_sessions: z.array(
    z.object({
      id: z.string().uuid(),
      scheduled_for_date: dateOnly,
      status: z.string(),
      started_at: z.string(),
      completed_at: z.string().nullable(),
    }),
  ),
});
export type WorkoutDetail = z.infer<typeof WorkoutDetailSchema>;
