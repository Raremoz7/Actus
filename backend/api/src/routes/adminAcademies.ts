import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { withTx } from "../db.js";
import { sha256, uuid } from "../crypto.js";
import { authedUserId } from "../middleware/requireAuth.js";

// [ACTUS — academia] Onboarding pela equipe Actus (requireStaff): cria a academia e designa o
// gestor (perfil de gestão pura, tipo='gestor'). Reaproveita o padrão de criação de usuário de
// adminProfessionals.ts. A gestão da equipe de instrutores fica no painel do gestor (routes/academy.ts).

const router = Router();

const createAcademySchema = z.object({
  name: z.string().min(1).max(200),
  slug: z
    .string()
    .min(1)
    .max(120)
    .regex(/^[a-z0-9-]+$/, "slug_invalid")
    .optional(),
  cnpj: z.string().min(11).max(32).optional(),
  timezone: z.string().min(1).max(64).optional(),
});

const patchAcademySchema = z
  .object({
    name: z.string().min(1).max(200).optional(),
    slug: z
      .string()
      .min(1)
      .max(120)
      .regex(/^[a-z0-9-]+$/, "slug_invalid")
      .optional()
      .nullable(),
    cnpj: z.string().min(11).max(32).optional().nullable(),
    timezone: z.string().min(1).max(64).optional(),
    status: z.enum(["active", "inactive"]).optional(),
  })
  .refine((o) => Object.keys(o).length > 0, { message: "empty_patch" });

const createManagerSchema = z.object({
  email: z.string().email().max(320),
  password: z.string().min(8).max(200),
  full_name: z.string().min(3).max(200),
  phone: z.string().min(6).max(40).optional(),
  birth_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  cpf: z.string().min(11).max(32).optional(),
  gender: z.enum(["masculino", "feminino", "nao_informar", "outro"]).optional(),
  policy_version: z.string().min(1).max(100).optional().default("v1"),
  must_change_password: z.boolean().optional().default(true),
});

function normalizeCpf(input: string): string {
  return input.replace(/\D/g, "");
}

function isoDate(v: unknown): string {
  const d = v instanceof Date ? v : new Date(String(v));
  return d.toISOString();
}

// POST /admin/academies — cria a academia.
router.post("/", async (req, res) => {
  const actorId = authedUserId(req);
  const parsed = createAcademySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "invalid_body", details: parsed.error.flatten() });
  const { name, slug, cnpj, timezone } = parsed.data;

  try {
    const created = await withTx(async (client) => {
      const id = uuid();
      await client.query(
        `insert into public.academies (id, name, slug, cnpj, timezone, created_by)
         values ($1, $2, $3, $4, coalesce($5, 'America/Sao_Paulo'), $6)`,
        [id, name, slug ?? null, cnpj ?? null, timezone ?? null, actorId],
      );
      return { id };
    });
    return res.status(201).json({ id: created.id, name });
  } catch (e: any) {
    const msg = String(e?.message ?? "");
    if (msg.includes("academies_slug_key")) return res.status(409).json({ error: "slug_already_in_use" });
    return res.status(500).json({ error: "internal_error" });
  }
});

// GET /admin/academies — lista com contagens de equipe.
router.get("/", async (_req, res) => {
  try {
    const out = await withTx(async (client) => {
      const q = await client.query<{
        id: string;
        name: string;
        slug: string | null;
        cnpj: string | null;
        timezone: string;
        status: string;
        created_at: unknown;
        instructors: string | number;
        managers: string | number;
      }>(
        `select a.id, a.name, a.slug, a.cnpj, a.timezone, a.status, a.created_at,
                (select count(*) from public.academy_members m
                   where m.academy_id = a.id and m.role = 'instructor' and m.status = 'active') as instructors,
                (select count(*) from public.academy_members m
                   where m.academy_id = a.id and m.role = 'manager' and m.status = 'active') as managers
         from public.academies a
         order by a.created_at desc
         limit 500`,
      );
      return {
        academies: q.rows.map((r) => ({
          id: r.id,
          name: r.name,
          slug: r.slug,
          cnpj: r.cnpj,
          timezone: r.timezone,
          status: r.status,
          instructors: Number(r.instructors),
          managers: Number(r.managers),
          created_at: isoDate(r.created_at),
        })),
      };
    });
    return res.json(out);
  } catch {
    return res.status(500).json({ error: "internal_error" });
  }
});

// GET /admin/academies/:academy_id — detalhe + membros.
router.get("/:academy_id", async (req, res) => {
  const academyId = req.params.academy_id;
  if (!z.string().uuid().safeParse(academyId).success) return res.status(400).json({ error: "invalid_params" });

  try {
    const out = await withTx(async (client) => {
      const a = await client.query<{
        id: string;
        name: string;
        slug: string | null;
        cnpj: string | null;
        timezone: string;
        status: string;
        created_at: unknown;
      }>(`select id, name, slug, cnpj, timezone, status, created_at from public.academies where id = $1`, [academyId]);
      const academy = a.rows[0];
      if (!academy) return null;

      const m = await client.query<{
        member_id: string;
        user_id: string;
        role: string;
        status: string;
        display_name: string | null;
        email: string;
        tipo: string;
      }>(
        `select am.id as member_id, am.user_id, am.role, am.status,
                p.display_name, au.email, p.tipo::text as tipo
         from public.academy_members am
         join public.profiles p on p.id = am.user_id
         join public.app_users au on au.id = am.user_id
         where am.academy_id = $1
         order by am.role asc, am.created_at asc`,
        [academyId],
      );

      return {
        academy: {
          id: academy.id,
          name: academy.name,
          slug: academy.slug,
          cnpj: academy.cnpj,
          timezone: academy.timezone,
          status: academy.status,
          created_at: isoDate(academy.created_at),
        },
        members: m.rows.map((r) => ({
          id: r.member_id,
          user_id: r.user_id,
          role: r.role,
          status: r.status,
          display_name: r.display_name,
          email: r.email,
          tipo: r.tipo,
        })),
      };
    });
    if (!out) return res.status(404).json({ error: "academy_not_found" });
    return res.json(out);
  } catch {
    return res.status(500).json({ error: "internal_error" });
  }
});

// PATCH /admin/academies/:academy_id — edita dados da academia.
router.patch("/:academy_id", async (req, res) => {
  const academyId = req.params.academy_id;
  if (!z.string().uuid().safeParse(academyId).success) return res.status(400).json({ error: "invalid_params" });
  const parsed = patchAcademySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "invalid_body", details: parsed.error.flatten() });
  const b = parsed.data;

  try {
    const out = await withTx(async (client) => {
      const exists = await client.query(`select 1 from public.academies where id = $1 for update`, [academyId]);
      if (!exists.rowCount) return { ok: false as const };

      const fields: string[] = [];
      const vals: unknown[] = [];
      let i = 1;
      for (const key of ["name", "slug", "cnpj", "timezone", "status"] as const) {
        if (b[key] !== undefined) {
          fields.push(`${key} = $${i++}`);
          vals.push(b[key]);
        }
      }
      vals.push(academyId);
      await client.query(`update public.academies set ${fields.join(", ")}, updated_at = now() where id = $${i}`, vals);
      return { ok: true as const };
    });
    if (!out.ok) return res.status(404).json({ error: "academy_not_found" });
    return res.json({ id: academyId, ...b });
  } catch (e: any) {
    const msg = String(e?.message ?? "");
    if (msg.includes("academies_slug_key")) return res.status(409).json({ error: "slug_already_in_use" });
    return res.status(500).json({ error: "internal_error" });
  }
});

// POST /admin/academies/:academy_id/manager — cria a conta do gestor (tipo='gestor') e o vincula.
router.post("/:academy_id/manager", async (req, res) => {
  const actorId = authedUserId(req);
  const academyId = req.params.academy_id;
  if (!z.string().uuid().safeParse(academyId).success) return res.status(400).json({ error: "invalid_params" });
  const parsed = createManagerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "invalid_body", details: parsed.error.flatten() });

  const { email, password, full_name, phone, birth_date, cpf, gender, policy_version, must_change_password } = parsed.data;
  const password_hash = await bcrypt.hash(password, 12);

  try {
    const out = await withTx(async (client) => {
      const ac = await client.query(`select 1 from public.academies where id = $1`, [academyId]);
      if (!ac.rowCount) return { ok: false as const, error: "academy_not_found" as const };

      const userId = uuid();
      await client.query(
        `insert into public.app_users (id, email, password_hash, must_change_password) values ($1, $2, $3, $4)`,
        [userId, email, password_hash, must_change_password],
      );
      await client.query(
        `insert into public.profiles (id, display_name, tipo) values ($1, $2, 'gestor'::public.user_role)`,
        [userId, full_name],
      );

      if (birth_date) {
        const cpfNorm = cpf ? normalizeCpf(cpf) : null;
        const cpfHash = cpfNorm ? sha256(cpfNorm) : null;
        const cpfLast4 = cpfNorm ? cpfNorm.slice(-4) : null;
        await client.query(
          `insert into public.user_basic_info
             (user_id, full_name, cpf_normalized, cpf_hash, cpf_last4, birth_date, phone, gender)
           values ($1, $2, $3, $4, $5, $6::date, $7, $8::public.user_gender)`,
          [userId, full_name, cpfNorm, cpfHash, cpfLast4, birth_date, phone ?? null, gender ?? "nao_informar"],
        );
      } else if (phone) {
        await client.query(`update public.profiles set phone = $1 where id = $2`, [phone, userId]);
      }

      await client.query(
        `insert into public.user_lgpd_consents (id, user_id, policy_version, source) values ($1, $2, $3, 'admin')`,
        [uuid(), userId, policy_version],
      );

      await client.query(
        `insert into public.academy_members (id, academy_id, user_id, role, status, invited_by, joined_at)
         values ($1, $2, $3, 'manager', 'active', $4, now())`,
        [uuid(), academyId, userId, actorId],
      );

      return { ok: true as const, userId };
    });

    if (!out.ok) return res.status(404).json({ error: out.error });
    return res.status(201).json({ id: out.userId, email, academy_id: academyId, role: "manager" });
  } catch (e: any) {
    const msg = String(e?.message ?? "");
    if (msg.includes("app_users_email_key")) return res.status(409).json({ error: "email_already_in_use" });
    if (msg.includes("user_basic_info_cpf_hash_key")) return res.status(409).json({ error: "cpf_already_in_use" });
    if (msg.includes("duplicate key")) {
      return res.status(409).json({ error: "conflict", ...(process.env.NODE_ENV === "test" ? { detail: msg } : {}) });
    }
    return res.status(500).json({ error: "internal_error" });
  }
});

export default router;
