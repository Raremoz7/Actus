// [DEV — bypass de auth] Mock adapter do axios para popular as telas sem backend.
// Só é instalado quando DEV_BYPASS_AUTH está ligado (ver client.ts). Devolve dados
// fake no formato EXATO dos schemas Zod (senão parseApi rejeita). Cobre a área ALUNO,
// incluindo o fluxo treino → iniciar → sessão.
// Para remover: apague este arquivo e a chamada installDevMockAdapter em client.ts.
import axios, { type AxiosAdapter, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import { DEV_TIPO } from '@/lib/devAuth';

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
  return { id: ID.me, tipo: DEV_TIPO, display_name: 'Davi' };
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

// ── Roteamento (method + path) ─────────────────────────────────────────────────
// Ordem importa: rotas mais específicas primeiro.
type Matcher = { test: (method: string, url: string) => string[] | null; build: (m: string[]) => unknown };

const MATCHERS: Matcher[] = [
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
  { test: (m, u) => (m === 'get' && /\/me\/weekly-overview$/.test(u) ? [] : null), build: mockWeeklyOverview },
  { test: (m, u) => (m === 'get' && /\/me\/workouts$/.test(u) ? [] : null), build: mockWorkoutsList },
  { test: (m, u) => (m === 'get' && /\/me\/diets$/.test(u) ? [] : null), build: mockDiet },
  { test: (m, u) => (m === 'get' && /\/me\/challenges$/.test(u) ? [] : null), build: mockChallenges },
  { test: (m, u) => (m === 'get' && /\/me$/.test(u) ? [] : null), build: mockMe },
];

function matchMock(config: InternalAxiosRequestConfig): unknown | null {
  const method = (config.method ?? 'get').toLowerCase();
  const url = ((config.url ?? '').split('?')[0] ?? '');
  for (const m of MATCHERS) {
    const captures = m.test(method, url);
    if (captures) return m.build(captures);
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
    const data = matchMock(config);
    if (data !== null) {
      return { data, status: 200, statusText: 'OK', headers: {}, config } as AxiosResponse;
    }
    return fallback(config);
  };
}
