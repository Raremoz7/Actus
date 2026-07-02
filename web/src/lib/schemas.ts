import { z } from 'zod';

// Shape REAL de POST /auth/login e POST /auth/refresh (backend/api/src/routes/auth.ts)
export const SessionResponseSchema = z.object({
  access_token: z.string(),
  access_token_expires_in: z.number(),
  refresh_token: z.string(),
});
export type SessionResponse = z.infer<typeof SessionResponseSchema>;

// Contexto de academia anexado ao /me quando o usuário é membro ativo (gestor ou instrutor).
export const AcademyContextSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: z.enum(['manager', 'instructor']),
});
export type AcademyContext = z.infer<typeof AcademyContextSchema>;

// Shape REAL de GET /me (backend/api/src/routes/me.ts): { id, tipo, display_name, academy? }
export const MeSchema = z.object({
  id: z.string(),
  tipo: z.string(),
  display_name: z.string().nullable(),
  academy: AcademyContextSchema.nullable().optional(),
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
  // Gamificação V1 (Task 19): streak efetivo, flag de quebra e total de badges por
  // aluno, retornados por GET /professional/students. Opcionais para não quebrar
  // enquanto o deploy do backend com esses campos não chega em produção.
  streak_current: z.number().int().optional(),
  is_broken: z.boolean().optional(),
  badge_count: z.number().int().optional(),
  // TEC-56 Bloco 1: campos ricos + status do vínculo. Opcionais (deploy gradual).
  status: z.enum(['active', 'revoked']).optional(),
  phone: z.string().nullable().optional(),
  gender: z.enum(['masculino', 'feminino', 'nao_informar', 'outro']).nullable().optional(),
  body_weight_kg: z.number().nullable().optional(),
  height_cm: z.number().nullable().optional(),
  cpf_last4: z.string().nullable().optional(),
});
export type Student = z.infer<typeof StudentSchema>;

export const StudentsResponseSchema = z.object({
  students: z.array(StudentSchema),
});

export const StudentBadgeSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  asset_key: z.string().nullable(),
  sort_order: z.number(),
  earned: z.boolean(),
  earned_at: z.string().nullable(),
});
export type StudentBadge = z.infer<typeof StudentBadgeSchema>;
export const StudentBadgesResponseSchema = z.object({
  student_id: z.string(),
  badges: z.array(StudentBadgeSchema),
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
  // exercise_id: slug do catálogo estático (migration workout_exercises_exercise_id); o BuilderPage
  // já lê com fallback para wger_exercise_id. Opcional para compat com respostas antigas.
  exercise_id: z.string().nullable().optional(),
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

// ---------------------------------------------------------------------------
// [ACTUS — academia] Módulo academia (painel do gestor + onboarding admin).
// Contratos espelham backend/api/src/routes/{academy,academyCommissions,adminAcademies}.ts
// ---------------------------------------------------------------------------

// GET /academy/dashboard
export const InstructorRankSchema = z.object({
  instructor_user_id: z.string(),
  display_name: z.string().nullable(),
  student_count: z.number(),
  active_students_7d: z.number(),
  check_ins_30d: z.number(),
});
export type InstructorRank = z.infer<typeof InstructorRankSchema>;

export const AcademyDashboardSchema = z.object({
  kpis: z.object({
    total_students: z.number(),
    active_students_7d: z.number(),
    check_ins_30d: z.number(),
    instructors: z.number(),
    adherence_7d_pct: z.number().nullable(),
  }),
  instructor_ranking: z.array(InstructorRankSchema),
});
export type AcademyDashboard = z.infer<typeof AcademyDashboardSchema>;

// GET /academy/members
export const AcademyMemberSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  role: z.enum(['manager', 'instructor']),
  status: z.enum(['invited', 'active', 'revoked']),
  display_name: z.string().nullable(),
  email: z.string(),
  student_count: z.number(),
});
export type AcademyMember = z.infer<typeof AcademyMemberSchema>;
export const AcademyMembersResponseSchema = z.object({ members: z.array(AcademyMemberSchema) });

// GET /academy/students
export const AcademyStudentSchema = z.object({
  id: z.string(),
  display_name: z.string().nullable(),
  email: z.string(),
  instructor_user_id: z.string(),
  instructor_name: z.string().nullable(),
  last_check_in: z.string().nullable(),
});
export type AcademyStudent = z.infer<typeof AcademyStudentSchema>;
export const AcademyStudentsResponseSchema = z.object({ students: z.array(AcademyStudentSchema) });

// Comissões
export const CommissionRuleType = z.enum(['percent', 'fixed_per_student', 'fixed_monthly']);

export const CommissionRuleSchema = z.object({
  id: z.string(),
  instructor_user_id: z.string().nullable(),
  rule_type: CommissionRuleType,
  percent: z.number().nullable(),
  amount_cents: z.number().nullable(),
  currency: z.string(),
  effective_from: z.string(),
  effective_to: z.string().nullable(),
});
export type CommissionRule = z.infer<typeof CommissionRuleSchema>;
export const CommissionRulesResponseSchema = z.object({ rules: z.array(CommissionRuleSchema) });

export const CommissionEntrySchema = z.object({
  id: z.string(),
  instructor_user_id: z.string(),
  instructor_name: z.string().nullable(),
  subject_type: z.enum(['student', 'instructor', 'academy']),
  subject_id: z.string().nullable(),
  amount_cents: z.number(),
  source: z.enum(['manual', 'billing']),
  note: z.string().nullable(),
  created_at: z.string(),
});
export type CommissionEntry = z.infer<typeof CommissionEntrySchema>;
export const CommissionEntriesResponseSchema = z.object({ entries: z.array(CommissionEntrySchema) });

export const CommissionReportRowSchema = z.object({
  instructor_user_id: z.string(),
  display_name: z.string().nullable(),
  student_count: z.number(),
  base_cents: z.number(),
  rule_type: CommissionRuleType.nullable(),
  commission_cents: z.number(),
  status: z.enum(['pending', 'paid']),
});
export type CommissionReportRow = z.infer<typeof CommissionReportRowSchema>;

export const CommissionReportSchema = z.object({
  period: z.string(),
  rows: z.array(CommissionReportRowSchema),
  totals: z.object({
    base_cents: z.number(),
    commission_cents: z.number(),
    due_cents: z.number(),
  }),
});
export type CommissionReport = z.infer<typeof CommissionReportSchema>;

// Admin — academias (GET /admin/academies, GET /admin/academies/:id)
export const AcademyListItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string().nullable(),
  cnpj: z.string().nullable(),
  timezone: z.string(),
  status: z.string(),
  instructors: z.number(),
  managers: z.number(),
  created_at: z.string(),
});
export type AcademyListItem = z.infer<typeof AcademyListItemSchema>;
export const AcademiesResponseSchema = z.object({ academies: z.array(AcademyListItemSchema) });

export const AcademyDetailSchema = z.object({
  academy: z.object({
    id: z.string(),
    name: z.string(),
    slug: z.string().nullable(),
    cnpj: z.string().nullable(),
    timezone: z.string(),
    status: z.string(),
    created_at: z.string(),
  }),
  members: z.array(
    z.object({
      id: z.string(),
      user_id: z.string(),
      role: z.string(),
      status: z.string(),
      display_name: z.string().nullable(),
      email: z.string(),
      tipo: z.string(),
    }),
  ),
});
export type AcademyDetail = z.infer<typeof AcademyDetailSchema>;

// POST responses
export const AcademyCreateResponseSchema = z.object({ id: z.string(), name: z.string() });

// ---------------------------------------------------------------------------
// [ACTUS — TEC-57] Anamnese dinâmica (builder de template + respostas por aluno).
// Distinto do PAR-Q (fixo, 7 perguntas). Contrato proposto em
// web/docs/backend/tec-57-anamnese.md — backend ainda não implementado.
// ---------------------------------------------------------------------------
export const AnamneseFieldType = z.enum(['text', 'textarea', 'number', 'select', 'boolean', 'date']);
export type AnamneseFieldTypeT = z.infer<typeof AnamneseFieldType>;

export const AnamneseFieldSchema = z.object({
  key: z.string(),
  label: z.string(),
  type: AnamneseFieldType,
  options: z.array(z.string()).optional(), // usado quando type === 'select'
  required: z.boolean().optional().default(false),
});
export type AnamneseField = z.infer<typeof AnamneseFieldSchema>;

export const AnamneseTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  fields: z.array(AnamneseFieldSchema),
  is_active: z.boolean(),
  created_at: z.string(),
  updated_at: z.string().nullable().optional(),
});
export type AnamneseTemplate = z.infer<typeof AnamneseTemplateSchema>;
export const AnamneseTemplatesResponseSchema = z.object({
  templates: z.array(AnamneseTemplateSchema),
});

// Valores de resposta: string (text/textarea/date/select), number, boolean (sim/não) ou null.
export const AnamneseAnswerValueSchema = z.union([z.string(), z.number(), z.boolean(), z.null()]);
export type AnamneseAnswerValue = z.infer<typeof AnamneseAnswerValueSchema>;

// GET /professional/students/:id/anamnese → template ativo + respostas do aluno (ou null).
export const StudentAnamneseResponseSchema = z.object({
  template: AnamneseTemplateSchema.nullable(),
  answers: z.record(z.string(), AnamneseAnswerValueSchema).nullable(),
  submitted_at: z.string().nullable().optional(),
});
export type StudentAnamnese = z.infer<typeof StudentAnamneseResponseSchema>;

// ---------------------------------------------------------------------------
// [ACTUS — TEC-58] Alimentação: feed de refeições (mobile escreve) + comentários
// do profissional (web) + push. Contrato em web/docs/backend/tec-58-alimentacao.md
// — backend ainda não implementado.
// ---------------------------------------------------------------------------
export const MealCommentSchema = z.object({
  id: z.string(),
  author_id: z.string(),
  author_name: z.string().nullable().optional(),
  body: z.string(),
  created_at: z.string(),
});
export type MealComment = z.infer<typeof MealCommentSchema>;

export const MealLogSchema = z.object({
  id: z.string(),
  student_id: z.string(),
  photo_url: z.string().nullable(),
  eaten_at: z.string(), // ISO datetime
  description: z.string().nullable(),
  created_at: z.string(),
  comments: z.array(MealCommentSchema).default([]),
});
export type MealLog = z.infer<typeof MealLogSchema>;
export const MealLogsResponseSchema = z.object({ meals: z.array(MealLogSchema) });
