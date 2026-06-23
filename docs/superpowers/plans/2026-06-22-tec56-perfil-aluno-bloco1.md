# TEC-56 Bloco 1 — Perfil do aluno + lista + gestão — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Completar o perfil do aluno na web do Personal (tabs Visão Geral + Badges), ordenação e filtro de arquivados na lista, ações de gestão (editar dados, ativar/desativar) e responsividade — com as extensões mínimas de backend.

**Architecture:** Backend primeiro (contratos), via TDD com Vitest+pg-mem em `Actus_backend`; depois web em `Actus_web` (sem runner de teste → verificação por `npm run build`/`tsc` + `npm run lint` + checagem visual). Repos são independentes: commits do backend em `backend/`, da web em `web/`, ambos na `branch/davi`.

**Tech Stack:** Backend: Express 5 · TypeScript · node-postgres · Zod · Vitest + Supertest + pg-mem. Web: React 18 · TypeScript · Vite · Tailwind v4 · TanStack Query v5 · Zod · axios.

**Spec:** `docs/superpowers/specs/2026-06-22-tec56-perfil-aluno-bloco1-design.md`

---

## Convenções

- **Backend** (repo `Actus_backend`, pasta local `backend/`): comandos rodam em `backend/api`; testes: `npm test`. Branch de erro SEMPRE no campo `error` do body (padrão da API). Commits: `cd backend && git commit`.
- **Web** (repo `Actus_web`, pasta local `web/`): verificação `npm run build` (tsc + vite) e `npm run lint`. Tudo via tokens do theme (sem hex hardcoded). Commits: `cd web && git commit`.
- `link_status` real = `active | revoked`. "Desativar" = `revoked`; "Reativar" = `active`.
- `user_gender` = `masculino | feminino | nao_informar | outro`.

---

# PARTE A — Backend (`Actus_backend`)

### Task 1: Migration `height_cm` + espelho no testDb

**Files:**
- Create: `supabase/migrations/20260623120000_user_height.sql`
- Modify: `api/test/helpers/testDb.ts` (tabela `user_basic_info`)

- [ ] **Step 1: Criar a migration**

Arquivo `supabase/migrations/20260623120000_user_height.sql`:

```sql
-- Altura do aluno (cm). Usada pela Visão Geral do perfil (web Personal). Idempotente.
begin;

alter table public.user_basic_info
  add column if not exists height_cm numeric(5, 1);

comment on column public.user_basic_info.height_cm is
  'Altura em centímetros (ex.: 168.0). Nullable; editável pelo profissional vinculado.';

commit;
```

- [ ] **Step 2: Espelhar a coluna no schema de teste**

Em `api/test/helpers/testDb.ts`, na definição de `public.user_basic_info`, adicionar a coluna após `body_weight_kg`:

```ts
  body_weight_kg numeric(6, 2),
  height_cm numeric(5, 1)
);
```

(troca a linha `body_weight_kg numeric(6, 2)\n);` por incluir `height_cm`.)

- [ ] **Step 3: Rodar a suíte pra garantir que o schema ainda carrega**

Run: `cd backend/api && npm test -- professional.students`
Expected: PASS (a suíte existente continua verde com a coluna nova).

- [ ] **Step 4: Commit**

```bash
cd backend && git add supabase/migrations/20260623120000_user_height.sql api/test/helpers/testDb.ts
git commit -m "feat(db): coluna height_cm em user_basic_info"
```

---

### Task 2: `GET /professional/students` — campos ricos + filtro `?status`

**Files:**
- Modify: `api/src/routes/professionalStudents.ts:13-99` (handler do GET `/`)
- Test: `api/test/professional.students.int.test.ts`

- [ ] **Step 1: Escrever o teste que falha (novos campos + filtro)**

Adicionar dentro do `describe("GET /professional/students")`:

```ts
it("returns rich fields and filters by status", async () => {
  const proId = crypto.randomUUID();
  await pool.query(`insert into public.app_users (id, email, password_hash) values ($1, 'p2@x.com', $2)`, [proId, await bcrypt.hash("propass", 12)]);
  await pool.query(`insert into public.profiles (id, tipo, display_name) values ($1, 'personal', 'Pro2')`, [proId]);

  const activeId = crypto.randomUUID();
  await pool.query(`insert into public.app_users (id, email, password_hash) values ($1, 'act@x.com', $2)`, [activeId, await bcrypt.hash("x", 12)]);
  await pool.query(`insert into public.profiles (id, tipo, display_name) values ($1, 'aluno', 'A')`, [activeId]);
  await pool.query(`insert into public.user_basic_info (user_id, full_name, birth_date, phone, gender, body_weight_kg, height_cm, cpf_last4) values ($1,'Ativo','1990-01-01','11999','feminino',64.0,168.0,'1234')`, [activeId]);
  await pool.query(`insert into public.student_professional_links (student_id, professional_id, professional_role, status) values ($1,$2,'personal','active')`, [activeId, proId]);

  const revId = crypto.randomUUID();
  await pool.query(`insert into public.app_users (id, email, password_hash) values ($1, 'rev@x.com', $2)`, [revId, await bcrypt.hash("x", 12)]);
  await pool.query(`insert into public.profiles (id, tipo, display_name) values ($1, 'aluno', 'R')`, [revId]);
  await pool.query(`insert into public.user_basic_info (user_id, full_name, birth_date) values ($1,'Arquivado','1991-02-02')`, [revId]);
  await pool.query(`insert into public.student_professional_links (student_id, professional_id, professional_role, status) values ($1,$2,'personal','revoked')`, [revId, proId]);

  const app = createApp();
  const login = await request(app).post("/auth/login").send({ email: "p2@x.com", password: "propass" });

  const def = await request(app).get("/professional/students").set("Authorization", `Bearer ${login.body.access_token}`);
  expect(def.body.students.length).toBe(1);
  expect(def.body.students[0].full_name).toBe("Ativo");
  expect(def.body.students[0].phone).toBe("11999");
  expect(def.body.students[0].gender).toBe("feminino");
  expect(def.body.students[0].body_weight_kg).toBe(64);
  expect(def.body.students[0].height_cm).toBe(168);
  expect(def.body.students[0].cpf_last4).toBe("1234");

  const arch = await request(app).get("/professional/students?status=revoked").set("Authorization", `Bearer ${login.body.access_token}`);
  expect(arch.body.students.map((s: any) => s.full_name)).toEqual(["Arquivado"]);

  const all = await request(app).get("/professional/students?status=all").set("Authorization", `Bearer ${login.body.access_token}`);
  expect(all.body.students.length).toBe(2);
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `cd backend/api && npm test -- professional.students`
Expected: FAIL (campos `phone/gender/...` undefined; `?status` ignorado).

- [ ] **Step 3: Implementar — estender SELECT, mapping e filtro de status**

Em `api/src/routes/professionalStudents.ts`, no handler `router.get("/", …)`:

1. Logo após `const professionalId = authedUserId(req);`, ler o filtro:

```ts
  const statusParam = typeof req.query.status === "string" ? req.query.status : "active";
  const statusFilter =
    statusParam === "revoked" ? "revoked" : statusParam === "all" ? "all" : "active";
```

2. Trocar o tipo da query e o SQL (adicionar colunas e tornar o `where` de status condicional):

```ts
      const q = await client.query<{
        student_id: string;
        student_display_name: string | null;
        full_name: string | null;
        birth_date: any;
        email: string;
        phone: string | null;
        gender: string | null;
        body_weight_kg: string | number | null;
        height_cm: string | number | null;
        cpf_last4: string | null;
        professional_role: "personal" | "nutricionista";
        link_status: "active" | "revoked";
        linked_at: any;
        streak_current: number | null;
        last_activity_at: any;
        badge_count: number | null;
      }>(
        `
        select
          spl.student_id,
          sp.display_name as student_display_name,
          ubi.full_name,
          ubi.birth_date,
          au.email,
          ubi.phone,
          ubi.gender,
          ubi.body_weight_kg,
          ubi.height_cm,
          ubi.cpf_last4,
          spl.professional_role,
          spl.status as link_status,
          spl.linked_at,
          sp.streak_current,
          sp.last_activity_at,
          coalesce(bc.cnt, 0) as badge_count
        from public.student_professional_links spl
        join public.profiles sp on sp.id = spl.student_id
        join public.app_users au on au.id = spl.student_id
        left join public.user_basic_info ubi on ubi.user_id = spl.student_id
        left join (
          select student_id, count(*)::int as cnt
            from public.student_badges group by student_id
        ) bc on bc.student_id = spl.student_id
        where spl.professional_id = $1
          and ($2 = 'all' or spl.status = $2)
        order by spl.linked_at desc
        limit 500
        `,
        [professionalId, statusFilter],
      );
```

3. No `.map`, adicionar os campos novos ao objeto retornado (após `badge_count`):

```ts
        return {
          id: r.student_id,
          email: r.email,
          full_name: r.full_name ?? r.student_display_name ?? null,
          birth_date: Number.isFinite(birthDate.getTime()) ? birthDate.toISOString().slice(0, 10) : null,
          professional_role: r.professional_role,
          status: r.link_status,
          linked_at: linkedAt.toISOString(),
          streak_current: eff.streak_current,
          is_broken: eff.is_broken,
          badge_count: Number(r.badge_count ?? 0),
          phone: r.phone ?? null,
          gender: r.gender ?? null,
          body_weight_kg: r.body_weight_kg == null ? null : Number(r.body_weight_kg),
          height_cm: r.height_cm == null ? null : Number(r.height_cm),
          cpf_last4: r.cpf_last4 ?? null,
        };
```

- [ ] **Step 4: Rodar e ver passar**

Run: `cd backend/api && npm test -- professional.students`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
cd backend && git add api/src/routes/professionalStudents.ts api/test/professional.students.int.test.ts
git commit -m "feat(api): campos ricos + filtro ?status em GET /professional/students"
```

---

### Task 3: `GET /professional/students/:id/badges`

**Files:**
- Modify: `api/src/routes/professionalStudents.ts` (novo handler antes de `export default`)
- Test: `api/test/professional.students.int.test.ts`

- [ ] **Step 1: Escrever o teste que falha**

```ts
it("returns the student's badge catalog with earned flags", async () => {
  const proId = crypto.randomUUID();
  await pool.query(`insert into public.app_users (id, email, password_hash) values ($1, 'p3@x.com', $2)`, [proId, await bcrypt.hash("propass", 12)]);
  await pool.query(`insert into public.profiles (id, tipo, display_name) values ($1, 'personal', 'Pro3')`, [proId]);
  const sId = crypto.randomUUID();
  await pool.query(`insert into public.app_users (id, email, password_hash) values ($1, 's3@x.com', $2)`, [sId, await bcrypt.hash("x", 12)]);
  await pool.query(`insert into public.profiles (id, tipo, display_name) values ($1, 'aluno', 'S3')`, [sId]);
  await pool.query(`insert into public.user_basic_info (user_id, full_name, birth_date) values ($1,'S3','1990-01-01')`, [sId]);
  await pool.query(`insert into public.student_professional_links (student_id, professional_id, professional_role, status) values ($1,$2,'personal','active')`, [sId, proId]);
  await pool.query(`insert into public.student_badges (student_id, badge_id) values ($1, 'first_step')`, [sId]);

  const app = createApp();
  const login = await request(app).post("/auth/login").send({ email: "p3@x.com", password: "propass" });
  const res = await request(app).get(`/professional/students/${sId}/badges`).set("Authorization", `Bearer ${login.body.access_token}`);
  expect(res.status, JSON.stringify(res.body)).toBe(200);
  expect(res.body.badges.length).toBe(7);
  const first = res.body.badges.find((b: any) => b.id === "first_step");
  expect(first.earned).toBe(true);
  const legendary = res.body.badges.find((b: any) => b.id === "legendary_30");
  expect(legendary.earned).toBe(false);
});

it("rejects badges for a non-linked student", async () => {
  const proId = crypto.randomUUID();
  await pool.query(`insert into public.app_users (id, email, password_hash) values ($1, 'p4@x.com', $2)`, [proId, await bcrypt.hash("propass", 12)]);
  await pool.query(`insert into public.profiles (id, tipo, display_name) values ($1, 'personal', 'Pro4')`, [proId]);
  const app = createApp();
  const login = await request(app).post("/auth/login").send({ email: "p4@x.com", password: "propass" });
  const res = await request(app).get(`/professional/students/${crypto.randomUUID()}/badges`).set("Authorization", `Bearer ${login.body.access_token}`);
  expect(res.status).toBe(404);
  expect(res.body.error).toBe("student_not_linked");
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `cd backend/api && npm test -- professional.students`
Expected: FAIL (404 genérico/rota inexistente).

- [ ] **Step 3: Implementar o handler**

Em `api/src/routes/professionalStudents.ts`, antes de `export default router;`:

```ts
/** Badges de um aluno com vínculo ativo: catálogo + flag earned (espelha /me/badges). */
router.get("/:student_id/badges", async (req, res) => {
  const professionalId = authedUserId(req);
  const sid = req.params.student_id;
  if (!z.string().uuid().safeParse(sid).success) {
    return res.status(400).json({ error: "invalid_params" });
  }
  try {
    const out = await withTx(async (client) => {
      const meQ = await client.query<{ tipo: string }>(
        `select tipo from public.profiles where id = $1`,
        [professionalId],
      );
      const tipo = meQ.rows[0]?.tipo ?? null;
      if (tipo !== "personal" && tipo !== "nutricionista") {
        return { ok: false as const, error: "not_professional" as const };
      }
      const link = await client.query(
        `select '1' from public.student_professional_links
          where professional_id = $1 and student_id = $2 and status = 'active' limit 1`,
        [professionalId, sid],
      );
      if (!link.rowCount) return { ok: false as const, error: "student_not_linked" as const };

      const r = await client.query(
        `select b.id, b.name, b.description, b.asset_key, b.sort_order,
                (sb.id is not null) as earned, sb.earned_at
           from public.badges b
           left join public.student_badges sb
             on sb.badge_id = b.id and sb.student_id = $1
          where b.active = true
          order by b.sort_order`,
        [sid],
      );
      return { ok: true as const, badges: r.rows };
    });
    if (!out.ok) {
      if (out.error === "not_professional") return res.status(403).json({ error: out.error });
      return res.status(404).json({ error: out.error });
    }
    return res.json({ student_id: sid, badges: out.badges });
  } catch (e: unknown) {
    return sendInternalError(res, e);
  }
});
```

- [ ] **Step 4: Rodar e ver passar**

Run: `cd backend/api && npm test -- professional.students`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
cd backend && git add api/src/routes/professionalStudents.ts api/test/professional.students.int.test.ts
git commit -m "feat(api): GET /professional/students/:id/badges"
```

---

### Task 4: `PATCH /professional/students/:id` — editar dados básicos

**Files:**
- Modify: `api/src/routes/professionalStudents.ts`
- Test: `api/test/professional.students.int.test.ts`

- [ ] **Step 1: Escrever o teste que falha**

```ts
it("patches a linked student's basic data (no email/password)", async () => {
  const proId = crypto.randomUUID();
  await pool.query(`insert into public.app_users (id, email, password_hash) values ($1, 'p5@x.com', $2)`, [proId, await bcrypt.hash("propass", 12)]);
  await pool.query(`insert into public.profiles (id, tipo, display_name) values ($1, 'personal', 'Pro5')`, [proId]);
  const sId = crypto.randomUUID();
  await pool.query(`insert into public.app_users (id, email, password_hash) values ($1, 's5@x.com', $2)`, [sId, await bcrypt.hash("x", 12)]);
  await pool.query(`insert into public.profiles (id, tipo, display_name) values ($1, 'aluno', 'S5')`, [sId]);
  await pool.query(`insert into public.user_basic_info (user_id, full_name, birth_date) values ($1,'Nome Antigo','1990-01-01')`, [sId]);
  await pool.query(`insert into public.student_professional_links (student_id, professional_id, professional_role, status) values ($1,$2,'personal','active')`, [sId, proId]);

  const app = createApp();
  const login = await request(app).post("/auth/login").send({ email: "p5@x.com", password: "propass" });
  const res = await request(app)
    .patch(`/professional/students/${sId}`)
    .set("Authorization", `Bearer ${login.body.access_token}`)
    .send({ full_name: "Nome Novo", phone: "11888", gender: "outro", body_weight_kg: 70.5, height_cm: 175 });
  expect(res.status, JSON.stringify(res.body)).toBe(200);

  const list = await request(app).get("/professional/students").set("Authorization", `Bearer ${login.body.access_token}`);
  const s = list.body.students[0];
  expect(s.full_name).toBe("Nome Novo");
  expect(s.body_weight_kg).toBe(70.5);
  expect(s.height_cm).toBe(175);
});

it("rejects invalid gender", async () => {
  const proId = crypto.randomUUID();
  await pool.query(`insert into public.app_users (id, email, password_hash) values ($1, 'p6@x.com', $2)`, [proId, await bcrypt.hash("propass", 12)]);
  await pool.query(`insert into public.profiles (id, tipo, display_name) values ($1, 'personal', 'Pro6')`, [proId]);
  const sId = crypto.randomUUID();
  await pool.query(`insert into public.app_users (id, email, password_hash) values ($1, 's6@x.com', $2)`, [sId, await bcrypt.hash("x", 12)]);
  await pool.query(`insert into public.profiles (id, tipo, display_name) values ($1, 'aluno', 'S6')`, [sId]);
  await pool.query(`insert into public.user_basic_info (user_id, full_name, birth_date) values ($1,'S6','1990-01-01')`, [sId]);
  await pool.query(`insert into public.student_professional_links (student_id, professional_id, professional_role, status) values ($1,$2,'personal','active')`, [sId, proId]);
  const app = createApp();
  const login = await request(app).post("/auth/login").send({ email: "p6@x.com", password: "propass" });
  const res = await request(app).patch(`/professional/students/${sId}`).set("Authorization", `Bearer ${login.body.access_token}`).send({ gender: "x" });
  expect(res.status).toBe(400);
  expect(res.body.error).toBe("invalid_body");
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `cd backend/api && npm test -- professional.students`
Expected: FAIL.

- [ ] **Step 3: Implementar o handler**

Antes de `export default router;`:

```ts
const PatchStudentBody = z
  .object({
    full_name: z.string().trim().min(3).optional(),
    phone: z.string().trim().min(1).nullable().optional(),
    gender: z.enum(["masculino", "feminino", "nao_informar", "outro"]).optional(),
    birth_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    body_weight_kg: z.number().min(20).max(400).nullable().optional(),
    height_cm: z.number().min(90).max(250).nullable().optional(),
  })
  .strict();

router.patch("/:student_id", async (req, res) => {
  const professionalId = authedUserId(req);
  const sid = req.params.student_id;
  if (!z.string().uuid().safeParse(sid).success) {
    return res.status(400).json({ error: "invalid_params" });
  }
  const parsed = PatchStudentBody.safeParse(req.body);
  if (!parsed.success || Object.keys(parsed.data).length === 0) {
    return res.status(400).json({ error: "invalid_body" });
  }
  try {
    const out = await withTx(async (client) => {
      const meQ = await client.query<{ tipo: string }>(`select tipo from public.profiles where id = $1`, [professionalId]);
      const tipo = meQ.rows[0]?.tipo ?? null;
      if (tipo !== "personal" && tipo !== "nutricionista") return { ok: false as const, error: "not_professional" as const };
      const link = await client.query(
        `select '1' from public.student_professional_links
          where professional_id = $1 and student_id = $2 and status = 'active' limit 1`,
        [professionalId, sid],
      );
      if (!link.rowCount) return { ok: false as const, error: "student_not_linked" as const };

      const cols = Object.keys(parsed.data);
      const sets = cols.map((c, i) => `${c} = $${i + 2}`).join(", ");
      const values = cols.map((c) => (parsed.data as Record<string, unknown>)[c]);
      await client.query(`update public.user_basic_info set ${sets}, updated_at = now() where user_id = $1`, [sid, ...values]);
      return { ok: true as const };
    });
    if (!out.ok) {
      if (out.error === "not_professional") return res.status(403).json({ error: out.error });
      return res.status(404).json({ error: out.error });
    }
    return res.json({ ok: true });
  } catch (e: unknown) {
    return sendInternalError(res, e);
  }
});
```

> Nota DRY: os nomes de coluna do `SET` vêm de uma whitelist Zod (`.strict()`), então nunca há injeção de coluna arbitrária.

- [ ] **Step 4: Rodar e ver passar**

Run: `cd backend/api && npm test -- professional.students`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
cd backend && git add api/src/routes/professionalStudents.ts api/test/professional.students.int.test.ts
git commit -m "feat(api): PATCH /professional/students/:id (editar dados básicos)"
```

---

### Task 5: `PATCH /professional/students/:id/status` — arquivar/reativar

**Files:**
- Modify: `api/src/routes/professionalStudents.ts`
- Test: `api/test/professional.students.int.test.ts`

- [ ] **Step 1: Escrever o teste que falha**

```ts
it("toggles link status (revoke then reactivate)", async () => {
  const proId = crypto.randomUUID();
  await pool.query(`insert into public.app_users (id, email, password_hash) values ($1, 'p7@x.com', $2)`, [proId, await bcrypt.hash("propass", 12)]);
  await pool.query(`insert into public.profiles (id, tipo, display_name) values ($1, 'personal', 'Pro7')`, [proId]);
  const sId = crypto.randomUUID();
  await pool.query(`insert into public.app_users (id, email, password_hash) values ($1, 's7@x.com', $2)`, [sId, await bcrypt.hash("x", 12)]);
  await pool.query(`insert into public.profiles (id, tipo, display_name) values ($1, 'aluno', 'S7')`, [sId]);
  await pool.query(`insert into public.user_basic_info (user_id, full_name, birth_date) values ($1,'S7','1990-01-01')`, [sId]);
  await pool.query(`insert into public.student_professional_links (student_id, professional_id, professional_role, status) values ($1,$2,'personal','active')`, [sId, proId]);

  const app = createApp();
  const login = await request(app).post("/auth/login").send({ email: "p7@x.com", password: "propass" });
  const auth = `Bearer ${login.body.access_token}`;

  const revoke = await request(app).patch(`/professional/students/${sId}/status`).set("Authorization", auth).send({ status: "revoked" });
  expect(revoke.status, JSON.stringify(revoke.body)).toBe(200);
  const afterRevoke = await request(app).get("/professional/students").set("Authorization", auth);
  expect(afterRevoke.body.students.length).toBe(0);

  const react = await request(app).patch(`/professional/students/${sId}/status`).set("Authorization", auth).send({ status: "active" });
  expect(react.status).toBe(200);
  const afterReact = await request(app).get("/professional/students").set("Authorization", auth);
  expect(afterReact.body.students.length).toBe(1);
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `cd backend/api && npm test -- professional.students`
Expected: FAIL.

- [ ] **Step 3: Implementar o handler**

Antes de `export default router;`:

```ts
const PatchStatusBody = z.object({ status: z.enum(["active", "revoked"]) }).strict();

router.patch("/:student_id/status", async (req, res) => {
  const professionalId = authedUserId(req);
  const sid = req.params.student_id;
  if (!z.string().uuid().safeParse(sid).success) return res.status(400).json({ error: "invalid_params" });
  const parsed = PatchStatusBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "invalid_body" });
  try {
    const out = await withTx(async (client) => {
      const meQ = await client.query<{ tipo: string }>(`select tipo from public.profiles where id = $1`, [professionalId]);
      const tipo = meQ.rows[0]?.tipo ?? null;
      if (tipo !== "personal" && tipo !== "nutricionista") return { ok: false as const, error: "not_professional" as const };
      const upd = await client.query(
        `update public.student_professional_links set status = $3
          where professional_id = $1 and student_id = $2`,
        [professionalId, sid, parsed.data.status],
      );
      if (!upd.rowCount) return { ok: false as const, error: "student_not_linked" as const };
      return { ok: true as const };
    });
    if (!out.ok) {
      if (out.error === "not_professional") return res.status(403).json({ error: out.error });
      return res.status(404).json({ error: out.error });
    }
    return res.json({ ok: true, status: parsed.data.status });
  } catch (e: unknown) {
    return sendInternalError(res, e);
  }
});
```

- [ ] **Step 4: Rodar e ver passar (suíte inteira)**

Run: `cd backend/api && npm test`
Expected: PASS (toda a suíte).

- [ ] **Step 5: Commit**

```bash
cd backend && git add api/src/routes/professionalStudents.ts api/test/professional.students.int.test.ts
git commit -m "feat(api): PATCH /professional/students/:id/status (arquivar/reativar)"
```

---

# PARTE B — Web (`Actus_web`)

### Task 6: Schemas — Student estendido + StudentBadge

**Files:**
- Modify: `src/lib/schemas.ts:29-47`

- [ ] **Step 1: Estender `StudentSchema` e adicionar `StudentBadge`**

Trocar o bloco `StudentSchema` por (mantendo o comentário existente):

```ts
export const StudentSchema = z.object({
  id: z.string(),
  email: z.string(),
  full_name: z.string().nullable(),
  birth_date: z.string().nullable(),
  professional_role: z.enum(['personal', 'nutricionista']),
  linked_at: z.string(),
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
```

- [ ] **Step 2: Verificar typecheck**

Run: `cd web && npx tsc -b`
Expected: sem erros novos.

- [ ] **Step 3: Commit**

```bash
cd web && git add src/lib/schemas.ts
git commit -m "feat(web): schema de Student com campos ricos + StudentBadge"
```

---

### Task 7: Hooks — status param, badges, mutações

**Files:**
- Modify: `src/hooks/useStudents.ts:6-14`
- Create: `src/hooks/useStudentProfile.ts`

- [ ] **Step 1: `useStudents` aceitar status**

Trocar a função `useStudents` por:

```ts
export type StudentsFilter = 'active' | 'revoked' | 'all';

export function useStudents(status: StudentsFilter = 'active') {
  return useQuery({
    queryKey: ['students', status],
    queryFn: async () => {
      const r = await api.get('/professional/students', { params: { status } });
      return StudentsResponseSchema.parse(r.data).students;
    },
  });
}
```

- [ ] **Step 2: Criar `src/hooks/useStudentProfile.ts`**

```ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { StudentBadgesResponseSchema } from '../lib/schemas';

export function useStudentBadges(studentId: string) {
  return useQuery({
    queryKey: ['student-badges', studentId],
    enabled: studentId !== '',
    queryFn: async () => {
      const r = await api.get(`/professional/students/${studentId}/badges`);
      return StudentBadgesResponseSchema.parse(r.data).badges;
    },
    staleTime: 60_000,
  });
}

export type EditStudentInput = {
  full_name?: string;
  phone?: string | null;
  gender?: 'masculino' | 'feminino' | 'nao_informar' | 'outro';
  birth_date?: string;
  body_weight_kg?: number | null;
  height_cm?: number | null;
};

export function useUpdateStudent(studentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: EditStudentInput) => {
      await api.patch(`/professional/students/${studentId}`, input);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['students'] });
    },
  });
}

export function useSetStudentStatus(studentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (status: 'active' | 'revoked') => {
      await api.patch(`/professional/students/${studentId}/status`, { status });
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['students'] });
    },
  });
}
```

- [ ] **Step 3: Typecheck**

Run: `cd web && npx tsc -b`
Expected: sem erros. (Se algum chamador de `useStudents()` quebrar, ele usa o default `'active'` — não quebra.)

- [ ] **Step 4: Commit**

```bash
cd web && git add src/hooks/useStudents.ts src/hooks/useStudentProfile.ts
git commit -m "feat(web): hooks de badges, edição e status do aluno"
```

---

### Task 8: Helper de idade + `VisaoGeralTab`

**Files:**
- Modify: `src/lib/studentStatus.ts` (adicionar `ageFromBirthDate`)
- Create: `src/pages/alunos/VisaoGeralTab.tsx`

- [ ] **Step 1: Helper de idade**

Adicionar ao fim de `src/lib/studentStatus.ts`:

```ts
/** Idade em anos a partir de 'YYYY-MM-DD' (componentes locais; null se inválido). */
export function ageFromBirthDate(birthDate: string | null): number | null {
  if (!birthDate) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(birthDate);
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const now = new Date();
  let age = now.getFullYear() - y;
  if (now.getMonth() + 1 < mo || (now.getMonth() + 1 === mo && now.getDate() < d)) age--;
  return age >= 0 && age < 150 ? age : null;
}
```

- [ ] **Step 2: Criar `VisaoGeralTab.tsx` (layout B)**

```tsx
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Tag } from '../../components/ui/Tag';
import type { Student } from '../../lib/schemas';
import { ageFromBirthDate } from '../../lib/studentStatus';

const GENDER_LABEL: Record<string, string> = {
  masculino: 'Masculino',
  feminino: 'Feminino',
  nao_informar: 'Não informado',
  outro: 'Outro',
};

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <Card className="!p-3">
      <div className="text-[9px] uppercase tracking-wider text-text-3">{label}</div>
      <div className="font-mono text-lg text-text-1">{value}</div>
    </Card>
  );
}

function ContactRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-outline-v py-2 last:border-0">
      <span className="text-[10px] uppercase tracking-wider text-text-3">{label}</span>
      <span className="text-sm text-text-1">{value}</span>
    </div>
  );
}

export function VisaoGeralTab({
  student,
  archived,
  onEdit,
  onToggleStatus,
}: {
  student: Student;
  archived: boolean;
  onEdit: () => void;
  onToggleStatus: () => void;
}) {
  const age = ageFromBirthDate(student.birth_date);
  const memberSince = student.linked_at ? new Date(student.linked_at).toLocaleDateString('pt-BR') : '—';
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <Avatar name={student.full_name} size="lg" />
        <div className="min-w-0 flex-1">
          <h2 className="truncate font-display text-xl font-black uppercase tracking-wide text-text-1">
            {student.full_name ?? student.email}
          </h2>
          <Tag variant={archived ? 'neutral' : 'ok'}>{archived ? 'Arquivado' : 'Ativo'}</Tag>
        </div>
        <Button variant="primary" className="!px-4 !py-1.5 !text-xs" onClick={onEdit}>
          Editar dados
        </Button>
        <Button variant="secondary" className="!px-4 !py-1.5 !text-xs" onClick={onToggleStatus}>
          {archived ? 'Reativar' : 'Desativar'}
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Metric label="Idade" value={age == null ? '—' : `${age}`} />
        <Metric label="Peso" value={student.body_weight_kg == null ? '—' : `${student.body_weight_kg} kg`} />
        <Metric label="Altura" value={student.height_cm == null ? '—' : `${(student.height_cm / 100).toFixed(2)} m`} />
        <Metric label="Membro desde" value={memberSince} />
      </div>

      <Card>
        <div className="mb-2 text-[10px] uppercase tracking-wider text-neon">Contato</div>
        <ContactRow label="Telefone" value={student.phone ?? '—'} />
        <ContactRow label="Gênero" value={student.gender ? GENDER_LABEL[student.gender] : '—'} />
        <ContactRow label="E-mail" value={student.email} />
      </Card>
    </div>
  );
}
```

> Antes de usar `variant="ok"`/`"neutral"`/`"primary"`/`"secondary"`, confirmar os nomes reais em `Tag.tsx` e `Button.tsx`; ajustar para os variants existentes (na lista, `deriveStudentStatus` já devolve `tone` — usar o mesmo conjunto).

- [ ] **Step 3: Typecheck + lint**

Run: `cd web && npx tsc -b && npm run lint`
Expected: sem erros.

- [ ] **Step 4: Commit**

```bash
cd web && git add src/lib/studentStatus.ts src/pages/alunos/VisaoGeralTab.tsx
git commit -m "feat(web): tab Visão Geral do perfil do aluno (layout B)"
```

---

### Task 9: `BadgesTab` (grade única)

**Files:**
- Create: `src/pages/alunos/BadgesTab.tsx`

- [ ] **Step 1: Criar o componente**

```tsx
import { Card } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import { useStudentBadges } from '../../hooks/useStudentProfile';
import type { StudentBadge } from '../../lib/schemas';

function BadgeCell({ badge }: { badge: StudentBadge }) {
  const earnedAt = badge.earned_at ? new Date(badge.earned_at).toLocaleDateString('pt-BR') : null;
  return (
    <Card className={`flex flex-col items-center gap-1 text-center !p-3 ${badge.earned ? '' : 'opacity-40 grayscale'}`}>
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-2 text-xl">
        {badge.earned ? '★' : '🔒'}
      </div>
      <div className="text-[11px] font-bold text-text-1">{badge.name}</div>
      <div className="font-mono text-[9px] text-text-3">
        {badge.earned ? (earnedAt ?? 'Conquistado') : (badge.description ?? '')}
      </div>
    </Card>
  );
}

export function BadgesTab({ studentId }: { studentId: string }) {
  const { data, isLoading } = useStudentBadges(studentId);
  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {Array.from({ length: 7 }, (_, i) => <Skeleton key={i} className="h-28 w-full" />)}
      </div>
    );
  }
  const badges = data ?? [];
  if (badges.length === 0) return <p className="py-8 text-center text-sm text-text-3">Sem conquistas ainda.</p>;
  const earned = badges.filter((b) => b.earned).length;
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between">
        <span className="font-display text-base font-bold uppercase tracking-wide text-text-1">Conquistas</span>
        <span className="font-mono text-xs text-text-3">{earned} / {badges.length}</span>
      </div>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {badges.map((b) => <BadgeCell key={b.id} badge={b} />)}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck + lint**

Run: `cd web && npx tsc -b && npm run lint`
Expected: sem erros.

- [ ] **Step 3: Commit**

```bash
cd web && git add src/pages/alunos/BadgesTab.tsx
git commit -m "feat(web): tab Badges (grade única conquistados/bloqueados)"
```

---

### Task 10: `EditStudentModal`

**Files:**
- Create: `src/pages/alunos/EditStudentModal.tsx`

- [ ] **Step 1: Criar o modal**

```tsx
import { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { useUpdateStudent, type EditStudentInput } from '../../hooks/useStudentProfile';
import type { Student } from '../../lib/schemas';

const FIELD = 'mt-1 h-9 w-full rounded-xl border border-outline-v bg-surface-1 px-3 text-sm text-text-1 focus:border-neon focus:outline-none';
const LABEL = 'text-[10px] uppercase tracking-wider text-text-3';

export function EditStudentModal({ student, open, onClose }: { student: Student; open: boolean; onClose: () => void }) {
  const update = useUpdateStudent(student.id);
  const [fullName, setFullName] = useState(student.full_name ?? '');
  const [phone, setPhone] = useState(student.phone ?? '');
  const [gender, setGender] = useState(student.gender ?? 'nao_informar');
  const [birth, setBirth] = useState(student.birth_date ?? '');
  const [weight, setWeight] = useState(student.body_weight_kg != null ? String(student.body_weight_kg) : '');
  const [height, setHeight] = useState(student.height_cm != null ? String(student.height_cm) : '');

  function submit() {
    const input: EditStudentInput = {
      full_name: fullName.trim() || undefined,
      phone: phone.trim() === '' ? null : phone.trim(),
      gender,
      birth_date: birth || undefined,
      body_weight_kg: weight === '' ? null : Number(weight),
      height_cm: height === '' ? null : Number(height),
    };
    update.mutate(input, { onSuccess: onClose });
  }

  return (
    <Modal open={open} onClose={onClose} title="Editar dados do aluno">
      <div className="flex flex-col gap-3">
        <label><span className={LABEL}>Nome</span><input className={FIELD} value={fullName} onChange={(e) => setFullName(e.target.value)} /></label>
        <label><span className={LABEL}>Telefone</span><input className={FIELD} value={phone} onChange={(e) => setPhone(e.target.value)} /></label>
        <label><span className={LABEL}>Gênero</span>
          <select className={FIELD} value={gender} onChange={(e) => setGender(e.target.value as typeof gender)}>
            <option value="masculino">Masculino</option>
            <option value="feminino">Feminino</option>
            <option value="outro">Outro</option>
            <option value="nao_informar">Não informar</option>
          </select>
        </label>
        <label><span className={LABEL}>Nascimento</span><input type="date" className={FIELD} value={birth} onChange={(e) => setBirth(e.target.value)} /></label>
        <div className="flex gap-3">
          <label className="flex-1"><span className={LABEL}>Peso (kg)</span><input className={FIELD} inputMode="decimal" value={weight} onChange={(e) => setWeight(e.target.value)} /></label>
          <label className="flex-1"><span className={LABEL}>Altura (cm)</span><input className={FIELD} inputMode="decimal" value={height} onChange={(e) => setHeight(e.target.value)} /></label>
        </div>
        <div className="mt-2 flex justify-end gap-2">
          <Button variant="secondary" className="!px-4 !py-1.5 !text-xs" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" className="!px-4 !py-1.5 !text-xs" onClick={submit} disabled={update.isPending}>
            {update.isPending ? 'Salvando…' : 'Salvar'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
```

- [ ] **Step 2: Typecheck + lint**

Run: `cd web && npx tsc -b && npm run lint`
Expected: sem erros.

- [ ] **Step 3: Commit**

```bash
cd web && git add src/pages/alunos/EditStudentModal.tsx
git commit -m "feat(web): modal de editar dados do aluno"
```

---

### Task 11: `ConfirmDialog` reutilizável

**Files:**
- Create: `src/components/ui/ConfirmDialog.tsx`

- [ ] **Step 1: Criar o componente (reusa Modal)**

```tsx
import { Button } from './Button';
import { Modal } from './Modal';

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  onConfirm,
  onClose,
  pending,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onClose: () => void;
  pending?: boolean;
}) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <p className="text-sm text-text-2">{message}</p>
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="secondary" className="!px-4 !py-1.5 !text-xs" onClick={onClose}>Cancelar</Button>
        <Button variant="primary" className="!px-4 !py-1.5 !text-xs" onClick={onConfirm} disabled={pending}>
          {pending ? '…' : confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
```

- [ ] **Step 2: Typecheck + lint**

Run: `cd web && npx tsc -b && npm run lint`
Expected: sem erros.

- [ ] **Step 3: Commit**

```bash
cd web && git add src/components/ui/ConfirmDialog.tsx
git commit -m "feat(web): ConfirmDialog reutilizável"
```

---

### Task 12: `AlunoDetailPage` — novas tabs + accordion responsivo + ações

**Files:**
- Modify: `src/pages/alunos/AlunoDetailPage.tsx` (reescrita)

- [ ] **Step 1: Reescrever a página integrando tudo**

```tsx
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Skeleton } from '../../components/ui/Skeleton';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { useStudents } from '../../hooks/useStudents';
import { useSetStudentStatus } from '../../hooks/useStudentProfile';
import { VisaoGeralTab } from './VisaoGeralTab';
import { BadgesTab } from './BadgesTab';
import { TreinosTab } from './TreinosTab';
import { HistoricoTab } from './HistoricoTab';
import { EditStudentModal } from './EditStudentModal';

type TabKey = 'visao' | 'treinos' | 'historico' | 'badges';
const tabs: { key: TabKey; label: string }[] = [
  { key: 'visao', label: 'Visão Geral' },
  { key: 'treinos', label: 'Treinos' },
  { key: 'historico', label: 'Histórico' },
  { key: 'badges', label: 'Badges' },
];

export function AlunoDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [tab, setTab] = useState<TabKey>('visao');
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);

  // Busca em 'all' para também abrir alunos arquivados.
  const studentsQuery = useStudents('all');
  const student = studentsQuery.data?.find((s) => s.id === id);
  const archived = student?.status === 'revoked';
  const setStatus = useSetStudentStatus(id ?? '');

  if (!id) return null;

  function renderTab() {
    if (!student) return null;
    switch (tab) {
      case 'visao':
        return (
          <VisaoGeralTab
            student={student}
            archived={archived}
            onEdit={() => setEditing(true)}
            onToggleStatus={() => setConfirming(true)}
          />
        );
      case 'treinos':
        return <TreinosTab studentId={id} />;
      case 'historico':
        return <HistoricoTab studentId={id} />;
      case 'badges':
        return <BadgesTab studentId={id} />;
    }
  }

  return (
    <div className="flex-1">
      <div className="flex h-[52px] items-center gap-3 border-b border-outline-v px-6">
        <Link to="/app/alunos" className="text-sm text-text-3 hover:text-neon">‹ Alunos</Link>
      </div>

      <div className="p-6">
        {studentsQuery.isLoading ? (
          <Skeleton className="h-40 w-full" />
        ) : !student ? (
          <p className="text-sm text-text-3">Aluno não encontrado entre os seus vínculos.</p>
        ) : (
          <>
            {/* Desktop: tabs horizontais */}
            <div className="hidden gap-1 border-b border-outline-v lg:flex">
              {tabs.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setTab(t.key)}
                  className={`border-b-2 px-4 py-2.5 font-display text-sm font-bold uppercase tracking-wide transition-colors ${
                    tab === t.key ? 'border-neon text-text-1' : 'border-transparent text-text-2 hover:text-text-1'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <div className="mt-5 hidden max-w-3xl lg:block">{renderTab()}</div>

            {/* Mobile: accordion */}
            <div className="flex flex-col gap-2 lg:hidden">
              {tabs.map((t) => (
                <div key={t.key} className="rounded-xl border border-outline-v">
                  <button
                    type="button"
                    onClick={() => setTab(tab === t.key ? ('' as TabKey) : t.key)}
                    className="flex w-full items-center justify-between px-4 py-3 font-display text-sm font-bold uppercase tracking-wide text-text-1"
                  >
                    {t.label}
                    <span className="text-text-3">{tab === t.key ? '−' : '+'}</span>
                  </button>
                  {tab === t.key && <div className="border-t border-outline-v p-4">{renderTab()}</div>}
                </div>
              ))}
            </div>

            <EditStudentModal student={student} open={editing} onClose={() => setEditing(false)} />
            <ConfirmDialog
              open={confirming}
              title={archived ? 'Reativar aluno' : 'Desativar aluno'}
              message={
                archived
                  ? 'O aluno volta para a lista ativa e a contar nos indicadores.'
                  : 'O aluno sai da lista ativa e dos indicadores, mas o histórico é preservado. Você pode reativar depois.'
              }
              confirmLabel={archived ? 'Reativar' : 'Desativar'}
              pending={setStatus.isPending}
              onConfirm={() =>
                setStatus.mutate(archived ? 'active' : 'revoked', { onSuccess: () => setConfirming(false) })
              }
              onClose={() => setConfirming(false)}
            />
          </>
        )}
      </div>
    </div>
  );
}
```

> A `PreferenciasTab` sai do perfil (não está nas 6 tabs do spec); o arquivo pode ficar no repo sem import por ora (remoção fora do escopo deste bloco).

- [ ] **Step 2: Typecheck + lint**

Run: `cd web && npx tsc -b && npm run lint`
Expected: sem erros.

- [ ] **Step 3: Verificação visual**

Run: `cd web && npm run dev` — abrir um aluno, navegar pelas tabs, editar dados, desativar/reativar; reduzir a janela < 1024px e ver as tabs virarem accordion.
Expected: tudo funciona; sem scroll horizontal a 320px.

- [ ] **Step 4: Commit**

```bash
cd web && git add src/pages/alunos/AlunoDetailPage.tsx
git commit -m "feat(web): perfil do aluno com tabs Visão Geral/Badges + ações + accordion mobile"
```

---

### Task 13: `AlunosPage` — ordenação + filtro Arquivados + sidebar responsiva

**Files:**
- Modify: `src/pages/alunos/AlunosPage.tsx`

- [ ] **Step 1: Adicionar estado de ordenação e o filtro Arquivados**

No topo do componente `AlunosPage`, adicionar:

```tsx
  const [sort, setSort] = useState<'nome' | 'checkin' | 'streak'>('nome');
  const [archived, setArchived] = useState(false);
```

Trocar `const studentsQuery = useStudents();` por:

```tsx
  const studentsQuery = useStudents(archived ? 'revoked' : 'active');
```

- [ ] **Step 2: Ordenar `visible`**

Após o `useMemo` de `visible`, adicionar a ordenação (ou inserir antes do `return`):

```tsx
  const sorted = useMemo(() => {
    const arr = [...visible];
    arr.sort((a, b) => {
      if (sort === 'nome') return (a.student.full_name ?? a.student.email).localeCompare(b.student.full_name ?? b.student.email);
      if (sort === 'streak') return (b.student.streak_current ?? 0) - (a.student.streak_current ?? 0);
      // checkin: menor daysSince primeiro; null vai pro fim
      const da = a.status.daysSince ?? Infinity;
      const db = b.status.daysSince ?? Infinity;
      return da - db;
    });
    return arr;
  }, [visible, sort]);
```

Trocar o `.map` da renderização de `visible.map(...)` por `sorted.map(...)`, e a checagem `visible.length === 0` por `sorted.length === 0`.

- [ ] **Step 3: Adicionar dropdown de ordenação e toggle Arquivados no header**

No header (após o `<input type="search" …/>`), antes do botão "Convidar aluno":

```tsx
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as typeof sort)}
            className="h-8 rounded-xl border border-outline-v bg-surface-1 px-2 text-sm text-text-1 focus:border-neon focus:outline-none"
            aria-label="Ordenar por"
          >
            <option value="nome">Nome</option>
            <option value="checkin">Último check-in</option>
            <option value="streak">Streak</option>
          </select>
          <button
            type="button"
            onClick={() => setArchived((v) => !v)}
            className={`h-8 rounded-xl border px-3 text-xs ${archived ? 'border-neon text-neon' : 'border-outline-v text-text-3'}`}
          >
            Arquivados
          </button>
```

- [ ] **Step 4: Sidebar de filtros → hambúrguer < 1024px**

Envolver `<Sidebar sections={sections} />` para esconder no mobile e adicionar um toggle:

```tsx
      <div className="hidden lg:block"><Sidebar sections={sections} /></div>
```

(O filtro por status no mobile fica acessível pelo conjunto de chips já existente do header; se não houver, este bloco apenas garante que a sidebar não quebra o layout < 1024px. Ajuste fino do hambúrguer pode usar um `<details>` nativo envolvendo `Sidebar` se quiser o menu colapsável.)

- [ ] **Step 5: Typecheck + lint**

Run: `cd web && npx tsc -b && npm run lint`
Expected: sem erros.

- [ ] **Step 6: Verificação visual + commit**

Run: `cd web && npm run dev` — testar ordenação, alternar Arquivados (lista muda), e largura < 1024px.

```bash
cd web && git add src/pages/alunos/AlunosPage.tsx
git commit -m "feat(web): ordenação, filtro Arquivados e sidebar responsiva na lista de alunos"
```

---

### Task 14: Fechamento — build, lint e revisão final

**Files:** —

- [ ] **Step 1: Backend — suíte completa**

Run: `cd backend/api && npm test`
Expected: PASS.

- [ ] **Step 2: Web — build + lint**

Run: `cd web && npm run build && npm run lint`
Expected: build OK, lint limpo.

- [ ] **Step 3: Revisão visual ponta a ponta**

Abrir lista → ordenar → arquivar um aluno → ver em Arquivados → reativar → abrir perfil → editar dados → conferir Visão Geral e Badges → testar 320px e 1024px.

- [ ] **Step 4: (Opcional) Push das duas branches**

```bash
cd backend && git push    # branch/davi → Actus_backend
cd web && git push         # branch/davi → Actus_web
```

---

## Self-review (cobertura do spec)

- Visão Geral (layout B) → Task 8/12. Badges (grade única) → Task 9/12. Lista ordenação → Task 13. Filtro Arquivados → Task 13. Editar dados → Task 10/12. Ativar/Desativar (confirm) → Task 11/12. Responsividade (accordion + sidebar) → Task 12/13. Backend: height_cm → Task 1; campos ricos + ?status → Task 2; badges → Task 3; PATCH dados → Task 4; PATCH status → Task 5.
- Sem placeholders de implementação: todo passo traz código ou comando real.
- Consistência de tipos: `Student` (Task 6) usado em 8/10/12; `StudentBadge` (Task 6) em 9; hooks (Task 7) em 9/10/12/13.
- **Verificar em runtime** os nomes de variants de `Button`/`Tag` e classes de token (`text-text-3`, `surface-2`, `neon`, `outline-v`) — usar os reais do projeto onde o plano assumiu nomes.
