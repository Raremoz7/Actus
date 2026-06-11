import { z } from 'zod';

// Shape REAL de POST /auth/login e POST /auth/refresh (backend/api/src/routes/auth.ts)
export const SessionResponseSchema = z.object({
  access_token: z.string(),
  access_token_expires_in: z.number(),
  refresh_token: z.string(),
});
export type SessionResponse = z.infer<typeof SessionResponseSchema>;

// Shape REAL de GET /me (backend/api/src/routes/me.ts): { id, tipo, display_name }
export const MeSchema = z.object({
  id: z.string(),
  tipo: z.string(),
  display_name: z.string().nullable(),
});
export type Me = z.infer<typeof MeSchema>;

// Shape REAL de GET /professional/students (backend/api/src/routes/professionalStudents.ts)
export const StudentSchema = z.object({
  id: z.string(),
  email: z.string(),
  full_name: z.string().nullable(),
  birth_date: z.string().nullable(),
  professional_role: z.enum(['personal', 'nutricionista']),
  linked_at: z.string(),
});
export type Student = z.infer<typeof StudentSchema>;

export const StudentsResponseSchema = z.object({
  students: z.array(StudentSchema),
});

// Shape REAL de GET /professional/students/:student_id/check-ins
// (backend/api/src/studentCheckInsQuery.ts — workout_session_id pode faltar no fallback de schema antigo)
export const CheckInSchema = z.object({
  id: z.string(),
  check_in_date: z.string(), // YYYY-MM-DD
  source: z.string(),
  created_at: z.string(),
  workout_session_id: z.string().nullable().optional(),
});
export type CheckIn = z.infer<typeof CheckInSchema>;

export const CheckInsResponseSchema = z.object({
  student_id: z.string(),
  check_ins: z.array(CheckInSchema),
});

// Shape REAL de GET /students/:student_id/workouts (backend/api/src/routes/studentWorkouts.ts)
export const StudentWorkoutSchema = z.object({
  id: z.string(),
  student_id: z.string(),
  workout_id: z.string(),
  weekdays: z.array(z.number()), // 1=segunda … 7=domingo
  start_date: z.string().nullable(),
  end_date: z.string().nullable(),
  display_order: z.number(),
  is_active: z.boolean(),
  created_at: z.string(),
  workout_name: z.string(),
  workout_notes: z.string().nullable(),
  exercise_count: z.number(),
  last_completed_date: z.string().nullable(),
});
export type StudentWorkout = z.infer<typeof StudentWorkoutSchema>;

export const StudentWorkoutsResponseSchema = z.object({
  student_workouts: z.array(StudentWorkoutSchema),
});

// Shape REAL do PATCH /students/:student_id/workouts/:student_workout_id —
// só os campos estáveis (datas voltam cruas do Postgres nesse endpoint).
export const StudentWorkoutPatchResponseSchema = z.object({
  id: z.string(),
  student_id: z.string(),
  workout_id: z.string(),
  weekdays: z.array(z.number()),
  display_order: z.number(),
  is_active: z.boolean(),
});

// Shape REAL de GET /workouts (backend/api/src/routes/workouts.ts)
export const WorkoutSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  notes: z.string().nullable(),
  created_at: z.string(),
  exercise_count: z.number(),
});
export type WorkoutSummary = z.infer<typeof WorkoutSummarySchema>;

export const WorkoutsResponseSchema = z.object({
  workouts: z.array(WorkoutSummarySchema),
});

// Shape REAL de GET /workouts/:id (o PATCH devolve o mesmo detalhe)
export const WorkoutExerciseSchema = z.object({
  id: z.string(),
  position: z.number(),
  wger_exercise_id: z.number(),
  name_snapshot: z.string(),
  sets: z.number(),
  reps: z.number(),
  rest_seconds: z.number(),
  notes: z.string().nullable(),
  muscle_group: z.string().nullable(),
});
export type WorkoutExercise = z.infer<typeof WorkoutExerciseSchema>;

export const WorkoutDetailSchema = z.object({
  id: z.string(),
  name: z.string(),
  notes: z.string().nullable(),
  created_at: z.string(),
  exercises: z.array(WorkoutExerciseSchema),
});
export type WorkoutDetail = z.infer<typeof WorkoutDetailSchema>;

// POST /workouts → 201 { ok: true, workout_id }
export const WorkoutCreateResponseSchema = z.object({
  workout_id: z.string(),
});

// POST /students/:student_id/workouts → 201 { ok: true, student_workout_id }
export const AssignWorkoutResponseSchema = z.object({
  student_workout_id: z.string(),
});

// Shape REAL de GET /invites (backend/api/src/routes/invites.ts)
export const InviteSchema = z.object({
  id: z.string(),
  code: z.string(),
  expires_at: z.string(),
  max_uses: z.number(),
  used_count: z.number(),
  created_at: z.string(),
  active: z.boolean(),
});
export type Invite = z.infer<typeof InviteSchema>;

export const InvitesResponseSchema = z.object({
  invites: z.array(InviteSchema),
});

// POST /invites → 201 { id, code } (somente esses dois campos)
export const InviteCreateResponseSchema = z.object({
  id: z.string(),
  code: z.string(),
});

// POST /auth/change-password — NÃO retorna refresh novo (regra crítica).
export const ChangePasswordResponseSchema = z.object({
  access_token: z.string(),
  access_token_expires_in: z.number(),
  must_change_password: z.boolean(),
});

// Shape REAL de GET /admin/staff (backend/api/src/routes/adminStaff.ts)
// Obs.: o GET não devolve must_change_password — só o PATCH aceita o campo.
export const StaffMemberSchema = z.object({
  id: z.string(),
  email: z.string(),
  display_name: z.string().nullable(),
  tipo: z.string(),
  staff_roles: z.array(z.string()),
});
export type StaffMember = z.infer<typeof StaffMemberSchema>;

export const StaffResponseSchema = z.object({
  staff: z.array(StaffMemberSchema),
});

// PATCH /admin/staff/:user_id → { ok, id, email, tipo, staff_roles }
export const StaffPatchResponseSchema = z.object({
  id: z.string(),
  email: z.string(),
  tipo: z.string(),
  staff_roles: z.array(z.string()),
});

// Shape REAL de GET /admin/links/students (backend/api/src/routes/adminStudentLinks.ts)
export const StudentLinkSchema = z.object({
  id: z.string(),
  student: z.object({
    id: z.string(),
    email: z.string(),
    full_name: z.string().nullable(),
    birth_date: z.string().nullable(),
  }),
  professional: z.object({
    id: z.string(),
    email: z.string(),
    display_name: z.string().nullable(),
    tipo: z.string(),
  }),
  professional_role: z.enum(['personal', 'nutricionista']),
  status: z.enum(['active', 'revoked']),
  linked_at: z.string(),
});
export type StudentLink = z.infer<typeof StudentLinkSchema>;

export const StudentLinksResponseSchema = z.object({
  links: z.array(StudentLinkSchema),
});

// PATCH /admin/links/students/:link_id → { ok, link_id, status }
export const LinkPatchResponseSchema = z.object({
  link_id: z.string(),
  status: z.enum(['active', 'revoked']),
});

// POST /admin/professionals → 201 { id, email, professional_role, created_by }
export const ProfessionalCreateResponseSchema = z.object({
  id: z.string(),
  email: z.string(),
  professional_role: z.enum(['personal', 'nutricionista']),
});

// Payload do access token JWT — roles vêm daqui (não existem no GET /me).
const JwtPayloadSchema = z.object({
  roles: z.array(z.string()).optional(),
  must_change_password: z.boolean().optional(),
});

export function decodeJwtPayload(token: string): z.infer<typeof JwtPayloadSchema> {
  try {
    const base64 = token.split('.')[1]?.replace(/-/g, '+').replace(/_/g, '/');
    if (!base64) return {};
    const json = JSON.parse(atob(base64)) as unknown;
    const parsed = JwtPayloadSchema.safeParse(json);
    return parsed.success ? parsed.data : {};
  } catch {
    return {};
  }
}
