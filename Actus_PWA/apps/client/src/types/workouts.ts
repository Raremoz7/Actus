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

// [Pro] Treinos atribuídos a UM aluno, vistos pelo profissional —
// CONTRATO PROPOSTO de GET /students/:student_id/workouts. O backend v1 ainda NÃO
// expõe este GET (só POST/PATCH); a forma espelha /me/student/workouts para o time do
// backend implementar de forma consistente. Enquanto não existir, a lista vem vazia.
export const ProStudentWorkoutsResponseSchema = StudentWorkoutsResponseSchema;
export type ProStudentWorkoutsResponse = StudentWorkoutsResponse;

// [Bloco Treinos] Detalhe — shape REAL de GET /me/workouts/:id.
export const WorkoutExerciseSchema = z.object({
  id: z.string().uuid(),
  position: z.number().int().positive(),
  wger_exercise_id: z.number().int().nullable().optional(),
  exercise_id: z.string().nullable().optional(),
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

// ── Visão do PROFISSIONAL (templates de treino) ────────────────────────────
// Shapes REAIS verificados no backend: api/src/routes/workouts.ts.

// [Pro] Item da lista — GET /workouts → { workouts: [...] } (templates do
// profissional logado). `exercise_count` já vem como int (Number() no backend);
// `created_at` é ISO string.
export const ProWorkoutListItemSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  notes: z.string().nullable(),
  exercise_count: z.number().int().nonnegative(),
  created_at: z.string(),
});
export type ProWorkoutListItem = z.infer<typeof ProWorkoutListItemSchema>;

export const ProWorkoutsResponseSchema = z.object({
  workouts: z.array(ProWorkoutListItemSchema),
});
export type ProWorkoutsResponse = z.infer<typeof ProWorkoutsResponseSchema>;

// [Pro] Exercício de um template — GET /workouts/:id.
export const ProWorkoutExerciseSchema = z.object({
  id: z.string().uuid(),
  position: z.number().int().positive(),
  exercise_id: z.string().nullable().optional(),
  wger_exercise_id: z.number().int().nullable().optional(),
  name_snapshot: z.string(),
  sets: z.number().int().positive(),
  reps: z.number().int().positive(),
  rest_seconds: z.number().int().nonnegative(),
  notes: z.string().nullable(),
  muscle_group: z.string().nullable(),
});
export type ProWorkoutExercise = z.infer<typeof ProWorkoutExerciseSchema>;

// [Pro] Detalhe do template — GET /workouts/:id retorna o workout FLAT
// (res.json(out.workout)), NÃO embrulhado em { workout: {...} }, e inclui
// `created_at`. Verificado em api/src/routes/workouts.ts (router.get("/:workout_id")).
export const ProWorkoutDetailSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  notes: z.string().nullable(),
  created_at: z.string(),
  exercises: z.array(ProWorkoutExerciseSchema),
});
export type ProWorkoutDetail = z.infer<typeof ProWorkoutDetailSchema>;

// [Pro] Corpo de atribuição — POST /students/:student_id/workouts.
// Verificado em api/src/routes/studentWorkouts.ts (assignWorkoutSchema).
export const AssignWorkoutBodySchema = z.object({
  workout_id: z.string().uuid(),
  weekdays: z.array(WeekdaySchema).min(1),
  start_date: dateOnly.optional(),
  end_date: dateOnly.optional(),
  display_order: z.number().int().optional(),
  is_active: z.boolean().optional(),
});
export type AssignWorkoutBody = z.infer<typeof AssignWorkoutBodySchema>;

// [Pro] Corpo de criação de template — POST /workouts.
// Aceita exercise_id (novo banco) ou wger_exercise_id legado — pelo menos um obrigatório.
export const CreateWorkoutExerciseSchema = z
  .object({
    position: z.number().int().min(1),
    exercise_id: z.string().min(1).max(200).optional().nullable(),
    wger_exercise_id: z.number().int().min(1).optional().nullable(),
    name_snapshot: z.string().min(1).max(200),
    sets: z.number().int().min(1).max(50).default(3),
    reps: z.number().int().min(1).max(500).default(10),
    rest_seconds: z.number().int().min(0).max(3600).default(60),
    notes: z.string().max(2000).optional(),
    muscle_group: z.string().min(1).max(80).optional().nullable(),
  })
  .refine((d) => d.exercise_id != null || d.wger_exercise_id != null, {
    message: 'exercise_id or wger_exercise_id is required',
  });
export type CreateWorkoutExercise = z.infer<typeof CreateWorkoutExerciseSchema>;

export const CreateWorkoutBodySchema = z.object({
  name: z.string().min(1).max(200),
  notes: z.string().max(5000).optional(),
  exercises: z.array(CreateWorkoutExerciseSchema).min(1).max(200),
});
export type CreateWorkoutBody = z.infer<typeof CreateWorkoutBodySchema>;

// PATCH /workouts/:id — patch parcial; `exercises` é FULL REPLACE quando enviado.
export const PatchWorkoutBodySchema = z
  .object({
    name: z.string().min(1).max(200).optional(),
    notes: z.string().max(5000).nullable().optional(),
    exercises: z.array(CreateWorkoutExerciseSchema).min(1).max(200).optional(),
  })
  .refine((o) => o.name !== undefined || o.notes !== undefined || o.exercises !== undefined, {
    message: 'empty_patch',
  });
export type PatchWorkoutBody = z.infer<typeof PatchWorkoutBodySchema>;

// [Pro] Resposta de POST /workouts → 201 { ok: true, workout_id }.
// Verificado em api/src/routes/workouts.ts (res.status(201).json(out)).
export const CreateWorkoutResponseSchema = z.object({
  ok: z.literal(true),
  workout_id: z.string().uuid(),
});
export type CreateWorkoutResponse = z.infer<typeof CreateWorkoutResponseSchema>;

// [Pro] Resposta de POST /students/:id/workouts → 201 { ok: true, student_workout_id }.
// Verificado em api/src/routes/studentWorkouts.ts (res.status(201).json(out)).
export const AssignWorkoutResponseSchema = z.object({
  ok: z.literal(true),
  student_workout_id: z.string().uuid(),
});
export type AssignWorkoutResponse = z.infer<typeof AssignWorkoutResponseSchema>;
