import { Router } from "express";
import { z } from "zod";
import { withTx } from "../db.js";
import { authedUserId } from "../middleware/requireAuth.js";
import { queryCheckInsForStudent } from "../studentCheckInsQuery.js";
import { sendInternalError } from "../schemaCompat.js";
import { effectiveStreak } from "../services/streakService.js";

const router = Router();

const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

router.get("/", async (req, res) => {
  const professionalId = authedUserId(req);

  const statusParam = typeof req.query.status === "string" ? req.query.status : "active";
  const statusFilter =
    statusParam === "revoked" ? "revoked" : statusParam === "all" ? "all" : "active";

  try {
    const out = await withTx(async (client) => {
      const meQ = await client.query<{ tipo: "personal" | "nutricionista" | "aluno" | "actus_admin" | "actus_suporte" }>(
        `select tipo from public.profiles where id = $1`,
        [professionalId],
      );
      const tipo = meQ.rows[0]?.tipo ?? null;
      if (tipo !== "personal" && tipo !== "nutricionista") {
        return { ok: false as const, error: "not_professional" as const };
      }

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
          and ($2 = 'all' or spl.status::text = $2)
        order by spl.linked_at desc
        limit 500
        `,
        [professionalId, statusFilter],
      );

      const now = new Date();
      const students = q.rows.map((r) => {
        const linkedAt = r.linked_at instanceof Date ? r.linked_at : new Date(r.linked_at);
        const birthDate = r.birth_date instanceof Date ? r.birth_date : new Date(r.birth_date);
        const lastActivityAt =
          r.last_activity_at == null
            ? null
            : r.last_activity_at instanceof Date
              ? r.last_activity_at
              : new Date(r.last_activity_at);
        const eff = effectiveStreak(Number(r.streak_current ?? 0), lastActivityAt, now);
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
      });

      return { ok: true as const, students };
    });

    if (!out.ok) return res.status(403).json({ error: out.error });
    return res.json({ students: out.students });
  } catch (e: unknown) {
    return sendInternalError(res, e);
  }
});

/** Check-ins de um aluno com vínculo ativo (personal ou nutricionista). */
router.get("/:student_id/check-ins", async (req, res) => {
  const professionalId = authedUserId(req);
  const sid = req.params.student_id;
  if (!z.string().uuid().safeParse(sid).success) {
    return res.status(400).json({ error: "invalid_params" });
  }

  const limitRaw = req.query.limit;
  const fromRaw = req.query.from;
  const toRaw = req.query.to;
  let limit = 120;
  if (limitRaw !== undefined) {
    const n = Number(typeof limitRaw === "string" ? limitRaw : Array.isArray(limitRaw) ? limitRaw[0] : NaN);
    if (!Number.isFinite(n) || n < 1 || n > 500) {
      return res.status(400).json({ error: "invalid_query", detail: "limit must be between 1 and 500" });
    }
    limit = Math.floor(n);
  }
  const from = typeof fromRaw === "string" ? fromRaw : undefined;
  const to = typeof toRaw === "string" ? toRaw : undefined;
  if (from !== undefined && !dateOnly.safeParse(from).success) {
    return res.status(400).json({ error: "invalid_query", detail: "from must be YYYY-MM-DD" });
  }
  if (to !== undefined && !dateOnly.safeParse(to).success) {
    return res.status(400).json({ error: "invalid_query", detail: "to must be YYYY-MM-DD" });
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

      const link = await client.query<{ one: string }>(
        `
        select '1' as one
        from public.student_professional_links spl
        where spl.professional_id = $1
          and spl.student_id = $2
          and spl.status = 'active'
        limit 1
        `,
        [professionalId, sid],
      );
      if (!link.rowCount) {
        return { ok: false as const, error: "student_not_linked" as const };
      }

      const rows = await queryCheckInsForStudent(client, sid, { from, to, limit });
      return { ok: true as const, check_ins: rows };
    });

    if (!out.ok) {
      if (out.error === "not_professional") return res.status(403).json({ error: out.error });
      return res.status(404).json({ error: out.error });
    }
    return res.json({ student_id: sid, check_ins: out.check_ins });
  } catch (e: unknown) {
    return sendInternalError(res, e);
  }
});

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

export default router;

