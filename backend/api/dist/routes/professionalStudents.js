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
    try {
        const out = await withTx(async (client) => {
            const meQ = await client.query(`select tipo from public.profiles where id = $1`, [professionalId]);
            const tipo = meQ.rows[0]?.tipo ?? null;
            if (tipo !== "personal" && tipo !== "nutricionista") {
                return { ok: false, error: "not_professional" };
            }
            const q = await client.query(`
        select
          spl.student_id,
          sp.display_name as student_display_name,
          ubi.full_name,
          ubi.birth_date,
          au.email,
          spl.professional_role,
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
          and spl.status = 'active'
        order by spl.linked_at desc
        limit 500
        `, [professionalId]);
            const now = new Date();
            const students = q.rows.map((r) => {
                const linkedAt = r.linked_at instanceof Date ? r.linked_at : new Date(r.linked_at);
                const birthDate = r.birth_date instanceof Date ? r.birth_date : new Date(r.birth_date);
                const lastActivityAt = r.last_activity_at == null
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
                    linked_at: linkedAt.toISOString(),
                    streak_current: eff.streak_current,
                    is_broken: eff.is_broken,
                    badge_count: Number(r.badge_count ?? 0),
                };
            });
            return { ok: true, students };
        });
        if (!out.ok)
            return res.status(403).json({ error: out.error });
        return res.json({ students: out.students });
    }
    catch (e) {
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
            const meQ = await client.query(`select tipo from public.profiles where id = $1`, [professionalId]);
            const tipo = meQ.rows[0]?.tipo ?? null;
            if (tipo !== "personal" && tipo !== "nutricionista") {
                return { ok: false, error: "not_professional" };
            }
            const link = await client.query(`
        select '1' as one
        from public.student_professional_links spl
        where spl.professional_id = $1
          and spl.student_id = $2
          and spl.status = 'active'
        limit 1
        `, [professionalId, sid]);
            if (!link.rowCount) {
                return { ok: false, error: "student_not_linked" };
            }
            const rows = await queryCheckInsForStudent(client, sid, { from, to, limit });
            return { ok: true, check_ins: rows };
        });
        if (!out.ok) {
            if (out.error === "not_professional")
                return res.status(403).json({ error: out.error });
            return res.status(404).json({ error: out.error });
        }
        return res.json({ student_id: sid, check_ins: out.check_ins });
    }
    catch (e) {
        return sendInternalError(res, e);
    }
});
export default router;
