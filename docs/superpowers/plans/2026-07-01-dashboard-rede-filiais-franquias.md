# Dashboard de Rede (Filiais/Franquias) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permitir que uma academia matriz (`network_hq`) visualize um dashboard consolidado das suas filiais/franquias (`unit`), sem alterar o comportamento do dashboard individual existente.

**Architecture:** Vínculo de rede via `academies.parent_academy_id` (autorreferente) + `academies.network_role` (`standalone|network_hq|unit`). Nova rota `/academy/network*` reaproveita a mesma agregação de `/academy/dashboard`, rodada por unidade e somada. Frontend ganha uma página nova (`NetworkDashboardPage`) visível só para gestores de `network_hq`; o dashboard de cada unidade continua igual.

**Tech Stack:** Node/Express + TypeScript (backend), Postgres/Supabase migrations, pg-mem para testes de integração (vitest + supertest), React + TanStack Query + Zod (frontend).

---

## Task 1: Migration — `parent_academy_id` e `network_role` em `academies`

**Files:**
- Create: `backend/supabase/migrations/20260701120000_actus_academy_network.sql`
- Modify: `backend/api/test/helpers/testDb.ts:330-340` (espelha a migration pro pg-mem)

- [ ] **Step 1: Escrever a migration**

```sql
-- backend/supabase/migrations/20260701120000_actus_academy_network.sql
-- Actus: Rede de academias (filiais/franquias). Complemento da TEC-53 — pedido do Matheus
-- (Incluir uma visualização por Filiais e Franquias). Cada filial/franquia continua sendo uma
-- `academies` row independente (próprio gestor/equipe/alunos); o vínculo de rede é só um campo a
-- mais. Sem impacto no dashboard individual existente.

begin;

create type public.academy_network_role as enum ('standalone', 'network_hq', 'unit');

alter table public.academies
  add column if not exists network_role public.academy_network_role not null default 'standalone',
  add column if not exists parent_academy_id uuid references public.academies (id);

alter table public.academies
  add constraint academies_network_role_parent_consistency check (
    (network_role = 'unit' and parent_academy_id is not null) or
    (network_role != 'unit' and parent_academy_id is null)
  );

create index if not exists academies_parent_academy_id_idx on public.academies (parent_academy_id);

commit;
```

- [ ] **Step 2: Espelhar no schema de teste (pg-mem)**

Em `backend/api/test/helpers/testDb.ts`, adicionar o enum antes da tabela `academies` (linha ~326, junto dos outros enums do módulo academia) e as duas colunas na definição de `academies` (linhas 330-340):

```sql
create type public.academy_network_role as enum ('standalone', 'network_hq', 'unit');
```

```sql
create table public.academies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text,
  cnpj text,
  timezone text not null default 'America/Sao_Paulo',
  status text not null default 'active',
  network_role public.academy_network_role not null default 'standalone',
  parent_academy_id uuid references public.academies (id),
  created_by uuid references public.app_users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

(pg-mem não valida `check` constraints de forma confiável — a consistência `unit` + `parent_academy_id` é reforçada em código no Task 2, não no schema de teste.)

- [ ] **Step 3: Rodar os testes existentes do módulo academia para garantir que nada quebrou**

Run: `cd backend/api && npx vitest run test/academy.int.test.ts`
Expected: todos os testes existentes continuam passando (a migration só adiciona colunas com default).

- [ ] **Step 4: Commit**

```bash
git add backend/supabase/migrations/20260701120000_actus_academy_network.sql backend/api/test/helpers/testDb.ts
git commit -m "feat(backend): schema de rede de academias (parent_academy_id, network_role)"
```

---

## Task 2: Backend — vincular academia a uma rede na criação (admin)

**Files:**
- Modify: `backend/api/src/routes/adminAcademies.ts:14-24` (schema), `:63-86` (POST /admin/academies)
- Test: `backend/api/test/academyNetwork.int.test.ts` (novo arquivo)

- [ ] **Step 1: Escrever o teste de integração (falha esperada)**

```typescript
// backend/api/test/academyNetwork.int.test.ts
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import request from "supertest";
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { createApp } from "../src/app.js";
import { closePool, setPoolForTests } from "../src/db.js";
import { createInMemoryPg, minimalSchemaSql } from "./helpers/testDb.js";

describe("Rede de academias (filiais/franquias)", () => {
  let pool: any;
  let app: ReturnType<typeof createApp>;

  beforeAll(async () => {
    const mem = createInMemoryPg();
    pool = mem.pool;
    setPoolForTests(pool);
    process.env.JWT_ACCESS_SECRET = "test-secret";
    process.env.NODE_ENV = "test";
    process.env.REFRESH_TOKEN_TTL_DAYS = "30";
    process.env.DEFAULT_MAX_ACTIVE_INVITES = "20";
    await pool.query(minimalSchemaSql);
    app = createApp();
  });

  afterAll(async () => {
    await closePool();
  });

  async function staffToken(): Promise<string> {
    const hash = await bcrypt.hash("staffpass", 12);
    const email = `staff-${crypto.randomUUID()}@ex.com`;
    const ins = await pool.query<{ id: string }>(
      `insert into public.app_users (email, password_hash, must_change_password) values ($1, $2, false) returning id`,
      [email, hash],
    );
    const id = ins.rows[0]!.id;
    await pool.query(`insert into public.profiles (id, tipo, display_name) values ($1, 'actus_admin', 'Staff')`, [id]);
    await pool.query(`insert into public.app_user_roles (user_id, role) values ($1, 'actus_admin')`, [id]);
    const login = await request(app).post("/auth/login").send({ email, password: "staffpass" });
    return login.body.access_token as string;
  }

  it("cria uma academia matriz (network_hq) e vincula uma filial (unit) a ela", async () => {
    const staff = await staffToken();

    const hq = await request(app)
      .post("/admin/academies")
      .set("Authorization", `Bearer ${staff}`)
      .send({ name: "Rede Matriz", network_role: "network_hq" });
    expect(hq.status, JSON.stringify(hq.body)).toBe(201);

    const unit = await request(app)
      .post("/admin/academies")
      .set("Authorization", `Bearer ${staff}`)
      .send({ name: "Filial 1", network_role: "unit", parent_academy_id: hq.body.id });
    expect(unit.status, JSON.stringify(unit.body)).toBe(201);
  });

  it("rejeita network_role=unit sem parent_academy_id", async () => {
    const staff = await staffToken();
    const res = await request(app)
      .post("/admin/academies")
      .set("Authorization", `Bearer ${staff}`)
      .send({ name: "Filial órfã", network_role: "unit" });
    expect(res.status, JSON.stringify(res.body)).toBe(400);
    expect(res.body.error).toBe("invalid_body");
  });
});
```

- [ ] **Step 2: Rodar o teste para confirmar que falha**

Run: `cd backend/api && npx vitest run test/academyNetwork.int.test.ts`
Expected: FAIL — `POST /admin/academies` hoje não aceita `network_role`/`parent_academy_id` (a coluna existe mas não é lida do body), então a segunda asserção (`invalid_body`) falha porque o schema atual aceita o body e retorna 201.

- [ ] **Step 3: Implementar — aceitar `network_role` e `parent_academy_id` na criação**

Em `backend/api/src/routes/adminAcademies.ts`, atualizar o schema (linhas 14-24):

```typescript
const createAcademySchema = z
  .object({
    name: z.string().min(1).max(200),
    slug: z
      .string()
      .min(1)
      .max(120)
      .regex(/^[a-z0-9-]+$/, "slug_invalid")
      .optional(),
    cnpj: z.string().min(11).max(32).optional(),
    timezone: z.string().min(1).max(64).optional(),
    network_role: z.enum(["standalone", "network_hq", "unit"]).optional().default("standalone"),
    parent_academy_id: z.string().uuid().optional(),
  })
  .refine((o) => o.network_role !== "unit" || o.parent_academy_id != null, {
    message: "parent_academy_id_required_for_unit",
    path: ["parent_academy_id"],
  })
  .refine((o) => o.network_role === "unit" || o.parent_academy_id == null, {
    message: "parent_academy_id_only_for_unit",
    path: ["parent_academy_id"],
  });
```

E o handler `POST /` (linhas 64-86):

```typescript
router.post("/", async (req, res) => {
  const actorId = authedUserId(req);
  const parsed = createAcademySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "invalid_body", details: parsed.error.flatten() });
  const { name, slug, cnpj, timezone, network_role, parent_academy_id } = parsed.data;

  try {
    const created = await withTx(async (client) => {
      if (parent_academy_id) {
        const parent = await client.query(`select 1 from public.academies where id = $1`, [parent_academy_id]);
        if (!parent.rowCount) return { ok: false as const, error: "parent_academy_not_found" as const };
      }
      const id = uuid();
      await client.query(
        `insert into public.academies (id, name, slug, cnpj, timezone, network_role, parent_academy_id, created_by)
         values ($1, $2, $3, $4, coalesce($5, 'America/Sao_Paulo'), $6, $7, $8)`,
        [id, name, slug ?? null, cnpj ?? null, timezone ?? null, network_role, parent_academy_id ?? null, actorId],
      );
      return { ok: true as const, id };
    });
    if (!created.ok) return res.status(404).json({ error: created.error });
    return res.status(201).json({ id: created.id, name });
  } catch (e: any) {
    const msg = String(e?.message ?? "");
    if (msg.includes("academies_slug_key")) return res.status(409).json({ error: "slug_already_in_use" });
    return res.status(500).json({ error: "internal_error" });
  }
});
```

- [ ] **Step 4: Rodar os testes para confirmar que passam**

Run: `cd backend/api && npx vitest run test/academyNetwork.int.test.ts test/academy.int.test.ts`
Expected: PASS em todos.

- [ ] **Step 5: Commit**

```bash
git add backend/api/src/routes/adminAcademies.ts backend/api/test/academyNetwork.int.test.ts
git commit -m "feat(backend): admin pode vincular academia a uma rede (network_role/parent_academy_id)"
```

---

## Task 3: Backend — rotas `/academy/network` e `/academy/network/dashboard`

**Files:**
- Create: `backend/api/src/routes/academyNetwork.ts`
- Modify: `backend/api/src/app.ts:19,150-152` (import + mount)
- Test: `backend/api/test/academyNetwork.int.test.ts` (append)

- [ ] **Step 1: Adicionar os testes de integração (falha esperada)**

Append em `backend/api/test/academyNetwork.int.test.ts`, dentro do `describe`, um helper e os testes de dashboard de rede:

```typescript
  async function createAcademyDirect(
    name: string,
    opts: { networkRole?: "standalone" | "network_hq" | "unit"; parentId?: string } = {},
  ): Promise<string> {
    const staff = await staffToken();
    const res = await request(app)
      .post("/admin/academies")
      .set("Authorization", `Bearer ${staff}`)
      .send({ name, network_role: opts.networkRole ?? "standalone", parent_academy_id: opts.parentId });
    expect(res.status, JSON.stringify(res.body)).toBe(201);
    return res.body.id as string;
  }

  async function createManagerFor(academyId: string): Promise<string> {
    const staff = await staffToken();
    const email = `gestor-${crypto.randomUUID()}@ex.com`;
    const mgr = await request(app)
      .post(`/admin/academies/${academyId}/manager`)
      .set("Authorization", `Bearer ${staff}`)
      .send({ email, password: "senhaforte1", full_name: "Gestor" });
    expect(mgr.status, JSON.stringify(mgr.body)).toBe(201);
    const login = await request(app).post("/auth/login").send({ email, password: "senhaforte1" });
    return login.body.access_token as string;
  }

  it("gestor da matriz vê o dashboard de rede consolidado das unidades", async () => {
    const hqId = await createAcademyDirect("Rede X", { networkRole: "network_hq" });
    const hqToken = await createManagerFor(hqId);
    const unitAId = await createAcademyDirect("Unidade A", { networkRole: "unit", parentId: hqId });
    const unitBId = await createAcademyDirect("Unidade B", { networkRole: "unit", parentId: hqId });

    const list = await request(app).get("/academy/network").set("Authorization", `Bearer ${hqToken}`);
    expect(list.status, JSON.stringify(list.body)).toBe(200);
    expect(list.body.units.map((u: any) => u.id).sort()).toEqual([unitAId, unitBId].sort());

    const dash = await request(app).get("/academy/network/dashboard").set("Authorization", `Bearer ${hqToken}`);
    expect(dash.status, JSON.stringify(dash.body)).toBe(200);
    expect(dash.body.kpis.total_students).toBe(0);
    expect(dash.body.units).toHaveLength(2);
  });

  it("gestor de uma unidade (não matriz) recebe 403 ao acessar rotas de rede", async () => {
    const hqId = await createAcademyDirect("Rede Y", { networkRole: "network_hq" });
    const unitId = await createAcademyDirect("Unidade Y1", { networkRole: "unit", parentId: hqId });
    const unitToken = await createManagerFor(unitId);

    const res = await request(app).get("/academy/network/dashboard").set("Authorization", `Bearer ${unitToken}`);
    expect(res.status, JSON.stringify(res.body)).toBe(403);
  });

  it("academia standalone recebe 403 ao acessar rotas de rede", async () => {
    const standaloneId = await createAcademyDirect("Academia Solo");
    const token = await createManagerFor(standaloneId);

    const res = await request(app).get("/academy/network/dashboard").set("Authorization", `Bearer ${token}`);
    expect(res.status, JSON.stringify(res.body)).toBe(403);
  });
```

- [ ] **Step 2: Rodar os testes para confirmar que falham**

Run: `cd backend/api && npx vitest run test/academyNetwork.int.test.ts`
Expected: FAIL — rotas `/academy/network` e `/academy/network/dashboard` não existem (404).

- [ ] **Step 3: Implementar a rota**

```typescript
// backend/api/src/routes/academyNetwork.ts
import { Router } from "express";
import { withTx } from "../db.js";
import { scopedAcademyId } from "../middleware/requireAcademyManager.js";

// [ACTUS — academia] Dashboard de rede (filiais/franquias). Só responde quando a academia
// autenticada tem network_role='network_hq'. Reaproveita a mesma agregação por academia de
// GET /academy/dashboard, rodada por unidade e somada — sem duplicar a lógica de KPI.

const router = Router();

type UnitRow = { id: string; name: string };

async function requireNetworkHq(academyId: string): Promise<UnitRow[] | null> {
  return withTx(async (client) => {
    const hq = await client.query<{ network_role: string }>(
      `select network_role from public.academies where id = $1`,
      [academyId],
    );
    if (hq.rows[0]?.network_role !== "network_hq") return null;

    const units = await client.query<UnitRow>(
      `select id, name from public.academies where parent_academy_id = $1 order by name asc`,
      [academyId],
    );
    return units.rows;
  });
}

async function unitKpis(academyId: string) {
  return withTx(async (client) => {
    const totalStudents = await client.query<{ count: string }>(
      `select count(distinct student_id) as count from public.academy_students where academy_id = $1`,
      [academyId],
    );
    const instructors = await client.query<{ count: string }>(
      `select count(*) as count from public.academy_members
       where academy_id = $1 and role = 'instructor' and status = 'active'`,
      [academyId],
    );
    return {
      total_students: Number(totalStudents.rows[0]?.count ?? 0),
      instructors: Number(instructors.rows[0]?.count ?? 0),
    };
  });
}

// GET /academy/network — lista as unidades da rede.
router.get("/", async (req, res) => {
  const academyId = scopedAcademyId(req);
  try {
    const units = await requireNetworkHq(academyId);
    if (!units) return res.status(403).json({ error: "forbidden_not_network_hq" });
    return res.json({ units });
  } catch {
    return res.status(500).json({ error: "internal_error" });
  }
});

// GET /academy/network/dashboard — KPIs consolidados + breakdown por unidade.
router.get("/dashboard", async (req, res) => {
  const academyId = scopedAcademyId(req);
  try {
    const units = await requireNetworkHq(academyId);
    if (!units) return res.status(403).json({ error: "forbidden_not_network_hq" });

    const perUnit = await Promise.all(
      units.map(async (u) => ({ id: u.id, name: u.name, kpis: await unitKpis(u.id) })),
    );

    const totals = perUnit.reduce(
      (acc, u) => ({
        total_students: acc.total_students + u.kpis.total_students,
        instructors: acc.instructors + u.kpis.instructors,
      }),
      { total_students: 0, instructors: 0 },
    );

    return res.json({ kpis: totals, units: perUnit });
  } catch {
    return res.status(500).json({ error: "internal_error" });
  }
});

export default router;
```

- [ ] **Step 4: Montar a rota no app**

Em `backend/api/src/app.ts`, adicionar o import junto dos outros de academia (linha 19):

```typescript
import academyNetworkRoutes from "./routes/academyNetwork.js";
```

E o mount logo antes de `/academy` (a rota mais específica primeiro, mesmo padrão de `/academy/commissions` — linhas 150-152):

```typescript
  app.use("/admin/academies", requireStaff, adminAcademiesRoutes);
  app.use("/academy/commissions", requireAuth, requireAcademyManager, academyCommissionsRoutes);
  app.use("/academy/network", requireAuth, requireAcademyManager, academyNetworkRoutes);
  app.use("/academy", requireAuth, requireAcademyManager, academyRoutes);
```

- [ ] **Step 5: Rodar os testes para confirmar que passam**

Run: `cd backend/api && npx vitest run test/academyNetwork.int.test.ts test/academy.int.test.ts`
Expected: PASS em todos.

- [ ] **Step 6: Commit**

```bash
git add backend/api/src/routes/academyNetwork.ts backend/api/src/app.ts backend/api/test/academyNetwork.int.test.ts
git commit -m "feat(backend): rotas GET /academy/network e /academy/network/dashboard"
```

---

## Task 4: Backend — expor `network_role` no contexto de academia (`GET /me`)

**Files:**
- Modify: `backend/api/src/routes/me.ts:30-40`
- Modify: `backend/api/test/academyNetwork.int.test.ts` (append asserção)

- [ ] **Step 1: Adicionar asserção no teste existente de rede**

No teste `"gestor da matriz vê o dashboard de rede consolidado das unidades"` (Task 3), depois de obter `hqToken`, adicionar:

```typescript
    const me = await request(app).get("/me").set("Authorization", `Bearer ${hqToken}`);
    expect(me.body.academy.network_role).toBe("network_hq");
```

- [ ] **Step 2: Rodar o teste para confirmar que falha**

Run: `cd backend/api && npx vitest run test/academyNetwork.int.test.ts`
Expected: FAIL — `me.body.academy.network_role` é `undefined` (`GET /me` não seleciona essa coluna hoje).

- [ ] **Step 3: Implementar**

Em `backend/api/src/routes/me.ts`, a query de contexto de academia (linhas 30-40) passa a selecionar `network_role`:

```typescript
    const aq = await client.query<{ id: string; name: string; role: string; network_role: string }>(
      `select am.academy_id as id, a.name, am.role, a.network_role::text as network_role
       from public.academy_members am
       join public.academies a on a.id = am.academy_id
       where am.user_id = $1 and am.status = 'active'
       order by am.created_at asc
       limit 1`,
      [userId],
    );
    return { ...profile, academy: aq.rows[0] ?? null };
```

- [ ] **Step 4: Rodar o teste para confirmar que passa**

Run: `cd backend/api && npx vitest run test/academyNetwork.int.test.ts test/academy.int.test.ts`
Expected: PASS em todos.

- [ ] **Step 5: Commit**

```bash
git add backend/api/src/routes/me.ts backend/api/test/academyNetwork.int.test.ts
git commit -m "feat(backend): GET /me expõe network_role no contexto de academia"
```

---

## Task 5: Frontend — schemas e hooks

**Files:**
- Modify: `web/src/lib/schemas.ts:12-17` (AcademyContextSchema), `:383-393` (AcademyListItemSchema), novo `NetworkDashboardSchema`
- Modify: `web/src/hooks/useAcademyAdmin.ts:29-38` (useCreateAcademy)
- Create: `web/src/hooks/useAcademyNetwork.ts`
- Test: `web/src/hooks/useAcademyNetwork.test.ts` (novo, se o projeto já testa hooks isoladamente — caso não haja precedente, pular para o teste de componente no Task 6)

- [ ] **Step 1: Atualizar `AcademyContextSchema`**

Em `web/src/lib/schemas.ts` (linhas 12-17):

```typescript
export const AcademyContextSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: z.enum(['manager', 'instructor']),
  network_role: z.enum(['standalone', 'network_hq', 'unit']).optional(),
});
export type AcademyContext = z.infer<typeof AcademyContextSchema>;
```

- [ ] **Step 2: Adicionar `NetworkDashboardSchema` e estender criação de academia**

Logo após `AcademyCreateResponseSchema` (linha 422) em `web/src/lib/schemas.ts`:

```typescript
// GET /academy/network/dashboard
export const NetworkUnitSchema = z.object({
  id: z.string(),
  name: z.string(),
  kpis: z.object({
    total_students: z.number(),
    instructors: z.number(),
  }),
});
export type NetworkUnit = z.infer<typeof NetworkUnitSchema>;

export const NetworkDashboardSchema = z.object({
  kpis: z.object({
    total_students: z.number(),
    instructors: z.number(),
  }),
  units: z.array(NetworkUnitSchema),
});
export type NetworkDashboard = z.infer<typeof NetworkDashboardSchema>;
```

E estender `AcademyListItemSchema` (linhas 383-393) com os dois campos novos:

```typescript
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
  network_role: z.enum(['standalone', 'network_hq', 'unit']).optional(),
  parent_academy_id: z.string().nullable().optional(),
});
```

- [ ] **Step 3: Estender `useCreateAcademy` para aceitar vínculo de rede**

Em `web/src/hooks/useAcademyAdmin.ts` (linhas 29-38):

```typescript
export function useCreateAcademy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: {
      name: string;
      slug?: string;
      cnpj?: string;
      timezone?: string;
      network_role?: 'standalone' | 'network_hq' | 'unit';
      parent_academy_id?: string;
    }) => {
      const r = await api.post('/admin/academies', body);
      return AcademyCreateResponseSchema.parse(r.data);
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['admin-academies'] }),
  });
}
```

- [ ] **Step 4: Criar o hook de dashboard de rede**

```typescript
// web/src/hooks/useAcademyNetwork.ts
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { NetworkDashboardSchema } from '../lib/schemas';

// [ACTUS — academia] Hook do dashboard de rede (filiais/franquias). Só retorna dado quando a
// academia logada é network_hq — as demais recebem 403 do backend (ver useNetworkDashboard.isError).
export function useNetworkDashboard() {
  return useQuery({
    queryKey: ['academy-network-dashboard'] as const,
    queryFn: async () => {
      const r = await api.get('/academy/network/dashboard');
      return NetworkDashboardSchema.parse(r.data);
    },
    staleTime: 60_000,
  });
}
```

- [ ] **Step 5: Verificar typecheck do front**

Run: `cd web && npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 6: Commit**

```bash
git add web/src/lib/schemas.ts web/src/hooks/useAcademyAdmin.ts web/src/hooks/useAcademyNetwork.ts
git commit -m "feat(web): schemas e hook do dashboard de rede (filiais/franquias)"
```

---

## Task 6: Frontend — `NetworkDashboardPage`, rota e navegação

**Files:**
- Create: `web/src/pages/academia/NetworkDashboardPage.tsx`
- Test: `web/src/pages/academia/NetworkDashboardPage.test.tsx`
- Modify: `web/src/routes.tsx:26-30,58-66` (import + rota)
- Modify: `web/src/layouts/AcademyLayout.tsx:9-19` (item de navegação condicional)

- [ ] **Step 1: Escrever o teste do componente (falha esperada)**

```typescript
// web/src/pages/academia/NetworkDashboardPage.test.tsx
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { NetworkDashboardPage } from './NetworkDashboardPage';
import { api } from '../../api/client';

vi.mock('../../api/client', () => ({ api: { get: vi.fn() } }));

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <NetworkDashboardPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('NetworkDashboardPage', () => {
  it('mostra estado vazio quando a rede não tem unidades', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { kpis: { total_students: 0, instructors: 0 }, units: [] } });
    renderPage();
    expect(await screen.findByText(/nenhuma filial vinculada ainda/i)).toBeInTheDocument();
  });

  it('mostra KPIs consolidados e a tabela por unidade', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: {
        kpis: { total_students: 12, instructors: 3 },
        units: [
          { id: 'u1', name: 'Unidade A', kpis: { total_students: 7, instructors: 2 } },
          { id: 'u2', name: 'Unidade B', kpis: { total_students: 5, instructors: 1 } },
        ],
      },
    });
    renderPage();
    expect(await screen.findByText('12')).toBeInTheDocument();
    expect(await screen.findByText('Unidade A')).toBeInTheDocument();
    expect(await screen.findByText('Unidade B')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Rodar o teste para confirmar que falha**

Run: `cd web && npx vitest run src/pages/academia/NetworkDashboardPage.test.tsx`
Expected: FAIL — `./NetworkDashboardPage` não existe.

- [ ] **Step 3: Implementar o componente**

```tsx
// web/src/pages/academia/NetworkDashboardPage.tsx
import { Link } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import { KpiCard } from '../dashboard/KpiCard';
import { useNetworkDashboard } from '../../hooks/useAcademyNetwork';

const thClass = 'py-2 font-mono text-[10px] font-normal uppercase tracking-widest text-text-3';

export function NetworkDashboardPage() {
  const { data, isLoading } = useNetworkDashboard();
  const units = data?.units ?? [];

  return (
    <div className="flex-1">
      <div className="flex h-[52px] items-center border-b border-outline-v px-6">
        <h1 className="font-display text-xl font-black uppercase tracking-wide text-text-1">Rede</h1>
      </div>

      <div className="flex flex-col gap-5 p-6">
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
          <KpiCard label="Total de alunos (rede)" value={data ? String(data.kpis.total_students) : '—'} loading={isLoading} />
          <KpiCard label="Instrutores (rede)" value={data ? String(data.kpis.instructors) : '—'} loading={isLoading} />
        </div>

        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-base font-bold uppercase tracking-wide text-text-1">Por unidade</h2>
          </div>
          {isLoading ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 3 }, (_, i) => (
                <Skeleton key={i} className="h-9 w-full" />
              ))}
            </div>
          ) : units.length === 0 ? (
            <p className="py-8 text-center text-sm text-text-3">Nenhuma filial vinculada ainda.</p>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-outline-v text-left">
                  <th className={thClass}>Unidade</th>
                  <th className={thClass}>Alunos</th>
                  <th className={thClass}>Instrutores</th>
                </tr>
              </thead>
              <tbody>
                {units.map((u) => (
                  <tr key={u.id} className="border-b border-outline-v/40">
                    <td className="py-2 text-sm text-text-1">{u.name}</td>
                    <td className="py-2 font-mono text-sm text-text-2">{u.kpis.total_students}</td>
                    <td className="py-2 font-mono text-sm text-text-2">{u.kpis.instructors}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>
    </div>
  );
}
```

(Link importado para consistência com o padrão de outras páginas do módulo, mesmo sem uso de link individual por unidade nesta fase — remover o import se o linter acusar `no-unused-vars`.)

- [ ] **Step 4: Rodar o teste para confirmar que passa**

Run: `cd web && npx vitest run src/pages/academia/NetworkDashboardPage.test.tsx`
Expected: PASS em ambos os testes.

- [ ] **Step 5: Adicionar a rota**

Em `web/src/routes.tsx`, import junto dos outros de academia (linha 30):

```typescript
import { NetworkDashboardPage } from './pages/academia/NetworkDashboardPage';
```

E a rota dentro do bloco `AcademyLayout` (linhas 58-66):

```typescript
                  { path: '/app/academia', element: <AcademyDashboardPage /> },
                  { path: '/app/academia/rede', element: <NetworkDashboardPage /> },
                  { path: '/app/academia/equipe', element: <AcademyTeamPage /> },
```

- [ ] **Step 6: Adicionar o item de navegação condicional**

Em `web/src/layouts/AcademyLayout.tsx`, importar o seletor e condicionar o item:

```tsx
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar, type SidebarSection } from './Sidebar';
import { selectAcademy, useAuthStore } from '../store/authStore';

export function AcademyLayout() {
  const { pathname } = useLocation();
  const academy = useAuthStore(selectAcademy);
  const isNetworkHq = academy?.network_role === 'network_hq';

  const sections: SidebarSection[] = [
    {
      label: 'Academia',
      items: [
        { name: 'Dashboard', to: '/app/academia', active: pathname === '/app/academia' },
        ...(isNetworkHq
          ? [{ name: 'Rede', to: '/app/academia/rede', active: pathname === '/app/academia/rede' }]
          : []),
        { name: 'Equipe', to: '/app/academia/equipe', active: pathname.startsWith('/app/academia/equipe') },
        { name: 'Comissões', to: '/app/academia/comissoes' },
        { name: 'Configurações', to: '/app/academia/configuracoes' },
      ],
    },
  ];

  return (
    <>
      <Sidebar sections={sections} />
      <div className="flex-1 overflow-auto">
        <Outlet />
      </div>
    </>
  );
}
```

- [ ] **Step 7: Rodar typecheck e a suíte do módulo academia no front**

Run: `cd web && npx tsc --noEmit && npx vitest run src/pages/academia`
Expected: sem erros de tipo; todos os testes de `src/pages/academia` passam.

- [ ] **Step 8: Commit**

```bash
git add web/src/pages/academia/NetworkDashboardPage.tsx web/src/pages/academia/NetworkDashboardPage.test.tsx web/src/routes.tsx web/src/layouts/AcademyLayout.tsx
git commit -m "feat(web): dashboard de rede (filiais/franquias) — página, rota e navegação"
```

---

## Task 7: Frontend — vincular a uma rede existente no onboarding (admin)

**Files:**
- Modify: `web/src/pages/admin/AcademiasPage.tsx:16-49,127-150`

- [ ] **Step 1: Adicionar o campo no formulário de criação**

Em `web/src/pages/admin/AcademiasPage.tsx`, adicionar estado para o tipo de rede e para a matriz escolhida (após a linha 25):

```typescript
  const [networkRole, setNetworkRole] = useState<'standalone' | 'network_hq' | 'unit'>('standalone');
  const [parentAcademyId, setParentAcademyId] = useState('');
```

Atualizar `onCreateAcademy` (linhas 32-49) para enviar os campos novos:

```typescript
  async function onCreateAcademy(e: FormEvent) {
    e.preventDefault();
    try {
      await createAcademy.mutateAsync({
        name: name.trim(),
        slug: slug.trim() || undefined,
        cnpj: cnpj.trim() || undefined,
        network_role: networkRole,
        parent_academy_id: networkRole === 'unit' ? parentAcademyId : undefined,
      });
      toast('Academia criada.');
      setName('');
      setSlug('');
      setCnpj('');
      setNetworkRole('standalone');
      setParentAcademyId('');
      setCreateOpen(false);
    } catch (err) {
      const code = axios.isAxiosError(err) ? (err.response?.data?.error as string | undefined) : undefined;
      toast(code === 'slug_already_in_use' ? 'Esse slug já está em uso.' : 'Não foi possível criar a academia.', 'error');
    }
  }
```

Adicionar os campos no formulário (dentro do `Modal open={createOpen}`, após o campo de CNPJ, linha ~140):

```tsx
          <label className="flex flex-col gap-1">
            <span className={labelClass}>Tipo de rede</span>
            <select
              value={networkRole}
              onChange={(e) => setNetworkRole(e.target.value as typeof networkRole)}
              className={inputClass}
            >
              <option value="standalone">Academia independente</option>
              <option value="network_hq">Matriz de rede</option>
              <option value="unit">Filial/franquia de uma rede existente</option>
            </select>
          </label>
          {networkRole === 'unit' && (
            <label className="flex flex-col gap-1">
              <span className={labelClass}>Rede (matriz)</span>
              <select
                required
                value={parentAcademyId}
                onChange={(e) => setParentAcademyId(e.target.value)}
                className={inputClass}
              >
                <option value="">Selecione a matriz</option>
                {academies
                  .filter((a) => a.network_role === 'network_hq')
                  .map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
              </select>
            </label>
          )}
```

- [ ] **Step 2: Rodar typecheck do front**

Run: `cd web && npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 3: Verificar manualmente**

Suba o dev server (`cd web && npm run dev`), acesse `/app/admin/academias` como staff, crie uma academia com "Matriz de rede", depois crie outra com "Filial/franquia" apontando pra ela, e confirme no dashboard do gestor da matriz (`/app/academia/rede`) que a unidade aparece.

- [ ] **Step 4: Commit**

```bash
git add web/src/pages/admin/AcademiasPage.tsx
git commit -m "feat(web): onboarding admin permite vincular academia a uma rede existente"
```

---

## Self-Review Notes

- **Cobertura do spec:** modelo de dados (Task 1), API de rede (Task 3), `network_role` em `/me` (Task 4), onboarding com vínculo de rede (Task 2 + 7), frontend do dashboard de rede (Task 5 + 6) — todas as seções do spec têm tarefa correspondente. Testes de erro/edge case (rede vazia, escopo 403, `standalone` sem acesso) cobertos nas Tasks 3 e 6.
- **Fora de escopo (mantido conforme spec):** gestão direta de equipe/alunos da unidade a partir do dashboard da matriz, comissão consolidada por rede, transferência de instrutores/alunos entre unidades — nenhuma tarefa deste plano implementa isso.
- **Consistência de tipos:** `network_role: 'standalone' | 'network_hq' | 'unit'` usado de forma idêntica em schema Postgres (enum), Zod (`AcademyContextSchema`, `AcademyListItemSchema`), hook (`useCreateAcademy`) e componente (`AcademyLayout`, `AcademiasPage`).
