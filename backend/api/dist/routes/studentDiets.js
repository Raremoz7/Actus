import { Router } from "express";
import { z } from "zod";
import { withTx } from "../db.js";
import { authedUserId } from "../middleware/requireAuth.js";
import { uuid } from "../crypto.js";
const router = Router({ mergeParams: true });
const paramsSchema = z.object({
    student_id: z.string().uuid(),
});
const assignDietSchema = z.object({
    diet_template_id: z.string().uuid(),
    start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    is_active: z.boolean().optional(),
});
const patchAssignDietSchema = z
    .object({
    diet_template_id: z.string().uuid().optional(),
    start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
    is_active: z.boolean().optional(),
})
    .refine((o) => Object.keys(o).length > 0, { message: "empty_patch" });
router.post("/", async (req, res) => {
    const nutritionistId = authedUserId(req);
    const p = paramsSchema.safeParse(req.params);
    if (!p.success)
        return res.status(400).json({ error: "invalid_params", details: p.error.flatten() });
    const parsed = assignDietSchema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: "invalid_body", details: parsed.error.flatten() });
    const studentId = p.data.student_id;
    const { diet_template_id, start_date, is_active } = parsed.data;
    try {
        const out = await withTx(async (client) => {
            const meQ = await client.query(`select tipo from public.profiles where id = $1`, [nutritionistId]);
            const tipo = meQ.rows[0]?.tipo ?? null;
            if (tipo !== "nutricionista")
                return { ok: false, error: "only_nutritionist" };
            const linkQ = await client.query(`
        select 1
        from public.student_professional_links
        where student_id = $1
          and professional_id = $2
          and professional_role = 'nutricionista'
          and status = 'active'
        limit 1
        `, [studentId, nutritionistId]);
            if (!linkQ.rowCount)
                return { ok: false, error: "student_not_linked" };
            const tmplQ = await client.query(`
        select 1
        from public.diet_templates
        where id = $1
          and owner_nutritionist_id = $2
        limit 1
        `, [diet_template_id, nutritionistId]);
            if (!tmplQ.rowCount)
                return { ok: false, error: "diet_template_not_found" };
            const id = uuid();
            const ins = await client.query(`
        insert into public.student_diets (id, student_id, diet_template_id, start_date, is_active)
        values ($1, $2, $3, $4::date, $5)
        returning id
        `, [id, studentId, diet_template_id, start_date ?? null, is_active ?? true]);
            return { ok: true, student_diet_id: ins.rows[0]?.id ?? id };
        });
        if (!out.ok)
            return res.status(403).json({ error: out.error });
        return res.status(201).json(out);
    }
    catch {
        return res.status(500).json({ error: "internal_error" });
    }
});
router.patch("/:student_diet_id", async (req, res) => {
    const nutritionistId = authedUserId(req);
    const p = paramsSchema.safeParse(req.params);
    if (!p.success)
        return res.status(400).json({ error: "invalid_params", details: p.error.flatten() });
    const sdId = req.params.student_diet_id;
    if (!z.string().uuid().safeParse(sdId).success)
        return res.status(400).json({ error: "invalid_params" });
    const parsed = patchAssignDietSchema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: "invalid_body", details: parsed.error.flatten() });
    const studentId = p.data.student_id;
    try {
        const out = await withTx(async (client) => {
            const meQ = await client.query(`select tipo::text as tipo from public.profiles where id = $1`, [nutritionistId]);
            if (meQ.rows[0]?.tipo !== "nutricionista")
                return { ok: false, error: "only_nutritionist" };
            const linkQ = await client.query(`
        select 1 from public.student_professional_links
        where student_id = $1 and professional_id = $2 and professional_role = 'nutricionista' and status = 'active'
        limit 1
        `, [studentId, nutritionistId]);
            if (!linkQ.rowCount)
                return { ok: false, error: "student_not_linked" };
            const rowQ = await client.query(`
        select sd.id, sd.diet_template_id
        from public.student_diets sd
        join public.diet_templates dt on dt.id = sd.diet_template_id
        where sd.id = $1 and sd.student_id = $2 and dt.owner_nutritionist_id = $3
        `, [sdId, studentId, nutritionistId]);
            if (!rowQ.rows[0])
                return { ok: false, error: "not_found" };
            const { diet_template_id, start_date, is_active } = parsed.data;
            if (diet_template_id) {
                const tq = await client.query(`select 1 from public.diet_templates where id = $1 and owner_nutritionist_id = $2`, [diet_template_id, nutritionistId]);
                if (!tq.rowCount)
                    return { ok: false, error: "diet_template_not_found" };
            }
            const sets = [];
            const vals = [];
            let i = 1;
            if (diet_template_id !== undefined) {
                sets.push(`diet_template_id = $${i++}`);
                vals.push(diet_template_id);
            }
            if (start_date !== undefined) {
                sets.push(`start_date = $${i++}::date`);
                vals.push(start_date);
            }
            if (is_active !== undefined) {
                sets.push(`is_active = $${i++}`);
                vals.push(is_active);
            }
            vals.push(sdId);
            await client.query(`update public.student_diets set ${sets.join(", ")}, updated_at = now() where id = $${i}`, vals);
            const after = await client.query(`select id, student_id, diet_template_id, start_date, is_active from public.student_diets where id = $1`, [sdId]);
            return { ok: true, row: after.rows[0] };
        });
        if (!out.ok) {
            if (out.error === "only_nutritionist" || out.error === "student_not_linked")
                return res.status(403).json({ error: out.error });
            if (out.error === "diet_template_not_found")
                return res.status(403).json({ error: out.error });
            return res.status(404).json({ error: "student_diet_not_found" });
        }
        const r = out.row;
        return res.json({
            id: r.id,
            student_id: r.student_id,
            diet_template_id: r.diet_template_id,
            start_date: r.start_date,
            is_active: r.is_active,
        });
    }
    catch {
        return res.status(500).json({ error: "internal_error" });
    }
});
export default router;
