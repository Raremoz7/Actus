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

// ── Resumo do FINISH (POST /me/workouts/sessions/:id/finish) ────────────────
// O finish responde { ...WorkoutSession, summary }. Hoje só a sessão era
// parseada (via .passthrough()) e o `summary` rico era descartado.
// Shape REAL verificado no backend: services/studentWorkoutSummary.ts
// (WorkoutFinishSummary + WorkoutSharePayload). Use nomes/tipos EXATOS do backend.

// DTO pronto para card / Share Sheet (layout 'strava_style_v1').
export const WorkoutShareSchema = z.object({
  layout: z.literal('strava_style_v1'),
  title: z.string(),
  subtitle: z.string().nullable(),
  duration_label: z.string(),
  metrics: z.array(z.object({ label: z.string(), value: z.string() })),
  // Linhas de destaque (volume, evolução, PR); vazio se sem dados de carga.
  highlights: z.array(z.string()),
  // Omitir seção de evolução de cargas no layout (sessão sem peso registrado).
  hide_load_evolution: z.boolean(),
});
export type WorkoutShare = z.infer<typeof WorkoutShareSchema>;

// Evolução por exercício: max de carga atual vs. sessão anterior da mesma atribuição.
export const LoadEvolutionRowSchema = z.object({
  workout_exercise_id: z.string().uuid(),
  exercise_name: z.string(),
  muscle_group: z.string().nullable(),
  current_max_kg: z.number(),
  previous_max_kg: z.number().nullable(),
  delta_kg: z.number().nullable(),
});
export type LoadEvolutionRow = z.infer<typeof LoadEvolutionRowSchema>;

// Resumo completo do treino finalizado.
export const WorkoutFinishSummarySchema = z.object({
  duration_ms: z.number(),
  duration_label: z.string(),
  total_volume_kg: z.number(),
  has_load_data: z.boolean(),
  estimated_calories_kcal: z.number(),
  calories_method: z.enum(['met_with_body_weight', 'met_reference_weight']),
  load_evolution: z.array(LoadEvolutionRowSchema),
  // Assinatura/branding do personal vinculado (null se não houver vínculo ativo).
  branding: z
    .object({
      professional_id: z.string().uuid(),
      professional_display_name: z.string().nullable(),
    })
    .nullable(),
  share: WorkoutShareSchema,
});
export type WorkoutFinishSummary = z.infer<typeof WorkoutFinishSummarySchema>;

// Resposta REAL do finish: a sessão completa + o summary rico como irmão.
// (O backend faz res.json({ ...payload, summary }).)
export const WorkoutFinishResponseSchema = WorkoutSessionSchema.extend({
  summary: WorkoutFinishSummarySchema,
});
export type WorkoutFinishResponse = z.infer<typeof WorkoutFinishResponseSchema>;
