// [DEV — bypass de auth] Mock adapter do axios para popular as telas sem backend.
// Só é instalado quando DEV_BYPASS_AUTH está ligado (ver client.ts). Devolve dados
// fake no formato EXATO dos schemas Zod (senão parseApi rejeita). Cobre a área ALUNO,
// incluindo o fluxo treino → iniciar → sessão.
// Para remover: apague este arquivo e a chamada installDevMockAdapter em client.ts.
import axios, {
  AxiosError,
  type AxiosAdapter,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';
import { getDevTipo, setDevTipo } from '@/lib/devAuth';

// ── Helpers de data (rodam no runtime do app — new Date() disponível) ──────────
function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`;
}
function isoWeekday(d: Date): number {
  const dow = d.getDay(); // 0=dom..6=sab
  return dow === 0 ? 7 : dow; // 1=seg..7=dom
}
function addDays(d: Date, n: number): Date {
  const c = new Date(d);
  c.setDate(c.getDate() + n);
  return c;
}
function nowIso(): string {
  return new Date().toISOString();
}

// UUIDs fixos válidos (version 4, variant 8) — estáveis entre reloads.
const ID = {
  me: '00000000-0000-4000-8000-000000000000',
  diet: '44444444-4444-4444-8444-444444444444',
  challenge: '55555555-5555-4555-8555-555555555555',
  professional: '66666666-6666-4666-8666-666666666666',
} as const;

// Gera um uuid v4 válido a partir de um char hex (grupo) + índice.
function exId(group: string, i: number): string {
  return `${group.repeat(8)}-0000-4000-8000-${String(i).padStart(12, '0')}`;
}

// ── Definição dos 3 treinos do aluno (assignment + workout + exercícios) ───────
type ExDef = { name: string; sets: number; reps: number; rest: number; muscle: string };

type WorkoutDef = {
  assign: string;
  workout: string;
  order: number;
  // Offset de dias a partir de HOJE para o weekday do treino (0 = hoje).
  dayOffset: number;
  name: string;
  notes: string;
  group: string; // char hex p/ gerar uuids de exercício
  exercises: ExDef[];
};

const WORKOUTS: WorkoutDef[] = [
  {
    assign: '11111111-1111-4111-8111-111111111111',
    workout: '11111111-1111-4111-8111-1111111111aa',
    order: 1,
    dayOffset: 0, // HOJE
    name: 'Peito & Tríceps',
    notes: 'Peito, tríceps, ombro anterior',
    group: 'a',
    exercises: [
      { name: 'Supino reto', sets: 4, reps: 8, rest: 90, muscle: 'Peito' },
      { name: 'Supino inclinado com halteres', sets: 3, reps: 10, rest: 75, muscle: 'Peito' },
      { name: 'Crucifixo na máquina', sets: 3, reps: 12, rest: 60, muscle: 'Peito' },
      { name: 'Tríceps testa', sets: 3, reps: 10, rest: 60, muscle: 'Tríceps' },
      { name: 'Tríceps corda', sets: 3, reps: 12, rest: 45, muscle: 'Tríceps' },
      { name: 'Elevação lateral', sets: 3, reps: 15, rest: 45, muscle: 'Ombro' },
    ],
  },
  {
    assign: '22222222-2222-4222-8222-222222222222',
    workout: '22222222-2222-4222-8222-2222222222bb',
    order: 2,
    dayOffset: 1,
    name: 'Costas & Bíceps',
    notes: 'Dorsal, trapézio, bíceps',
    group: 'b',
    exercises: [
      { name: 'Barra fixa', sets: 4, reps: 8, rest: 90, muscle: 'Costas' },
      { name: 'Remada curvada', sets: 4, reps: 10, rest: 75, muscle: 'Costas' },
      { name: 'Puxada frente', sets: 3, reps: 12, rest: 60, muscle: 'Dorsal' },
      { name: 'Remada baixa', sets: 3, reps: 12, rest: 60, muscle: 'Costas' },
      { name: 'Rosca direta', sets: 3, reps: 10, rest: 60, muscle: 'Bíceps' },
      { name: 'Rosca martelo', sets: 3, reps: 12, rest: 45, muscle: 'Bíceps' },
    ],
  },
  {
    assign: '33333333-3333-4333-8333-333333333333',
    workout: '33333333-3333-4333-8333-3333333333cc',
    order: 3,
    dayOffset: 2,
    name: 'Pernas',
    notes: 'Quadríceps, posterior, glúteo',
    group: 'c',
    exercises: [
      { name: 'Agachamento livre', sets: 4, reps: 8, rest: 120, muscle: 'Quadríceps' },
      { name: 'Leg press', sets: 4, reps: 12, rest: 90, muscle: 'Quadríceps' },
      { name: 'Cadeira extensora', sets: 3, reps: 15, rest: 60, muscle: 'Quadríceps' },
      { name: 'Mesa flexora', sets: 3, reps: 12, rest: 60, muscle: 'Posterior' },
      { name: 'Stiff', sets: 3, reps: 10, rest: 75, muscle: 'Posterior' },
      { name: 'Panturrilha em pé', sets: 4, reps: 20, rest: 45, muscle: 'Panturrilha' },
    ],
  },
];

function findWorkout(assignId: string): WorkoutDef {
  return WORKOUTS.find((w) => w.assign === assignId) ?? (WORKOUTS[0] as WorkoutDef);
}

function weekdayForOffset(offset: number): number {
  const wd = isoWeekday(new Date());
  return ((wd - 1 + offset) % 7) + 1;
}

// ── Geração dos mocks por endpoint ─────────────────────────────────────────────
function mockMe() {
  return { id: ID.me, tipo: getDevTipo(), display_name: 'Davi' };
}

function mockWeeklyOverview() {
  const today = new Date();
  const wd = isoWeekday(today);
  const weekStart = addDays(today, -(wd - 1));
  const weekEnd = addDays(weekStart, 6);
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(weekStart, i);
    return { date: ymd(date), weekday: i + 1, completed: i + 1 < wd };
  });
  return {
    week_start: ymd(weekStart),
    week_end: ymd(weekEnd),
    today_date: ymd(today),
    today_weekday: wd,
    timezone: 'America/Sao_Paulo',
    streak_current: Math.max(0, wd - 1) + 3,
    streak_best: 12,
    days,
  };
}

function mockWorkoutsList() {
  const created = '2026-01-06T08:00:00.000Z';
  return {
    student_workouts: WORKOUTS.map((w) => ({
      id: w.assign,
      student_id: ID.me,
      workout_id: w.workout,
      weekdays: [weekdayForOffset(w.dayOffset)],
      start_date: '2026-01-06',
      end_date: null,
      display_order: w.order,
      is_active: true,
      created_at: created,
      workout_name: w.name,
      workout_notes: w.notes,
      exercise_count: w.exercises.length,
      last_completed_date: null,
    })),
  };
}

function mockWorkoutDetail(assignId: string) {
  const w = findWorkout(assignId);
  return {
    assignment: {
      id: w.assign,
      workout_id: w.workout,
      weekdays: [weekdayForOffset(w.dayOffset)],
      start_date: '2026-01-06',
      end_date: null,
      display_order: w.order,
      is_active: true,
      created_at: '2026-01-06T08:00:00.000Z',
    },
    workout: {
      id: w.workout,
      name: w.name,
      notes: w.notes,
      exercises: w.exercises.map((e, i) => ({
        id: exId(w.group, i + 1),
        position: i + 1,
        wger_exercise_id: 100 + i,
        name_snapshot: e.name,
        sets: e.sets,
        reps: e.reps,
        rest_seconds: e.rest,
        notes: null,
        muscle_group: e.muscle,
      })),
    },
    recent_sessions: [],
  };
}

// Sessão de treino: id da sessão = assignment id (estável p/ o GET seguinte).
function mockSession(assignId: string) {
  const w = findWorkout(assignId);
  return {
    session: {
      id: w.assign,
      student_workout_id: w.assign,
      scheduled_for_date: ymd(new Date()),
      status: 'in_progress',
      started_at: nowIso(),
      completed_at: null,
    },
    exercises: w.exercises.map((e, i) => ({
      workout_exercise_id: exId(w.group, i + 1),
      completed: false,
      completed_at: null,
      position: i + 1,
      wger_exercise_id: 100 + i,
      name_snapshot: e.name,
      sets: e.sets,
      reps: e.reps,
      rest_seconds: e.rest,
      notes: null,
      muscle_group: e.muscle,
      sets_logged: [],
    })),
  };
}

function mockDiet() {
  return { id: ID.diet, title: 'Cutting · 2.400 kcal' };
}

function mockChallenges() {
  const today = new Date();
  const created = '2026-01-02T10:00:00.000Z';
  return {
    challenges: [
      {
        challenge: {
          id: ID.challenge,
          owner_professional_id: ID.professional,
          name: 'Constância de Junho',
          starts_on: ymd(addDays(today, -5)),
          ends_on: ymd(addDays(today, 16)),
          visibility: 'public_among_participants',
          status: 'active',
          created_at: created,
          updated_at: created,
        },
        participant_status: 'active',
      },
    ],
  };
}

// ── [DEV] Convites em memória (create/list/revoke/preview) ─────────────────────
// O backend real não responde no bypass; um store local deixa o fluxo de convites do
// profissional funcionar de ponta a ponta (criar → listar → revogar) e o onboarding
// validar o código já no passo 1 (GET /invites/:code/preview).
type MockInvite = {
  id: string;
  code: string;
  expires_at: string;
  max_uses: number;
  used_count: number;
  created_at: string;
};

function genHex(n: number): string {
  let s = '';
  for (let i = 0; i < n; i++) s += '0123456789abcdef'[Math.floor(Math.random() * 16)];
  return s;
}

// UUID v4 válido (versão 4 + variante 8) — satisfaz z.string().uuid().
function genUuid(): string {
  return `${genHex(8)}-${genHex(4)}-4${genHex(3)}-8${genHex(3)}-${genHex(12)}`;
}

// Código curto legível no formato aceito pelo cadastro (base64url, 3–200 chars).
function genCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 8; i++) s += alphabet[Math.floor(Math.random() * alphabet.length)];
  return s;
}

function inviteActive(inv: MockInvite): boolean {
  const notExpired = new Date(inv.expires_at).getTime() > new Date().getTime();
  return notExpired && inv.used_count < inv.max_uses;
}

// Seed: um convite ativo pronto para QA (aparece na lista e valida no passo 1: ACTUSDEMO).
const devInvites: MockInvite[] = [
  {
    id: genUuid(),
    code: 'ACTUSDEMO',
    expires_at: addDays(new Date(), 14).toISOString(),
    max_uses: 5,
    used_count: 1,
    created_at: addDays(new Date(), -1).toISOString(),
  },
];

function mockInvitesList() {
  return { invites: devInvites.map((inv) => ({ ...inv, active: inviteActive(inv) })) };
}

function mockCreateInvite(body: { expires_at?: string; max_uses?: number }) {
  const inv: MockInvite = {
    id: genUuid(),
    code: genCode(),
    expires_at: body.expires_at ?? addDays(new Date(), 7).toISOString(),
    max_uses: typeof body.max_uses === 'number' ? body.max_uses : 1,
    used_count: 0,
    created_at: new Date().toISOString(),
  };
  devInvites.unshift(inv);
  // Shape REAL do 201: o backend devolve o convite flat (res.json(created.invite)).
  return { id: inv.id, code: inv.code };
}

function mockRevokeInvite(id: string, body: { expires_at?: string }) {
  const inv = devInvites.find((i) => i.id === id);
  if (inv && body.expires_at) inv.expires_at = body.expires_at;
  return { ok: true };
}

// Validação do passo 1: sucesso → { ok: true }; convite inválido/expirado/esgotado →
// erro simulado (mesma branch por `error` do backend real).
function mockInvitePreview(code: string) {
  const inv = devInvites.find((i) => i.code === code);
  if (!inv) throw new MockHttpError(404, 'invalid_invite');
  if (new Date(inv.expires_at).getTime() <= new Date().getTime()) {
    throw new MockHttpError(409, 'invite_expired');
  }
  if (inv.used_count >= inv.max_uses) throw new MockHttpError(409, 'invite_exhausted');
  return { ok: true };
}

// Erro HTTP simulado: o adapter o converte num AxiosError com body { error } para o
// interceptor de resposta seguir a mesma branch por `error` do backend real.
class MockHttpError {
  constructor(
    readonly status: number,
    readonly errorCode: string,
  ) {}
}

// Body da request já passou pelo transformRequest do axios → string JSON. Parse defensivo.
function parseBody(config: InternalAxiosRequestConfig): Record<string, unknown> {
  const d = config.data;
  if (typeof d === 'string') {
    try {
      return JSON.parse(d) as Record<string, unknown>;
    } catch {
      return {};
    }
  }
  return (d as Record<string, unknown>) ?? {};
}

// ── Roteamento (method + path) ─────────────────────────────────────────────────
// Ordem importa: rotas mais específicas primeiro.
type Matcher = {
  test: (method: string, url: string) => string[] | null;
  build: (m: string[], config: InternalAxiosRequestConfig) => unknown;
};

const MATCHERS: Matcher[] = [
  // POST /auth/register-professional  [MOCK — sem endpoint na API v1]
  // Alinha o tipo dev para o /me do bypass devolver 'personal' (QA entra no papel certo).
  {
    test: (m, u) => (m === 'post' && /\/auth\/register-professional$/.test(u) ? [] : null),
    build: () => {
      setDevTipo('personal');
      return mockRegisterTokens('pro');
    },
  },
  // POST /auth/register  [bypass: o backend real não responde; cobre o cadastro
  // sem convite (contrato proposto) e com convite no QA]
  {
    test: (m, u) => (m === 'post' && /\/auth\/register$/.test(u) ? [] : null),
    build: () => {
      setDevTipo('aluno');
      return mockRegisterTokens('aluno');
    },
  },
  // POST /invites/consume (endpoint REAL; mock p/ QA no bypass)
  {
    test: (m, u) => (m === 'post' && /\/invites\/consume$/.test(u) ? [] : null),
    build: (_m, config) => mockConsumeInvite(parseBody(config) as { code?: string }),
  },
  // GET /me/workouts/sessions/:id  (antes do detalhe, que casaria também)
  {
    test: (m, u) => (m === 'get' ? (u.match(/\/me\/workouts\/sessions\/([^/]+)$/)) : null),
    build: (m) => mockSession(m[1] as string),
  },
  // POST /me/workouts/:id/sessions
  {
    test: (m, u) => (m === 'post' ? (u.match(/\/me\/workouts\/([^/]+)\/sessions$/)) : null),
    build: (m) => mockSession(m[1] as string),
  },
  // GET /me/workouts/:id  (detalhe — id != "sessions")
  {
    test: (m, u) => {
      if (m !== 'get') return null;
      const match = u.match(/\/me\/workouts\/([^/]+)$/);
      return match && match[1] !== 'sessions' ? match : null;
    },
    build: (m) => mockWorkoutDetail(m[1] as string),
  },
  { test: (m, u) => (m === 'get' && /\/me\/gamification\/weekly-overview$/.test(u) ? [] : null), build: mockWeeklyOverview },
  { test: (m, u) => (m === 'get' && /\/me\/workouts$/.test(u) ? [] : null), build: mockWorkoutsList },
  { test: (m, u) => (m === 'get' && /\/me\/diets$/.test(u) ? [] : null), build: mockDiet },
  { test: (m, u) => (m === 'get' && /\/me\/challenges$/.test(u) ? [] : null), build: mockChallenges },
  // GET /invites/:code/preview  (antes da lista — valida o código no passo 1 do cadastro)
  {
    test: (m, u) => (m === 'get' ? u.match(/\/invites\/([^/]+)\/preview$/) : null),
    build: (mm) => mockInvitePreview(mm[1] as string),
  },
  // GET /invites  (lista de convites do profissional)
  { test: (m, u) => (m === 'get' && /\/invites$/.test(u) ? [] : null), build: mockInvitesList },
  // POST /invites  (criar convite)
  {
    test: (m, u) => (m === 'post' && /\/invites$/.test(u) ? [] : null),
    build: (_m, config) =>
      mockCreateInvite(parseBody(config) as { expires_at?: string; max_uses?: number }),
  },
  // PATCH /me/professional-profile  (perfil profissional self-service; só ok no bypass)
  {
    test: (m, u) => (m === 'patch' && /\/me\/professional-profile$/.test(u) ? [] : null),
    build: () => ({ ok: true }),
  },
  // PATCH /invites/:id  (revogar → expira agora)
  {
    test: (m, u) => (m === 'patch' ? u.match(/\/invites\/([^/]+)$/) : null),
    build: (mm, config) =>
      mockRevokeInvite(mm[1] as string, parseBody(config) as { expires_at?: string }),
  },
  { test: (m, u) => (m === 'get' && /\/me$/.test(u) ? [] : null), build: mockMe },
];

function matchMock(config: InternalAxiosRequestConfig): unknown | null {
  const method = (config.method ?? 'get').toLowerCase();
  const url = ((config.url ?? '').split('?')[0] ?? '');
  for (const m of MATCHERS) {
    const captures = m.test(method, url);
    if (captures) return m.build(captures, config);
  }
  return null;
}

// Substitui o adapter da instância: intercepta as rotas conhecidas e delega o resto
// ao adapter real (que vai falhar no CORS, mas as telas já tratam isso).
export function installDevMockAdapter(instance: { defaults: { adapter?: unknown } }): void {
  const fallback = axios.getAdapter(
    (instance.defaults.adapter as AxiosAdapter | undefined) ?? axios.defaults.adapter,
  );
  instance.defaults.adapter = async (config: InternalAxiosRequestConfig): Promise<AxiosResponse> => {
    let data: unknown;
    try {
      data = matchMock(config);
    } catch (err) {
      // Erro simulado de um mock (ex.: convite inválido) → AxiosError com body { error },
      // pro interceptor de resposta seguir a mesma branch por `error` do backend real.
      if (err instanceof MockHttpError) {
        const response = {
          data: { error: err.errorCode },
          status: err.status,
          statusText: 'Error',
          headers: {},
          config,
        } as AxiosResponse;
        throw new AxiosError(err.errorCode, String(err.status), config, undefined, response);
      }
      throw err;
    }
    if (data !== null) {
      return { data, status: 200, statusText: 'OK', headers: {}, config } as AxiosResponse;
    }
    return fallback(config);
  };
}

// ── [DEV] Registers + consume (onboarding) ─────────────────────────────────────

// [MOCK] Tokens de register (aluno/pro) — mesmo shape de TokensResponseSchema.
function mockRegisterTokens(kind: string) {
  return {
    access_token: `dev-access-${kind}`,
    access_token_expires_in: 900,
    refresh_token: `dev-refresh-${kind}`,
  };
}

// Consome convite do store local. Distingue expiração de esgotamento;
// segundo consume do mesmo código → note already_linked.
const consumedCodes = new Set<string>();
function mockConsumeInvite(body: { code?: string }) {
  const code = body.code ?? '';
  const inv = devInvites.find((i) => i.code === code);
  if (!inv) throw new MockHttpError(404, 'invalid_invite');
  if (new Date(inv.expires_at).getTime() <= new Date().getTime()) {
    throw new MockHttpError(409, 'invite_expired');
  }
  if (inv.used_count >= inv.max_uses) throw new MockHttpError(409, 'invite_exhausted');
  if (consumedCodes.has(code)) {
    return {
      ok: true,
      professional_id: genUuid(),
      professional_role: 'personal',
      note: 'already_linked',
    };
  }
  consumedCodes.add(code);
  inv.used_count += 1;
  return { ok: true, professional_id: genUuid(), professional_role: 'personal' };
}

// Exposto só para teste de contrato (não usar em runtime).
export const __testables = { mockRegisterTokens };
