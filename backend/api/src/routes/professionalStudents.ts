import { Router } from "express";
import { z } from "zod";
import { withTx } from "../db.js";
import { authedUserId } from "../middleware/requireAuth.js";
import { queryCheckInsForStudent } from "../studentCheckInsQuery.js";
import { sendInternalError } from "../schemaCompat.js";

const router = Router();

const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

router.get("/", async (req, res) => {
  const professionalId = authedUserId(req);

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
        professional_role: "personal" | "nutricionista";
        linked_at: any;
      }>(
        `
        select
          spl.student_id,
          sp.display_name as student_display_name,
          ubi.full_name,
          ubi.birth_date,
          au.email,
          spl.professional_role,
          spl.linked_at
        from public.student_professional_links spl
        join public.profiles sp on sp.id = spl.student_id
        join public.app_users au on au.id = spl.student_id
        left join public.user_basic_info ubi on ubi.user_id = spl.student_id
        where spl.professional_id = $1
          and spl.status = 'active'
        order by spl.linked_at desc
        limit 500
        `,
        [professionalId],
      );

      const students = q.rows.map((r) => {
        const linkedAt = r.linked_at instanceof Date ? r.linked_at : new Date(r.linked_at);
        const birthDate = r.birth_date instanceof Date ? r.birth_date : new Date(r.birth_date);
        return {
          id: r.student_id,
          email: r.email,
          full_name: r.full_name ?? r.student_display_name ?? null,
          birth_date: Number.isFinite(birthDate.getTime()) ? birthDate.toISOString().slice(0, 10) : null,
          professional_role: r.professional_role,
          linked_at: linkedAt.toISOString(),
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

export default router;

