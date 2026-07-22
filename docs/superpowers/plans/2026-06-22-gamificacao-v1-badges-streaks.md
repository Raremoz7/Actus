# Gamificação V1 — Badges + Streaks — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Entregar a gamificação V1 do ActusFit — streaks por janela rolling de 24h, 7 badges com celebração (Lottie + confete + som + haptics), push notifications e surfacing para o Personal (app + web).

**Architecture:** Backend (Node + Express + Postgres) é a fonte da verdade. A lógica de streak rolling-24h e a avaliação de badges vivem em serviços TypeScript executados na mesma transação do evento (finish de sessão / check-in). O app/web apenas exibem o estado retornado. Push é best-effort, enviado após o commit. Spec: `docs/superpowers/specs/2026-06-22-gamificacao-v1-design.md`.

**Tech Stack:** Backend: TypeScript, Express 5, pg (SQL raw), vitest + pg-mem + supertest, migrations SQL em `backend/supabase/migrations/`. App: Expo / React Native, expo-router, TanStack Query, zod, expo-notifications, expo-audio, lottie-react-native, expo-haptics, @testing-library/react-native. Web: React 18 + Vite + Tailwind v4 + axios + TanStack Query + zod. Backend push: expo-server-sdk.

**Decisão de implementação:** a função SQL `recompute_student_streak` (lógica por calendário) é **substituída** por um serviço TypeScript (`streakService`). Os handlers de finish/check-in passam a chamar o serviço TS. Isso evita PL/pgSQL no caminho novo e torna a lógica testável com vitest.

---

## File Structure

**Backend (novo):**
- `api/src/services/streakService.ts` — algoritmo rolling-24h + cálculo efetivo no read.
- `api/src/services/badgeService.ts` — `evaluateBadges()` + leitura de badges.
- `api/src/services/pushService.ts` — envio via Expo Push API.
- `api/src/routes/meBadges.ts` — `/me/badges`, `/me/badges/unseen`, `/me/badges/seen`.
- `api/src/routes/deviceTokens.ts` — `/me/device-tokens`.
- `supabase/migrations/20260622120000_gamification_v1.sql` — tabelas + colunas.
- `supabase/migrations/20260622120100_seed_badges.sql` — catálogo dos 7 badges.

**Backend (modificado):**
- `api/src/routes/meStudentProgram.ts` — finish/check-in chamam streakService + badgeService; finish retorna `newly_earned_badges`.
- `api/src/routes/meGamification.ts` — weekly-overview usa streak efetivo (`is_broken`).
- `api/src/app.ts` — montar novas rotas.
- rota de students do profissional — payload estendido (`streak_current`, `is_broken`, `badge_count`).

**App (novo):**
- `app/(aluno)/badges.tsx` — tela de badges.
- `src/components/gamification/BadgeUnlockOverlay.tsx`, `BadgeGrid.tsx`, `StreakCounter.tsx`, `BadgeUnlockQueue.tsx`.
- `src/hooks/useBadges.ts`, `src/hooks/useUnseenBadges.ts`, `src/hooks/useMarkBadgesSeen.ts`, `src/hooks/useRegisterPushToken.ts`.
- `src/lib/push.ts`.

**App (modificado):**
- `src/types/gamification.ts` — schemas Badge/StudentBadge + `is_broken`.
- `src/hooks/useSessionMutations.ts` — finish retorna badges + invalida caches.
- `app/(aluno)/(tabs)/index.tsx` — StreakCounter na home.
- `app/(aluno)/(tabs)/perfil.tsx` — link p/ tela de badges.
- `src/components/professional/StudentRow.tsx` — mini-indicador.
- `src/api/endpoints.ts` — novos paths.

**Web (novo):**
- `src/components/StreakBadge.tsx`, `src/components/StudentBadges.tsx`, `src/hooks/useStudentGamification.ts`.

---

# FASE 1 — Backend Foundation

## Task 1: Migration — tabelas e colunas

**Files:**
- Create: `backend/supabase/migrations/20260622120000_gamification_v1.sql`

- [ ] **Step 1: Escrever a migration**

```sql
-- Gamificação V1: badges, conquistas, device tokens e colunas de streak rolling.
begin;

create table if not exists public.badges (
  id text primary key,
  name text not null,
  description text not null,
  criteria_type text not null check (criteria_type in ('workout_count','streak','personal_record')),
  criteria_threshold int,
  asset_key text not null,
  sort_order int not null default 0,
  active boolean not null default true
);

create table if not exists public.student_badges (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  badge_id text not null references public.badges(id),
  earned_at timestamptz not null default now(),
  seen_at timestamptz,
  unique (student_id, badge_id)
);
create index if not exists idx_student_badges_student on public.student_badges(student_id);

create table if not exists public.device_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  expo_push_token text not null unique,
  platform text not null check (platform in ('ios','android')),
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);
create index if not exists idx_device_tokens_user on public.device_tokens(user_id);

alter table public.profiles add column if not exists last_activity_at timestamptz;
alter table public.profiles add column if not exists last_credit_date date;

commit;
```

- [ ] **Step 2: Aplicar a migration no banco local**

Run: `cd backend && ./local/apply-migrations.sh` (ou o comando de migration do projeto — ver `backend/local/README`). Caso não exista script, aplicar via `psql "$DATABASE_URL" -f supabase/migrations/20260622120000_gamification_v1.sql`.
Expected: tabelas `badges`, `student_badges`, `device_tokens` criadas; colunas adicionadas a `profiles`.

- [ ] **Step 3: Commit**

```bash
git add backend/supabase/migrations/20260622120000_gamification_v1.sql
git commit -m "feat(db): tabelas de gamificacao V1 (badges, student_badges, device_tokens)"
```

## Task 2: Seed do catálogo de badges

**Files:**
- Create: `backend/supabase/migrations/20260622120100_seed_badges.sql`

- [ ] **Step 1: Escrever o seed**

```sql
-- Catálogo dos 7 badges da V1. Idempotente.
begin;

insert into public.badges (id, name, description, criteria_type, criteria_threshold, asset_key, sort_order, active) values
  ('first_step',      'Primeiro Passo',  'Concluiu o primeiro treino.',          'workout_count',   1,    'badge_first_step',      1, true),
  ('committed_5',     'Comprometido',    'Concluiu 5 treinos.',                  'workout_count',   5,    'badge_committed',       2, true),
  ('consistent_10',   'Consistente',     'Concluiu 10 treinos.',                 'workout_count',   10,   'badge_consistent',      3, true),
  ('dedicated_30',    'Dedicado',        'Concluiu 30 treinos.',                 'workout_count',   30,   'badge_dedicated',       4, true),
  ('personal_record', 'Recorde Pessoal', 'Bateu o primeiro recorde de carga.',   'personal_record', null, 'badge_personal_record', 5, true),
  ('fire_streak_7',   'Sequência de Fogo','Manteve 7 dias seguidos de treino.',  'streak',          7,    'badge_fire_streak',     6, true),
  ('legendary_30',    'Lendário',        'Manteve 30 dias seguidos de treino.', 'streak',          30,   'badge_legendary',       7, true)
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  criteria_type = excluded.criteria_type,
  criteria_threshold = excluded.criteria_threshold,
  asset_key = excluded.asset_key,
  sort_order = excluded.sort_order,
  active = excluded.active;

commit;
```

- [ ] **Step 2: Aplicar e verificar**

Run: `psql "$DATABASE_URL" -f backend/supabase/migrations/20260622120100_seed_badges.sql && psql "$DATABASE_URL" -c "select count(*) from public.badges;"`
Expected: `7`.

- [ ] **Step 3: Commit**

```bash
git add backend/supabase/migrations/20260622120100_seed_badges.sql
git commit -m "feat(db): seed do catalogo de 7 badges"
```

## Task 3: streakService — algoritmo rolling-24h (TDD)

**Files:**
- Create: `backend/api/src/services/streakService.ts`
- Test: `backend/api/test/streakService.unit.test.ts`

- [ ] **Step 1: Escrever o teste falho (lógica pura)**

```ts
import { describe, it, expect } from "vitest";
import { nextStreakState, effectiveStreak } from "../src/services/streakService.js";

const H = (h: number) => h * 60 * 60 * 1000;
const at = (iso: string) => new Date(iso);

describe("nextStreakState", () => {
  it("primeira atividade → streak 1", () => {
    const s = nextStreakState(
      { streak_current: 0, last_activity_at: null, last_credit_date: null },
      { at: at("2026-06-01T14:00:00Z"), localDate: "2026-06-01" },
    );
    expect(s.streak_current).toBe(1);
    expect(s.last_credit_date).toBe("2026-06-01");
  });

  it("dia seguinte dentro de 24h → +1", () => {
    const s = nextStreakState(
      { streak_current: 1, last_activity_at: at("2026-06-01T14:00:00Z"), last_credit_date: "2026-06-01" },
      { at: at("2026-06-02T13:00:00Z"), localDate: "2026-06-02" },
    );
    expect(s.streak_current).toBe(2);
  });

  it("mesmo dia local → sem crédito (debounce)", () => {
    const s = nextStreakState(
      { streak_current: 3, last_activity_at: at("2026-06-01T14:00:00Z"), last_credit_date: "2026-06-01" },
      { at: at("2026-06-01T18:00:00Z"), localDate: "2026-06-01" },
    );
    expect(s.streak_current).toBe(3);
    expect(s.last_activity_at).toEqual(at("2026-06-01T18:00:00Z"));
  });

  it("gap maior que 24h → reseta para 1", () => {
    const s = nextStreakState(
      { streak_current: 9, last_activity_at: at("2026-06-01T14:00:00Z"), last_credit_date: "2026-06-01" },
      { at: at("2026-06-02T15:00:00Z"), localDate: "2026-06-02" },
    );
    expect(s.streak_current).toBe(1);
  });
});

describe("effectiveStreak", () => {
  it("dentro de 24h mantém o valor", () => {
    expect(effectiveStreak(5, at("2026-06-02T13:00:00Z"), at("2026-06-02T20:00:00Z")))
      .toEqual({ streak_current: 5, is_broken: false });
  });
  it("acima de 24h sem atividade → 0 e quebrado", () => {
    expect(effectiveStreak(5, at("2026-06-01T14:00:00Z"), at("2026-06-02T15:00:00Z")))
      .toEqual({ streak_current: 0, is_broken: true });
  });
  it("sem atividade alguma → 0", () => {
    expect(effectiveStreak(0, null, at("2026-06-02T15:00:00Z")))
      .toEqual({ streak_current: 0, is_broken: false });
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `cd backend/api && npx vitest run test/streakService.unit.test.ts`
Expected: FAIL — módulo `streakService` não existe.

- [ ] **Step 3: Implementar o serviço (lógica pura + persistência)**

```ts
import type { PoolClient } from "pg";

const DAY_MS = 24 * 60 * 60 * 1000;

export interface StreakRow {
  streak_current: number;
  last_activity_at: Date | null;
  last_credit_date: string | null;
}

export interface StreakEvent {
  at: Date;
  localDate: string; // YYYY-MM-DD no fuso do aluno
}

export interface StreakState {
  streak_current: number;
  last_activity_at: Date;
  last_credit_date: string;
}

/** Lógica pura do streak rolling-24h com debounce de crédito por dia local. */
export function nextStreakState(prev: StreakRow, ev: StreakEvent): StreakState {
  const L = prev.last_activity_at;
  if (L == null) {
    return { streak_current: 1, last_activity_at: ev.at, last_credit_date: ev.localDate };
  }
  const gap = ev.at.getTime() - L.getTime();
  if (gap > DAY_MS) {
    return { streak_current: 1, last_activity_at: ev.at, last_credit_date: ev.localDate };
  }
  // dentro de 24h → vivo
  if (ev.localDate !== prev.last_credit_date) {
    return {
      streak_current: prev.streak_current + 1,
      last_activity_at: ev.at,
      last_credit_date: ev.localDate,
    };
  }
  // mesmo dia local → debounce: mantém streak, atualiza só o timestamp
  return {
    streak_current: prev.streak_current,
    last_activity_at: ev.at,
    last_credit_date: prev.last_credit_date,
  };
}

/** Valor efetivo na leitura: quebra se passou de 24h sem atividade. */
export function effectiveStreak(
  stored: number,
  lastActivityAt: Date | null,
  now: Date,
): { streak_current: number; is_broken: boolean } {
  if (lastActivityAt == null) return { streak_current: 0, is_broken: false };
  const broken = now.getTime() - lastActivityAt.getTime() > DAY_MS;
  return broken ? { streak_current: 0, is_broken: true } : { streak_current: stored, is_broken: false };
}

/** Recalcula e persiste o streak do aluno na transação dada. Retorna o novo estado. */
export async function recomputeStreak(
  client: PoolClient,
  studentId: string,
  ev: StreakEvent,
): Promise<StreakState> {
  const q = await client.query<StreakRow>(
    `select streak_current, last_activity_at, last_credit_date
       from public.profiles where id = $1`,
    [studentId],
  );
  const prev = q.rows[0] ?? { streak_current: 0, last_activity_at: null, last_credit_date: null };
  const next = nextStreakState(prev, ev);
  await client.query(
    `update public.profiles
        set streak_current = $2,
            streak_best = greatest(streak_best, $2),
            last_activity_at = $3,
            last_credit_date = $4,
            last_activity_date = $4::date,
            updated_at = now()
      where id = $1`,
    [studentId, next.streak_current, next.last_activity_at, next.last_credit_date],
  );
  return next;
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `cd backend/api && npx vitest run test/streakService.unit.test.ts`
Expected: PASS (todos os casos).

- [ ] **Step 5: Commit**

```bash
git add backend/api/src/services/streakService.ts backend/api/test/streakService.unit.test.ts
git commit -m "feat(api): streakService rolling-24h com debounce diario (TDD)"
```

## Task 4: badgeService — avaliação de conquistas (TDD)

**Files:**
- Create: `backend/api/src/services/badgeService.ts`
- Test: `backend/api/test/badgeService.unit.test.ts`

- [ ] **Step 1: Teste falho da lógica pura de seleção**

```ts
import { describe, it, expect } from "vitest";
import { selectNewlyEarned, type BadgeRow, type BadgeMetrics } from "../src/services/badgeService.js";

const catalog: BadgeRow[] = [
  { id: "first_step", name: "Primeiro Passo", description: "", criteria_type: "workout_count", criteria_threshold: 1, asset_key: "a", sort_order: 1, active: true },
  { id: "committed_5", name: "Comprometido", description: "", criteria_type: "workout_count", criteria_threshold: 5, asset_key: "a", sort_order: 2, active: true },
  { id: "fire_streak_7", name: "Sequência de Fogo", description: "", criteria_type: "streak", criteria_threshold: 7, asset_key: "a", sort_order: 3, active: true },
  { id: "personal_record", name: "Recorde Pessoal", description: "", criteria_type: "personal_record", criteria_threshold: null, asset_key: "a", sort_order: 4, active: true },
];

const metrics = (m: Partial<BadgeMetrics>): BadgeMetrics =>
  ({ total_workouts_completed: 0, streak_current: 0, had_pr: false, ...m });

describe("selectNewlyEarned", () => {
  it("desbloqueia first_step com 1 treino", () => {
    const r = selectNewlyEarned(catalog, new Set(), metrics({ total_workouts_completed: 1 }));
    expect(r.map((b) => b.id)).toEqual(["first_step"]);
  });
  it("desbloqueia first_step e committed_5 com 5 treinos", () => {
    const r = selectNewlyEarned(catalog, new Set(), metrics({ total_workouts_completed: 5 }));
    expect(r.map((b) => b.id).sort()).toEqual(["committed_5", "first_step"]);
  });
  it("não redesbloqueia o que já foi conquistado", () => {
    const r = selectNewlyEarned(catalog, new Set(["first_step"]), metrics({ total_workouts_completed: 5 }));
    expect(r.map((b) => b.id)).toEqual(["committed_5"]);
  });
  it("streak 7 desbloqueia fire_streak_7", () => {
    const r = selectNewlyEarned(catalog, new Set(), metrics({ streak_current: 7 }));
    expect(r.map((b) => b.id)).toEqual(["fire_streak_7"]);
  });
  it("PR desbloqueia personal_record", () => {
    const r = selectNewlyEarned(catalog, new Set(), metrics({ had_pr: true }));
    expect(r.map((b) => b.id)).toEqual(["personal_record"]);
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `cd backend/api && npx vitest run test/badgeService.unit.test.ts`
Expected: FAIL — módulo não existe.

- [ ] **Step 3: Implementar o serviço**

```ts
import type { PoolClient } from "pg";

export interface BadgeRow {
  id: string;
  name: string;
  description: string;
  criteria_type: "workout_count" | "streak" | "personal_record";
  criteria_threshold: number | null;
  asset_key: string;
  sort_order: number;
  active: boolean;
}

export interface BadgeMetrics {
  total_workouts_completed: number;
  streak_current: number;
  had_pr: boolean;
}

/** Lógica pura: badges do catálogo cujo critério é satisfeito e ainda não conquistados. */
export function selectNewlyEarned(
  catalog: BadgeRow[],
  earned: Set<string>,
  m: BadgeMetrics,
): BadgeRow[] {
  return catalog.filter((b) => {
    if (!b.active || earned.has(b.id)) return false;
    switch (b.criteria_type) {
      case "workout_count":
        return m.total_workouts_completed >= (b.criteria_threshold ?? Infinity);
      case "streak":
        return m.streak_current >= (b.criteria_threshold ?? Infinity);
      case "personal_record":
        return m.had_pr;
      default:
        return false;
    }
  });
}

/**
 * Avalia e persiste badges recém-conquistados na transação dada.
 * Retorna os badges recém-inseridos (para overlay/push).
 */
export async function evaluateBadges(
  client: PoolClient,
  studentId: string,
  m: BadgeMetrics,
  earnedAt: Date,
): Promise<BadgeRow[]> {
  const catQ = await client.query<BadgeRow>(
    `select id, name, description, criteria_type, criteria_threshold, asset_key, sort_order, active
       from public.badges where active = true order by sort_order`,
  );
  const earnedQ = await client.query<{ badge_id: string }>(
    `select badge_id from public.student_badges where student_id = $1`,
    [studentId],
  );
  const earned = new Set(earnedQ.rows.map((r) => r.badge_id));
  const candidates = selectNewlyEarned(catQ.rows, earned, m);

  const inserted: BadgeRow[] = [];
  for (const b of candidates) {
    const res = await client.query(
      `insert into public.student_badges (student_id, badge_id, earned_at, seen_at)
       values ($1, $2, $3, null)
       on conflict (student_id, badge_id) do nothing`,
      [studentId, b.id, earnedAt],
    );
    if ((res.rowCount ?? 0) > 0) inserted.push(b);
  }
  return inserted;
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `cd backend/api && npx vitest run test/badgeService.unit.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/api/src/services/badgeService.ts backend/api/test/badgeService.unit.test.ts
git commit -m "feat(api): badgeService de avaliacao de conquistas (TDD)"
```

## Task 5: Integrar streak + badges no finish/check-in

**Files:**
- Modify: `backend/api/src/routes/meStudentProgram.ts`
- Test: `backend/api/test/gamification.badges.int.test.ts`

- [ ] **Step 1: Teste de integração falho**

```ts
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
// reusar o harness existente (ver api/test/gamification.int.test.ts para o setup de app+pg-mem+token).
import { makeTestApp, seedStudent, authHeader } from "./helpers/testApp.js";

describe("badges no finish", () => {
  let ctx: Awaited<ReturnType<typeof makeTestApp>>;
  beforeAll(async () => { ctx = await makeTestApp(); });
  afterAll(async () => { await ctx.close(); });

  it("primeiro treino concluido retorna newly_earned_badges com first_step", async () => {
    const { studentId, token, sessionId } = await seedStudent(ctx, { withActiveSession: true });
    const res = await request(ctx.app)
      .post(`/me/workouts/sessions/${sessionId}/finish`)
      .set(authHeader(token))
      .send({ early_finish: false, with_check_in: true });
    expect(res.status).toBe(200);
    expect(res.body.newly_earned_badges.map((b: any) => b.id)).toContain("first_step");
  });

  it("GET /me/badges lista o badge conquistado como earned", async () => {
    const { token } = await seedStudent(ctx, { workoutsCompleted: 1 });
    const res = await request(ctx.app).get("/me/badges").set(authHeader(token));
    const first = res.body.badges.find((b: any) => b.id === "first_step");
    expect(first.earned).toBe(true);
  });
});
```

> Nota: `makeTestApp/seedStudent/authHeader` devem reaproveitar exatamente o padrão de `api/test/gamification.int.test.ts`. Se ainda não houver helper compartilhado, extrair um para `api/test/helpers/testApp.ts` como primeiro passo, copiando o setup já usado lá.

- [ ] **Step 2: Rodar e ver falhar**

Run: `cd backend/api && npx vitest run test/gamification.badges.int.test.ts`
Expected: FAIL — `newly_earned_badges` não existe no response.

- [ ] **Step 3: Editar o handler de finish**

No handler de `POST /me/workouts/sessions/:id/finish` em `meStudentProgram.ts`, **dentro da mesma transação** em que o check-in é gravado e logo após atualizar `total_workouts_completed`, inserir:

```ts
import { recomputeStreak } from "../services/streakService.js";
import { evaluateBadges, type BadgeRow } from "../services/badgeService.js";

// ... dentro da transação do finish, após gravar check-in e contadores:
const nowTs = new Date();
const localDateQ = await client.query<{ d: string }>(
  `select (timezone(coalesce(timezone,'UTC'), now()))::date::text as d
     from public.profiles where id = $1`,
  [studentId],
);
const localDate = localDateQ.rows[0]?.d ?? nowTs.toISOString().slice(0, 10);

const streak = await recomputeStreak(client, studentId, { at: nowTs, localDate });

const countQ = await client.query<{ total_workouts_completed: number }>(
  `select total_workouts_completed from public.profiles where id = $1`,
  [studentId],
);
const hadPr = (summary.load_evolution ?? []).some((e: { delta_kg: number }) => e.delta_kg > 0);

const newBadges: BadgeRow[] = await evaluateBadges(
  client,
  studentId,
  {
    total_workouts_completed: countQ.rows[0]?.total_workouts_completed ?? 0,
    streak_current: streak.streak_current,
    had_pr: hadPr,
  },
  nowTs,
);
```

Adicionar ao corpo da resposta JSON do finish: `newly_earned_badges: newBadges` (mapeado para `{ id, name, description, asset_key }`). Guardar `newBadges` num escopo acessível após o commit (para o push na Task 9).

- [ ] **Step 4: Aplicar o mesmo para POST /me/check-ins**

No handler de `POST /me/check-ins`, após inserir o check-in, chamar `recomputeStreak` e `evaluateBadges` (PR sempre `false` aqui, pois check-in manual não tem `load_evolution`). Incluir `newly_earned_badges` no response.

- [ ] **Step 5: Rodar e ver passar**

Run: `cd backend/api && npx vitest run test/gamification.badges.int.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add backend/api/src/routes/meStudentProgram.ts backend/api/test/
git commit -m "feat(api): finish/check-in recalculam streak e avaliam badges"
```

## Task 6: Rotas de badges (/me/badges, unseen, seen)

**Files:**
- Create: `backend/api/src/routes/meBadges.ts`
- Modify: `backend/api/src/app.ts`
- Modify: `backend/api/src/routes/meGamification.ts` (streak efetivo)

- [ ] **Step 1: Teste de integração falho**

```ts
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { makeTestApp, seedStudent, authHeader } from "./helpers/testApp.js";

describe("rotas de badges", () => {
  let ctx: Awaited<ReturnType<typeof makeTestApp>>;
  beforeAll(async () => { ctx = await makeTestApp(); });
  afterAll(async () => { await ctx.close(); });

  it("unseen lista conquista nao vista e seen marca como vista", async () => {
    const { token } = await seedStudent(ctx, { workoutsCompleted: 1 });
    const unseen1 = await request(ctx.app).get("/me/badges/unseen").set(authHeader(token));
    expect(unseen1.body.badges.length).toBeGreaterThan(0);

    await request(ctx.app).post("/me/badges/seen")
      .set(authHeader(token)).send({ badge_ids: ["first_step"] });

    const unseen2 = await request(ctx.app).get("/me/badges/unseen").set(authHeader(token));
    expect(unseen2.body.badges.find((b: any) => b.id === "first_step")).toBeUndefined();
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `cd backend/api && npx vitest run test/badges.routes.int.test.ts`
Expected: FAIL — rota 404.

- [ ] **Step 3: Implementar `meBadges.ts`**

```ts
import { Router } from "express";
import { z } from "zod";
import { authedUserId } from "../middleware/requireAuth.js";
import { withTx } from "../db.js";
import { sendInternalError } from "../schemaCompat.js";

const router = Router();

router.get("/badges", async (req, res) => {
  const studentId = authedUserId(req);
  try {
    const body = await withTx(async (client) => {
      const r = await client.query(
        `select b.id, b.name, b.description, b.asset_key, b.sort_order,
                (sb.id is not null) as earned, sb.earned_at
           from public.badges b
           left join public.student_badges sb
             on sb.badge_id = b.id and sb.student_id = $1
          where b.active = true
          order by b.sort_order`,
        [studentId],
      );
      return { badges: r.rows };
    });
    return res.json(body);
  } catch (e) {
    return sendInternalError(res, e);
  }
});

router.get("/badges/unseen", async (req, res) => {
  const studentId = authedUserId(req);
  try {
    const body = await withTx(async (client) => {
      const r = await client.query(
        `select b.id, b.name, b.description, b.asset_key, sb.earned_at
           from public.student_badges sb
           join public.badges b on b.id = sb.badge_id
          where sb.student_id = $1 and sb.seen_at is null
          order by sb.earned_at`,
        [studentId],
      );
      return { badges: r.rows };
    });
    return res.json(body);
  } catch (e) {
    return sendInternalError(res, e);
  }
});

const SeenBody = z.object({ badge_ids: z.array(z.string()).min(1) });

router.post("/badges/seen", async (req, res) => {
  const studentId = authedUserId(req);
  const parsed = SeenBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "invalid_body" });
  try {
    await withTx(async (client) => {
      await client.query(
        `update public.student_badges set seen_at = now()
          where student_id = $1 and badge_id = any($2::text[]) and seen_at is null`,
        [studentId, parsed.data.badge_ids],
      );
    });
    return res.json({ ok: true });
  } catch (e) {
    return sendInternalError(res, e);
  }
});

export default router;
```

- [ ] **Step 4: Montar a rota em `app.ts`**

Seguir o padrão de montagem das demais rotas `/me/*` (mesmo `requireAuth`). Adicionar:

```ts
import meBadges from "./routes/meBadges.js";
// junto das outras rotas autenticadas montadas sob "/me":
app.use("/me", requireAuth, meBadges);
```

(Usar exatamente o mesmo prefixo/middleware que `meGamification` já usa em `app.ts`.)

- [ ] **Step 5: Streak efetivo no weekly-overview**

Em `meGamification.ts`, substituir a leitura crua de `streak_current` por `effectiveStreak`:

```ts
import { effectiveStreak } from "../services/streakService.js";

const streakQ = await client.query<{ streak_current: number; streak_best: number; last_activity_at: Date | null }>(
  `select streak_current, streak_best, last_activity_at from public.profiles where id = $1`,
  [studentId],
);
const row = streakQ.rows[0];
const eff = effectiveStreak(row?.streak_current ?? 0, row?.last_activity_at ?? null, new Date());
const streak_current = eff.streak_current;
const streak_best = row?.streak_best ?? 0;
const is_broken = eff.is_broken;
```

Incluir `is_broken` e `last_activity_at` (ISO) no corpo retornado.

- [ ] **Step 6: Rodar e ver passar**

Run: `cd backend/api && npx vitest run test/badges.routes.int.test.ts test/gamification.int.test.ts`
Expected: PASS (incluindo os testes existentes de gamification).

- [ ] **Step 7: Commit**

```bash
git add backend/api/src/routes/meBadges.ts backend/api/src/app.ts backend/api/src/routes/meGamification.ts backend/api/test/
git commit -m "feat(api): rotas de badges + streak efetivo (is_broken) no weekly-overview"
```

## Task 7: Payload de gamificação para o Personal

**Files:**
- Modify: rota de listagem de alunos do profissional (`api/src/routes/` — localizar a que serve `GET /professional/students`)
- Test: `backend/api/test/professional.students.gamification.int.test.ts`

- [ ] **Step 1: Teste falho**

```ts
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { makeTestApp, seedProfessionalWithStudent, authHeader } from "./helpers/testApp.js";

describe("students do profissional incluem gamificacao", () => {
  let ctx: Awaited<ReturnType<typeof makeTestApp>>;
  beforeAll(async () => { ctx = await makeTestApp(); });
  afterAll(async () => { await ctx.close(); });

  it("cada aluno traz streak_current, is_broken e badge_count", async () => {
    const { proToken } = await seedProfessionalWithStudent(ctx, { studentStreak: 3, studentBadges: 2 });
    const res = await request(ctx.app).get("/professional/students").set(authHeader(proToken));
    const s = res.body.students[0];
    expect(typeof s.streak_current).toBe("number");
    expect(typeof s.is_broken).toBe("boolean");
    expect(s.badge_count).toBe(2);
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `cd backend/api && npx vitest run test/professional.students.gamification.int.test.ts`
Expected: FAIL — campos ausentes.

- [ ] **Step 3: Estender a query/serialização**

Na query de alunos, juntar streak e contagem de badges; aplicar `effectiveStreak` por aluno:

```sql
select p.id, p.full_name, p.email, p.avatar_url,
       p.streak_current, p.streak_best, p.last_activity_at,
       coalesce(bc.cnt, 0) as badge_count
  from public.profiles p
  left join (
    select student_id, count(*)::int as cnt
      from public.student_badges group by student_id
  ) bc on bc.student_id = p.id
 where /* ... vínculo profissional existente ... */
```

E, ao serializar cada linha, computar `is_broken`/`streak_current` efetivos via `effectiveStreak(row.streak_current, row.last_activity_at, new Date())`.

- [ ] **Step 4: Rodar e ver passar**

Run: `cd backend/api && npx vitest run test/professional.students.gamification.int.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/api/src/routes/ backend/api/test/
git commit -m "feat(api): students do profissional expoem streak e badge_count"
```

---

# FASE 2 — Push Notifications

## Task 8: Rota de device tokens

**Files:**
- Create: `backend/api/src/routes/deviceTokens.ts`
- Modify: `backend/api/src/app.ts`
- Test: `backend/api/test/deviceTokens.int.test.ts`

- [ ] **Step 1: Teste falho**

```ts
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { makeTestApp, seedStudent, authHeader } from "./helpers/testApp.js";

describe("device tokens", () => {
  let ctx: Awaited<ReturnType<typeof makeTestApp>>;
  beforeAll(async () => { ctx = await makeTestApp(); });
  afterAll(async () => { await ctx.close(); });

  it("registra token (upsert idempotente)", async () => {
    const { token } = await seedStudent(ctx, {});
    const body = { expo_push_token: "ExponentPushToken[abc]", platform: "ios" };
    const r1 = await request(ctx.app).post("/me/device-tokens").set(authHeader(token)).send(body);
    expect(r1.status).toBe(200);
    const r2 = await request(ctx.app).post("/me/device-tokens").set(authHeader(token)).send(body);
    expect(r2.status).toBe(200); // sem erro de duplicidade
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `cd backend/api && npx vitest run test/deviceTokens.int.test.ts`
Expected: FAIL — rota 404.

- [ ] **Step 3: Implementar a rota**

```ts
import { Router } from "express";
import { z } from "zod";
import { authedUserId } from "../middleware/requireAuth.js";
import { withTx } from "../db.js";
import { sendInternalError } from "../schemaCompat.js";

const router = Router();
const RegisterBody = z.object({
  expo_push_token: z.string().min(1),
  platform: z.enum(["ios", "android"]),
});

router.post("/device-tokens", async (req, res) => {
  const userId = authedUserId(req);
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "invalid_body" });
  try {
    await withTx(async (client) => {
      await client.query(
        `insert into public.device_tokens (user_id, expo_push_token, platform, last_seen_at)
         values ($1, $2, $3, now())
         on conflict (expo_push_token) do update
           set user_id = excluded.user_id, platform = excluded.platform, last_seen_at = now()`,
        [userId, parsed.data.expo_push_token, parsed.data.platform],
      );
    });
    return res.json({ ok: true });
  } catch (e) {
    return sendInternalError(res, e);
  }
});

router.delete("/device-tokens/:token", async (req, res) => {
  const userId = authedUserId(req);
  try {
    await withTx(async (client) => {
      await client.query(
        `delete from public.device_tokens where user_id = $1 and expo_push_token = $2`,
        [userId, req.params.token],
      );
    });
    return res.json({ ok: true });
  } catch (e) {
    return sendInternalError(res, e);
  }
});

export default router;
```

- [ ] **Step 4: Montar em `app.ts`** (mesmo padrão `app.use("/me", requireAuth, deviceTokens);`).

- [ ] **Step 5: Rodar e ver passar**

Run: `cd backend/api && npx vitest run test/deviceTokens.int.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add backend/api/src/routes/deviceTokens.ts backend/api/src/app.ts backend/api/test/deviceTokens.int.test.ts
git commit -m "feat(api): registro/remocao de device tokens para push"
```

## Task 9: pushService + disparo no desbloqueio

**Files:**
- Create: `backend/api/src/services/pushService.ts`
- Modify: `backend/api/src/routes/meStudentProgram.ts` (disparo pós-commit)
- Test: `backend/api/test/pushService.unit.test.ts`

- [ ] **Step 1: Instalar dependência**

Run: `cd backend/api && npm install expo-server-sdk`
Expected: adicionado ao `package.json`.

- [ ] **Step 2: Teste falho (mensagem montada por badge)**

```ts
import { describe, it, expect } from "vitest";
import { buildBadgeMessages } from "../src/services/pushService.js";

describe("buildBadgeMessages", () => {
  it("monta uma mensagem por token com titulo e deep link", () => {
    const msgs = buildBadgeMessages(
      ["ExponentPushToken[a]", "ExponentPushToken[b]"],
      { id: "first_step", name: "Primeiro Passo" },
    );
    expect(msgs).toHaveLength(2);
    expect(msgs[0].title).toContain("Nova Conquista");
    expect(msgs[0].body).toContain("Primeiro Passo");
    expect(msgs[0].data).toEqual({ type: "badge", badge_id: "first_step" });
  });
});
```

- [ ] **Step 3: Rodar e ver falhar**

Run: `cd backend/api && npx vitest run test/pushService.unit.test.ts`
Expected: FAIL — módulo não existe.

- [ ] **Step 4: Implementar o serviço**

```ts
import { Expo, type ExpoPushMessage } from "expo-server-sdk";
import type { PoolClient } from "pg";

const expo = new Expo();

export function buildBadgeMessages(
  tokens: string[],
  badge: { id: string; name: string },
): ExpoPushMessage[] {
  return tokens
    .filter((t) => Expo.isExpoPushToken(t))
    .map((to) => ({
      to,
      sound: "default",
      title: "🏆 Nova Conquista!",
      body: `${badge.name} desbloqueado. Toque para ver`,
      data: { type: "badge", badge_id: badge.id },
    }));
}

/** Busca tokens do aluno (nova conexão — chamar APÓS o commit). */
export async function tokensForUser(client: PoolClient, userId: string): Promise<string[]> {
  const r = await client.query<{ expo_push_token: string }>(
    `select expo_push_token from public.device_tokens where user_id = $1`,
    [userId],
  );
  return r.rows.map((x) => x.expo_push_token);
}

/** Envio best-effort; poda tokens DeviceNotRegistered. Nunca lança. */
export async function sendBadgeNotifications(
  client: PoolClient,
  userId: string,
  badges: { id: string; name: string }[],
): Promise<void> {
  if (badges.length === 0) return;
  try {
    const tokens = await tokensForUser(client, userId);
    if (tokens.length === 0) return;
    const messages = badges.flatMap((b) => buildBadgeMessages(tokens, b));
    const chunks = expo.chunkPushNotifications(messages);
    for (const chunk of chunks) {
      const tickets = await expo.sendPushNotificationsAsync(chunk);
      for (let i = 0; i < tickets.length; i++) {
        const t = tickets[i];
        if (t.status === "error" && t.details?.error === "DeviceNotRegistered") {
          const dead = chunk[i].to as string;
          await client.query(`delete from public.device_tokens where expo_push_token = $1`, [dead]);
        }
      }
    }
  } catch {
    // best-effort: falha de push não afeta a conquista.
  }
}
```

- [ ] **Step 5: Disparar após o commit no finish/check-in**

No handler de finish (e check-in), depois do `withTx(...)` retornar com sucesso e havendo `newly_earned_badges`, chamar (fora da transação principal):

```ts
import { withTx } from "../db.js";
import { sendBadgeNotifications } from "../services/pushService.js";

// após o commit, com newBadges disponível:
if (newBadges.length > 0) {
  await withTx((client) =>
    sendBadgeNotifications(client, studentId, newBadges.map((b) => ({ id: b.id, name: b.name }))),
  );
}
```

- [ ] **Step 6: Rodar e ver passar**

Run: `cd backend/api && npx vitest run test/pushService.unit.test.ts`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add backend/api/src/services/pushService.ts backend/api/src/routes/meStudentProgram.ts backend/api/package.json backend/api/package-lock.json backend/api/test/pushService.unit.test.ts
git commit -m "feat(api): push de conquista via Expo (best-effort, poda token morto)"
```

---

# FASE 3 — App Aluno

## Task 10: Tipos e endpoints de badges

**Files:**
- Modify: `app/src/types/gamification.ts`
- Modify: `app/src/api/endpoints.ts`

- [ ] **Step 1: Adicionar schemas em `gamification.ts`**

```ts
// Badge do catálogo + status de conquista (GET /me/badges).
export const BadgeSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  asset_key: z.string(),
  sort_order: z.number().int().optional(),
  earned: z.boolean().optional(),
  earned_at: z.string().nullable().optional(),
});
export type Badge = z.infer<typeof BadgeSchema>;

export const BadgeListSchema = z.object({ badges: z.array(BadgeSchema) });
export type BadgeList = z.infer<typeof BadgeListSchema>;
```

E estender `WeeklyOverviewSchema` com:

```ts
  is_broken: z.boolean().optional(),
  last_activity_at: z.string().nullable().optional(),
```

- [ ] **Step 2: Adicionar paths em `endpoints.ts`** (dentro de `me`)

```ts
    badges: '/me/badges',
    badgesUnseen: '/me/badges/unseen',
    badgesSeen: '/me/badges/seen',
    deviceTokens: '/me/device-tokens',
```

- [ ] **Step 3: Verificar typecheck**

Run: `cd app && npx tsc --noEmit`
Expected: sem erros novos.

- [ ] **Step 4: Commit**

```bash
git add app/src/types/gamification.ts app/src/api/endpoints.ts
git commit -m "feat(app): tipos e endpoints de badges + is_broken no weekly-overview"
```

## Task 11: Hooks de badges

**Files:**
- Create: `app/src/hooks/useBadges.ts`, `app/src/hooks/useUnseenBadges.ts`, `app/src/hooks/useMarkBadgesSeen.ts`

- [ ] **Step 1: `useBadges.ts`**

```ts
import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { api } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { parseApi } from '@/api/parseApi';
import { BadgeListSchema, type BadgeList } from '@/types/gamification';
import { useAuthStore } from '@/store/authStore';

export const badgesQueryKey = ['me', 'badges'] as const;

export function useBadges(): UseQueryResult<BadgeList, unknown> {
  const status = useAuthStore((s) => s.status);
  return useQuery({
    queryKey: badgesQueryKey,
    queryFn: async () => parseApi(BadgeListSchema, (await api.get(endpoints.me.badges)).data),
    enabled: status === 'authenticated',
  });
}
```

- [ ] **Step 2: `useUnseenBadges.ts`** (mesmo padrão, key `['me','badges','unseen']`, path `endpoints.me.badgesUnseen`).

- [ ] **Step 3: `useMarkBadgesSeen.ts`**

```ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import { endpoints } from '@/api/endpoints';

export function useMarkBadgesSeen() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (badgeIds: string[]) => {
      await api.post(endpoints.me.badgesSeen, { badge_ids: badgeIds });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['me', 'badges'] });
    },
  });
}
```

- [ ] **Step 4: Typecheck + commit**

Run: `cd app && npx tsc --noEmit` → sem erros novos.

```bash
git add app/src/hooks/useBadges.ts app/src/hooks/useUnseenBadges.ts app/src/hooks/useMarkBadgesSeen.ts
git commit -m "feat(app): hooks de badges (lista, unseen, marcar visto)"
```

## Task 12: finish retorna badges + invalidação

**Files:**
- Modify: `app/src/hooks/useSessionMutations.ts`
- Modify: o schema `WorkoutFinishResponseSchema` (localizar onde é definido — provavelmente `src/types/`)

- [ ] **Step 1: Adicionar `newly_earned_badges` ao schema do finish**

No `WorkoutFinishResponseSchema`, adicionar:

```ts
  newly_earned_badges: z.array(BadgeSchema).optional().default([]),
```

(importar `BadgeSchema` de `@/types/gamification`).

- [ ] **Step 2: Invalidar caches de badges no `onSuccess` do finish**

Em `useSessionMutations.ts`, no `onSuccess` de `finish`, adicionar:

```ts
      queryClient.invalidateQueries({ queryKey: ['me', 'badges'] });
      queryClient.invalidateQueries({ queryKey: ['me', 'badges', 'unseen'] });
```

- [ ] **Step 3: Typecheck + commit**

Run: `cd app && npx tsc --noEmit` → sem erros novos.

```bash
git add app/src/hooks/useSessionMutations.ts app/src/types/
git commit -m "feat(app): finish carrega badges recem-conquistados e invalida cache"
```

## Task 13: StreakCounter na home (TDD de componente)

**Files:**
- Create: `app/src/components/gamification/StreakCounter.tsx`
- Test: `app/src/components/gamification/StreakCounter.test.tsx`
- Modify: `app/app/(aluno)/(tabs)/index.tsx`

- [ ] **Step 1: Teste falho**

```tsx
import { render, screen } from '@testing-library/react-native';
import { StreakCounter } from './StreakCounter';

describe('StreakCounter', () => {
  it('mostra o número de dias e o rótulo', () => {
    render(<StreakCounter streak={7} isBroken={false} />);
    expect(screen.getByText('7')).toBeTruthy();
    expect(screen.getByText(/dias seguidos/i)).toBeTruthy();
  });

  it('quando quebrado mostra a mensagem de recomeço', () => {
    render(<StreakCounter streak={0} isBroken />);
    expect(screen.getByText(/Comece de novo/i)).toBeTruthy();
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `cd app && npx jest src/components/gamification/StreakCounter.test.tsx`
Expected: FAIL — componente não existe.

- [ ] **Step 3: Implementar o componente**

```tsx
import { View } from 'react-native';
import { Flame } from 'phosphor-react-native';
import { AppText } from '@/components/ui/AppText';
import { useTheme } from '@/theme';

export function StreakCounter({ streak, isBroken }: { streak: number; isBroken: boolean }) {
  const theme = useTheme();
  return (
    <View accessibilityRole="summary" style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <Flame weight="fill" color={streak > 0 ? theme.colors.neon : theme.colors.textSecondary} size={32} />
      <View>
        <AppText.dataBig>{String(streak)}</AppText.dataBig>
        {isBroken ? (
          <AppText.caption>Comece de novo, você consegue!</AppText.caption>
        ) : (
          <AppText.caption>dias seguidos</AppText.caption>
        )}
      </View>
    </View>
  );
}
```

> Ajustar imports (`AppText`, `useTheme`, cores) aos nomes reais do design system — conferir um componente vizinho como `MyPositionCard.tsx`.

- [ ] **Step 4: Rodar e ver passar**

Run: `cd app && npx jest src/components/gamification/StreakCounter.test.tsx`
Expected: PASS.

- [ ] **Step 5: Inserir na home**

Em `app/(aluno)/(tabs)/index.tsx`, consumir `useWeeklyOverview()` e renderizar `<StreakCounter streak={data.streak_current} isBroken={data.is_broken ?? false} />` no topo do conteúdo. Para a animação de pulso/fumaça, comparar com o valor anterior guardado (ver Task 16).

- [ ] **Step 6: Commit**

```bash
git add app/src/components/gamification/StreakCounter.tsx app/src/components/gamification/StreakCounter.test.tsx "app/app/(aluno)/(tabs)/index.tsx"
git commit -m "feat(app): StreakCounter na home do aluno (TDD)"
```

## Task 14: BadgeGrid + tela de badges

**Files:**
- Create: `app/src/components/gamification/BadgeGrid.tsx`
- Test: `app/src/components/gamification/BadgeGrid.test.tsx`
- Create: `app/app/(aluno)/badges.tsx`
- Modify: `app/app/(aluno)/(tabs)/perfil.tsx` (link)

- [ ] **Step 1: Teste falho do grid**

```tsx
import { render, screen } from '@testing-library/react-native';
import { BadgeGrid } from './BadgeGrid';

const badges = [
  { id: 'first_step', name: 'Primeiro Passo', description: '', asset_key: 'a', earned: true },
  { id: 'committed_5', name: 'Comprometido', description: '', asset_key: 'a', earned: false },
];

describe('BadgeGrid', () => {
  it('renderiza todos os badges e marca os bloqueados', () => {
    render(<BadgeGrid badges={badges as any} />);
    expect(screen.getByText('Primeiro Passo')).toBeTruthy();
    expect(screen.getByTestId('badge-committed_5-locked')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `cd app && npx jest src/components/gamification/BadgeGrid.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implementar o grid**

```tsx
import { View } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import type { Badge } from '@/types/gamification';

export function BadgeGrid({ badges }: { badges: Badge[] }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
      {badges.map((b) => (
        <View
          key={b.id}
          testID={b.earned ? `badge-${b.id}` : `badge-${b.id}-locked`}
          style={{ width: '28%', alignItems: 'center', opacity: b.earned ? 1 : 0.35 }}
        >
          {/* Ilustração via asset_key; placeholder até as artes finais */}
          <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#222' }} />
          <AppText.caption>{b.name}</AppText.caption>
        </View>
      ))}
    </View>
  );
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `cd app && npx jest src/components/gamification/BadgeGrid.test.tsx`
Expected: PASS.

- [ ] **Step 5: Tela `app/(aluno)/badges.tsx`**

```tsx
import { ScrollView } from 'react-native';
import { useBadges } from '@/hooks/useBadges';
import { BadgeGrid } from '@/components/gamification/BadgeGrid';
import { ScreenHeader } from '@/components/ui/ScreenHeader';

export default function BadgesScreen() {
  const { data } = useBadges();
  return (
    <ScrollView>
      <ScreenHeader title="Conquistas" />
      <BadgeGrid badges={data?.badges ?? []} />
    </ScrollView>
  );
}
```

> Conferir o nome real do header reutilizável (ex.: `ScreenHeader`) num arquivo de tela vizinho.

- [ ] **Step 6: Link no perfil** — em `perfil.tsx`, adicionar item que navega para `/(aluno)/badges` (usar `router.push` do expo-router, seguindo navegação já usada na tela).

- [ ] **Step 7: Commit**

```bash
git add app/src/components/gamification/BadgeGrid.tsx app/src/components/gamification/BadgeGrid.test.tsx "app/app/(aluno)/badges.tsx" "app/app/(aluno)/(tabs)/perfil.tsx"
git commit -m "feat(app): tela e grid de badges, link no perfil"
```

## Task 15: BadgeUnlockOverlay + fila (Lottie + som + haptics)

**Files:**
- Create: `app/src/components/gamification/BadgeUnlockOverlay.tsx`, `app/src/components/gamification/BadgeUnlockQueue.tsx`
- Test: `app/src/components/gamification/BadgeUnlockOverlay.test.tsx`

- [ ] **Step 1: Instalar dependências**

Run: `cd app && npx expo install lottie-react-native expo-audio`
Expected: adicionadas ao `package.json` na versão compatível com o SDK.

- [ ] **Step 2: Teste falho do overlay**

```tsx
import { render, screen, fireEvent } from '@testing-library/react-native';
import { BadgeUnlockOverlay } from './BadgeUnlockOverlay';

describe('BadgeUnlockOverlay', () => {
  it('mostra o nome do badge e chama onContinue', () => {
    const onContinue = jest.fn();
    render(
      <BadgeUnlockOverlay
        badge={{ id: 'first_step', name: 'Primeiro Passo', description: '', asset_key: 'a' }}
        onContinue={onContinue}
      />,
    );
    expect(screen.getByText(/Você conquistou/i)).toBeTruthy();
    expect(screen.getByText('Primeiro Passo')).toBeTruthy();
    fireEvent.press(screen.getByText('Continuar'));
    expect(onContinue).toHaveBeenCalled();
  });
});
```

> Mockar `lottie-react-native`, `expo-audio` e `expo-haptics` no `jest.setup.js` (seguir mocks já existentes lá).

- [ ] **Step 3: Rodar e ver falhar**

Run: `cd app && npx jest src/components/gamification/BadgeUnlockOverlay.test.tsx`
Expected: FAIL.

- [ ] **Step 4: Implementar o overlay**

```tsx
import { useEffect } from 'react';
import { Modal, View, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import { AppText } from '@/components/ui/AppText';
import type { Badge } from '@/types/gamification';

const AUTO_DISMISS_MS = 3000;

export function BadgeUnlockOverlay({ badge, onContinue }: { badge: Badge; onContinue: () => void }) {
  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    const t = setTimeout(onContinue, AUTO_DISMISS_MS);
    return () => clearTimeout(t);
  }, [badge.id, onContinue]);

  return (
    <Modal transparent animationType="fade" visible>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.85)', gap: 16 }}>
        {/* Lottie da ilustração + confete; placeholder até as artes */}
        <View style={{ width: 160, height: 160, borderRadius: 80, backgroundColor: '#333' }} />
        <AppText.caption>Você conquistou:</AppText.caption>
        <AppText.dataBig>{badge.name}</AppText.dataBig>
        <Pressable onPress={onContinue} accessibilityRole="button">
          <AppText.body>Continuar</AppText.body>
        </Pressable>
      </View>
    </Modal>
  );
}
```

- [ ] **Step 5: `BadgeUnlockQueue.tsx`** — recebe `Badge[]`, exibe um overlay por vez; ao `onContinue`, avança a fila e chama `useMarkBadgesSeen().mutate([badge.id])`.

```tsx
import { useState } from 'react';
import { BadgeUnlockOverlay } from './BadgeUnlockOverlay';
import { useMarkBadgesSeen } from '@/hooks/useMarkBadgesSeen';
import type { Badge } from '@/types/gamification';

export function BadgeUnlockQueue({ badges, onDone }: { badges: Badge[]; onDone?: () => void }) {
  const [i, setI] = useState(0);
  const markSeen = useMarkBadgesSeen();
  if (i >= badges.length) return null;
  const badge = badges[i];
  return (
    <BadgeUnlockOverlay
      badge={badge}
      onContinue={() => {
        markSeen.mutate([badge.id]);
        if (i + 1 >= badges.length) onDone?.();
        setI((n) => n + 1);
      }}
    />
  );
}
```

- [ ] **Step 6: Rodar e ver passar**

Run: `cd app && npx jest src/components/gamification/BadgeUnlockOverlay.test.tsx`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add app/src/components/gamification/BadgeUnlockOverlay.tsx app/src/components/gamification/BadgeUnlockQueue.tsx app/src/components/gamification/BadgeUnlockOverlay.test.tsx app/package.json app/package-lock.json app/jest.setup.js
git commit -m "feat(app): overlay e fila de conquista (Lottie/som/haptics, TDD)"
```

## Task 16: Disparo do overlay (online + offline) e fumaça do streak

**Files:**
- Modify: `app/app/(aluno)/sessao/[id].tsx` (overlay online a partir do finish)
- Create: `app/src/components/gamification/UnseenBadgeWatcher.tsx` (banner offline)
- Modify: `app/app/(aluno)/_layout.tsx` (montar o watcher)

- [ ] **Step 1: Overlay online no fim da sessão**

Em `sessao/[id].tsx`, após `mutations.finish.mutate(...)` resolver, ler `result.newly_earned_badges`; se houver, renderizar `<BadgeUnlockQueue badges={result.newly_earned_badges} />`.

- [ ] **Step 2: Watcher de conquista offline**

`UnseenBadgeWatcher` usa `useUnseenBadges()`; ao montar (abertura do app), se houver badges não-vistos, exibe banner in-app "Você desbloqueou novas conquistas!" que ao tocar navega para `/(aluno)/badges` e abre a fila do overlay. Marca como visto ao exibir a fila.

```tsx
import { useUnseenBadges } from '@/hooks/useUnseenBadges';
import { BadgeUnlockQueue } from './BadgeUnlockQueue';
import { useState } from 'react';

export function UnseenBadgeWatcher() {
  const { data } = useUnseenBadges();
  const [open, setOpen] = useState(false);
  const badges = data?.badges ?? [];
  if (badges.length === 0) return null;
  if (!open) {
    // Banner simples; ao tocar abre a fila.
    return <BannerInApp text="Você desbloqueou novas conquistas! Toque para ver" onPress={() => setOpen(true)} />;
  }
  return <BadgeUnlockQueue badges={badges} onDone={() => setOpen(false)} />;
}
```

> Reutilizar um componente de banner existente se houver; senão, criar um mínimo `BannerInApp`.

- [ ] **Step 3: Fumaça do streak na home**

Em `index.tsx`, guardar o último `streak_current` conhecido em `expo-secure-store`/AsyncStorage (conferir o que o projeto já usa). Quando o valor novo for `0`/`is_broken` e o anterior era `> 0`, mostrar a animação de fumaça + mensagem por 2s (reanimated). Quando incrementar, aplicar o pulso.

- [ ] **Step 4: Verificação manual**

Run: `cd app && npx jest` (suite completa) → sem regressões.
Verificar no app dev: concluir um treino dispara o overlay; reabrir com conquista pendente mostra o banner.

- [ ] **Step 5: Commit**

```bash
git add app/app/ app/src/components/gamification/
git commit -m "feat(app): disparo de overlay (online/offline) e fumaca do streak"
```

## Task 17: Registro de push token no app

**Files:**
- Create: `app/src/lib/push.ts`, `app/src/hooks/useRegisterPushToken.ts`
- Modify: `app/app/(aluno)/_layout.tsx` (registrar ao autenticar); config em `app/app.config.ts` se necessário

- [ ] **Step 1: Instalar e configurar**

Run: `cd app && npx expo install expo-notifications`
Configurar handler de notificação e, em `app.config.ts`, o plugin `expo-notifications` se exigido.

- [ ] **Step 2: `src/lib/push.ts`**

```ts
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export async function getExpoPushToken(): Promise<{ token: string; platform: 'ios' | 'android' } | null> {
  const settings = await Notifications.getPermissionsAsync();
  let granted = settings.granted;
  if (!granted) {
    granted = (await Notifications.requestPermissionsAsync()).granted;
  }
  if (!granted) return null;
  const { data } = await Notifications.getExpoPushTokenAsync();
  return { token: data, platform: Platform.OS === 'ios' ? 'ios' : 'android' };
}
```

- [ ] **Step 3: `useRegisterPushToken.ts`** — ao autenticar, chama `getExpoPushToken()` e `POST endpoints.me.deviceTokens`; configura listener de tap → deep link para `/(aluno)/badges`.

- [ ] **Step 4: Montar no layout do aluno** — chamar o hook em `(aluno)/_layout.tsx` quando `status === 'authenticated'`.

- [ ] **Step 5: Verificação**

Run: `cd app && npx tsc --noEmit` → sem erros.
Validar token real em build dev/EAS (não funciona no Expo Go).

- [ ] **Step 6: Commit**

```bash
git add app/src/lib/push.ts app/src/hooks/useRegisterPushToken.ts "app/app/(aluno)/_layout.tsx" app/app.config.ts
git commit -m "feat(app): registro de Expo push token e deep link de conquista"
```

## Task 18: Mini-indicador no card do aluno (app personal)

**Files:**
- Modify: `app/src/components/professional/StudentRow.tsx`
- Modify: o tipo/hook que carrega a lista de alunos do profissional (incluir `streak_current`, `is_broken`, `badge_count`)
- Test: `app/src/components/professional/StudentRow.test.tsx` (criar se não existir)

- [ ] **Step 1: Teste falho**

```tsx
import { render, screen } from '@testing-library/react-native';
import { StudentRow } from './StudentRow';

it('mostra streak e contagem de badges quando presentes', () => {
  render(<StudentRow name="Marina" email="m@x.com" streakCurrent={5} badgeCount={3} />);
  expect(screen.getByText('5')).toBeTruthy();
  expect(screen.getByText(/3/)).toBeTruthy();
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `cd app && npx jest src/components/professional/StudentRow.test.tsx`
Expected: FAIL — props não existem.

- [ ] **Step 3: Estender `StudentRow`** — adicionar props opcionais `streakCurrent?: number`, `badgeCount?: number`; renderizar Flame + número e um indicador de badges (ícone Trophy + contagem) quando presentes.

- [ ] **Step 4: Passar dados reais** — no schema/hook da lista de alunos, parsear `streak_current`, `is_broken`, `badge_count` e repassar ao `StudentRow`.

- [ ] **Step 5: Rodar e ver passar + commit**

Run: `cd app && npx jest src/components/professional/StudentRow.test.tsx` → PASS.

```bash
git add app/src/components/professional/StudentRow.tsx app/src/components/professional/StudentRow.test.tsx app/src/hooks/ app/src/types/
git commit -m "feat(app): mini-indicador de streak/badges no card do aluno (personal)"
```

---

# FASE 4 — Personal Web

## Task 19: Hook e tipos de gamificação no web

**Files:**
- Create: `web/src/hooks/useStudentGamification.ts`
- Modify: o tipo/parse da lista de alunos do web para incluir `streak_current`, `is_broken`, `badge_count`

- [ ] **Step 1: Adicionar campos ao schema zod da lista de alunos do web** (localizar onde os alunos são parseados — seguir o padrão axios + zod do projeto):

```ts
  streak_current: z.number().int().min(0).optional(),
  is_broken: z.boolean().optional(),
  badge_count: z.number().int().min(0).optional(),
```

- [ ] **Step 2: (Se houver detalhe do aluno) `useStudentGamification.ts`** — busca badges do aluno via endpoint do profissional, seguindo o padrão de hooks do web (axios + react-query + zod).

- [ ] **Step 3: Typecheck + commit**

Run: `cd web && npx tsc -b` → sem erros.

```bash
git add web/src/hooks/ web/src/
git commit -m "feat(web): tipos/hook de gamificacao do aluno"
```

## Task 20: Componentes StreakBadge + StudentBadges no web

**Files:**
- Create: `web/src/components/StreakBadge.tsx`, `web/src/components/StudentBadges.tsx`
- Modify: página de lista/detalhe de alunos do web

- [ ] **Step 1: `StreakBadge.tsx`**

```tsx
export function StreakBadge({ streak, isBroken }: { streak: number; isBroken?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1 text-sm">
      <span aria-hidden>🔥</span>
      <span className={isBroken ? 'text-gray-400' : 'font-semibold'}>{streak}</span>
    </span>
  );
}
```

> Ajustar classes Tailwind/tokens ao design system do web (conferir um componente vizinho).

- [ ] **Step 2: `StudentBadges.tsx`** — recebe `badgeCount` (ou lista) e renderiza ícone de troféu + contagem; no detalhe do aluno, grid simples de badges.

- [ ] **Step 3: Inserir nos cards/linhas de aluno** — na página de alunos, renderizar `<StreakBadge>` e `<StudentBadges>` por aluno usando os campos do schema estendido.

- [ ] **Step 4: Verificação**

Run: `cd web && npm run build` → build OK.
Abrir a lista de alunos e conferir streak/badges renderizados.

- [ ] **Step 5: Commit**

```bash
git add web/src/components/StreakBadge.tsx web/src/components/StudentBadges.tsx web/src/
git commit -m "feat(web): exibe streak e badges do aluno para o personal"
```

---

## Pendências de assets (rastrear fora do código)
- 7 ilustrações Lottie de badge + 1 confete (`asset_key`: `badge_first_step`, `badge_committed`, `badge_consistent`, `badge_dedicated`, `badge_personal_record`, `badge_fire_streak`, `badge_legendary`).
- 1 arquivo de som de conquista.
- Enquanto não chegam, os componentes usam placeholders (círculos/ícones Phosphor) — substituir o render de `asset_key` por `<LottieView>` quando os arquivos existirem.

## Validação final (após todas as tasks)
- Backend: `cd backend/api && npx vitest run` → tudo verde.
- App: `cd app && npx jest` → tudo verde; `npx tsc --noEmit` limpo.
- Web: `cd web && npm run build` → OK.
- Fluxo manual em build dev: concluir treino → overlay + push; reabrir com conquista offline → banner; quebra de streak → fumaça; Personal vê streak/badges no app e no web.
