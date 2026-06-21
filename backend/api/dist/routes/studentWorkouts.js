import { Router } from "express";
import { z } from "zod";
import { withTx } from "../db.js";
import { authedUserId } from "../middleware/requireAuth.js";
import { uuid } from "../crypto.js";
const router = Router({ mergeParams: true });
const paramsSchema = z.object({
    student_id: z.string().uuid(),
});
const assignWorkoutSchema = z.object({
    workout_id: z.string().uuid(),
    weekdays: z.array(z.number().int().min(1).max(7)).min(1).max(7),
    start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    display_order: z.number().int().min(0).max(10_000).optional(),
    is_active: z.boolean().optional(),
});
const patchAssignWorkoutSchema = z
    .object({
    weekdays: z.array(z.number().int().min(1).max(7)).min(1).max(7).optional(),
    start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
    end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
    display_order: z.number().int().min(0).max(10_000).optional(),
    is_active: z.boolean().optional(),
})
    .refine((o) => Object.keys(o).length > 0, { message: "empty_patch" });
// [ACTUS-NEW] A1 — GET treinos atribuídos a um aluno (visão do profissional).
// Contrato: app/docs/contrato-backend-treinos-do-aluno.md. Mesma forma de GET /me/workouts.
// Autorização: tipo personal + vínculo ativo (igual ao POST/PATCH abaixo).
router.get("/", async (req, res) => {
    const personalId = authedUserId(req);
    const p = paramsSchema.safeParse(req.params);
    if (!p.success)
        return res.status(400).json({ error: "invalid_params", details: p.error.flatten() });
    const studentId = p.data.student_id;
    // Filtro opcional ?active=true|false (default: todas; o app filtra no cliente).
    const activeQ = req.query.active;
    const active = typeof activeQ === "string" ? (activeQ === "true" ? true : activeQ === "false" ? false : null) : null;
    if (activeQ !== undefined && active === null) {
        return res.status(400).json({ error: "invalid_query", detail: "active must be true or false" });
    }
    try {
        const out = await withTx(async (client) => {
            const meQ = await client.query(`select tipo::text as tipo from public.profiles where id = $1`, [personalId]);
            if (meQ.rows[0]?.tipo !== "personal")
                return { ok: false, error: "only_personal" };
            const linkQ = await client.query(`
        select 1 from public.student_professional_links
        where student_id = $1 and professional_id = $2 and professional_role = 'personal' and status = 'active'
        limit 1
        `, [studentId, personalId]);
            if (!linkQ.rowCount)
                return { ok: false, error: "student_not_linked" };
            let sql = `
        select
          sw.id, sw.student_id, sw.workout_id, sw.weekdays, sw.start_date, sw.end_date,
          sw.display_order, sw.is_active, sw.created_at,
          w.name as workout_name,
          w.notes as workout_notes,
          coalesce(wec.cnt, 0)::int as exercise_count,
          lcd.scheduled_for_date as last_completed_date
        from public.student_workouts sw
        join public.workouts w on w.id = sw.workout_id
        left join (
          select we.workout_id, count(*)::int as cnt
          from public.workout_exercises we
          group by we.workout_id
        ) wec on wec.workout_id = sw.workout_id
        left join (
          select ws.student_workout_id, min(ws.scheduled_for_date) as scheduled_for_date
          from public.workout_sessions ws
          inner join (
            select student_workout_id, max(completed_at) as mx
            from public.workout_sessions
            where status::text in ('completed', 'completed_partial')
            group by student_workout_id
          ) t on t.student_workout_id = ws.student_workout_id and ws.completed_at = t.mx
          where ws.status::text in ('completed', 'completed_partial')
          group by ws.student_workout_id
        ) lcd on lcd.student_workout_id = sw.id
        where sw.student_id = $1
      `;
            const params = [studentId];
            if (active !== null) {
                sql += ` and sw.is_active = $2`;
                params.push(active);
            }
            sql += ` order by sw.display_order asc, sw.created_at desc limit 500`;
            const q = await client.query(sql, params);
            return { ok: true, rows: q.rows };
        });
        if (!out.ok)
            return res.status(403).json({ error: out.error });
        const student_workouts = out.rows.map((r) => ({
            id: r.id,
            student_id: r.student_id,
            workout_id: r.workout_id,
            weekdays: r.weekdays,
            start_date: formatDateOnly(r.start_date),
            end_date: r.end_date != null ? formatDateOnly(r.end_date) : null,
            display_order: r.display_order,
            is_active: r.is_active,
            created_at: toIso(r.created_at),
            workout_name: r.workout_name,
            workout_notes: r.workout_notes,
            exercise_count: r.exercise_count,
            last_completed_date: r.last_completed_date != null ? formatDateOnly(r.last_completed_date) : null,
        }));
        return res.json({ student_workouts });
    }
    catch {
        return res.status(500).json({ error: "internal_error" });
    }
});
router.post("/", async (req, res) => {
    const personalId = authedUserId(req);
    const p = paramsSchema.safeParse(req.params);
    if (!p.success)
        return res.status(400).json({ error: "invalid_params", details: p.error.flatten() });
    const parsed = assignWorkoutSchema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: "invalid_body", details: parsed.error.flatten() });
    const studentId = p.data.student_id;
    const { workout_id, weekdays, start_date, end_date, display_order, is_active } = parsed.data;
    try {
        const out = await withTx(async (client) => {
            const meQ = await client.query(`select tipo from public.profiles where id = $1`, [personalId]);
            const tipo = meQ.rows[0]?.tipo ?? null;
            if (tipo !== "personal")
                return { ok: false, error: "only_personal" };
            const linkQ = await client.query(`
        select 1
        from public.student_professional_links
        where student_id = $1
          and professional_id = $2
          and professional_role = 'personal'
          and status = 'active'
        limit 1
        `, [studentId, personalId]);
            if (!linkQ.rowCount)
                return { ok: false, error: "student_not_linked" };
            const workoutQ = await client.query(`
        select 1
        from public.workouts
        where id = $1
          and owner_personal_id = $2
        limit 1
        `, [workout_id, personalId]);
            if (!workoutQ.rowCount)
                return { ok: false, error: "workout_not_found" };
            const id = uuid();
            const ins = await client.query(`
        insert into public.student_workouts
          (id, student_id, workout_id, weekdays, start_date, end_date, display_order, is_active)
        values
          ($1, $2, $3, $4::integer[], $5::date, $6::date, $7, $8)
        returning id
        `, [
                id,
                studentId,
                workout_id,
                weekdays,
                start_date ?? null,
                end_date ?? null,
                display_order ?? 0,
                is_active ?? true,
            ]);
            return { ok: true, student_workout_id: ins.rows[0]?.id ?? id };
        });
        if (!out.ok)
            return res.status(403).json({ error: out.error });
        return res.status(201).json(out);
    }
    catch {
        return res.status(500).json({ error: "internal_error" });
    }
});
router.patch("/:student_workout_id", async (req, res) => {
    const personalId = authedUserId(req);
    const p = paramsSchema.safeParse(req.params);
    if (!p.success)
        return res.status(400).json({ error: "invalid_params", details: p.error.flatten() });
    const swId = req.params.student_workout_id;
    if (!z.string().uuid().safeParse(swId).success)
        return res.status(400).json({ error: "invalid_params" });
    const parsed = patchAssignWorkoutSchema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: "invalid_body", details: parsed.error.flatten() });
    const studentId = p.data.student_id;
    try {
        const out = await withTx(async (client) => {
            const meQ = await client.query(`select tipo::text as tipo from public.profiles where id = $1`, [personalId]);
            if (meQ.rows[0]?.tipo !== "personal")
                return { ok: false, error: "only_personal" };
            const linkQ = await client.query(`
        select 1 from public.student_professional_links
        where student_id = $1 and professional_id = $2 and professional_role = 'personal' and status = 'active'
        limit 1
        `, [studentId, personalId]);
            if (!linkQ.rowCount)
                return { ok: false, error: "student_not_linked" };
            const rowQ = await client.query(`
        select sw.id, sw.workout_id
        from public.student_workouts sw
        join public.workouts w on w.id = sw.workout_id
        where sw.id = $1 and sw.student_id = $2 and w.owner_personal_id = $3
        `, [swId, studentId, personalId]);
            const row = rowQ.rows[0];
            if (!row)
                return { ok: false, error: "not_found" };
            const { weekdays, start_date, end_date, display_order, is_active } = parsed.data;
            const sets = [];
            const vals = [];
            let i = 1;
            if (weekdays !== undefined) {
                sets.push(`weekdays = $${i++}::integer[]`);
                vals.push(weekdays);
            }
            if (start_date !== undefined) {
                sets.push(`start_date = $${i++}::date`);
                vals.push(start_date);
            }
            if (end_date !== undefined) {
                sets.push(`end_date = $${i++}::date`);
                vals.push(end_date);
            }
            if (display_order !== undefined) {
                sets.push(`display_order = $${i++}`);
                vals.push(display_order);
            }
            if (is_active !== undefined) {
                sets.push(`is_active = $${i++}`);
                vals.push(is_active);
            }
            vals.push(swId);
            await client.query(`update public.student_workouts set ${sets.join(", ")}, updated_at = now() where id = $${i}`, vals);
            const after = await client.query(`select id, student_id, workout_id, weekdays, start_date, end_date, display_order, is_active from public.student_workouts where id = $1`, [swId]);
            return { ok: true, row: after.rows[0] };
        });
        if (!out.ok) {
            if (out.error === "only_personal" || out.error === "student_not_linked")
                return res.status(403).json({ error: out.error });
            return res.status(404).json({ error: "student_workout_not_found" });
        }
        const r = out.row;
        return res.json({
            id: r.id,
            student_id: r.student_id,
            workout_id: r.workout_id,
            weekdays: r.weekdays,
            start_date: r.start_date,
            end_date: r.end_date,
            display_order: r.display_order,
            is_active: r.is_active,
        });
    }
    catch (e) {
        const msg = String(e?.message ?? "");
        if (msg.includes("student_workouts_weekdays") || msg.includes("violates check constraint")) {
            return res.status(400).json({ error: "invalid_weekdays" });
        }
        return res.status(500).json({ error: "internal_error" });
    }
});
// [ACTUS-NEW] Helpers de data (cópia dos de meStudentProgram.ts — paridade de resposta).
function toIso(v) {
    const d = v instanceof Date ? v : new Date(v);
    return d.toISOString();
}
function formatDateOnly(v) {
    if (v == null)
        return null;
    if (v instanceof Date)
        return v.toISOString().slice(0, 10);
    if (typeof v === "string")
        return v.slice(0, 10);
    const d = new Date(v);
    return Number.isFinite(d.getTime()) ? d.toISOString().slice(0, 10) : null;
}
export default router;
