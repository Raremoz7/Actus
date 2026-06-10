import { Router } from "express";
import { z } from "zod";
import { withTx } from "../db.js";
import { authedUserId } from "../middleware/requireAuth.js";
import { uuid } from "../crypto.js";
const router = Router();
const createDietSchema = z.object({
    name: z.string().min(1).max(200),
    body: z.unknown().optional().default({}),
});
const patchDietSchema = z
    .object({
    name: z.string().min(1).max(200).optional(),
    body: z.unknown().optional(),
})
    .refine((o) => o.name !== undefined || o.body !== undefined, { message: "empty_patch" });
router.get("/", async (req, res) => {
    const nutritionistId = authedUserId(req);
    try {
        const out = await withTx(async (client) => {
            const meQ = await client.query(`select tipo::text as tipo from public.profiles where id = $1`, [nutritionistId]);
            if (meQ.rows[0]?.tipo !== "nutricionista")
                return { ok: false, error: "only_nutritionist" };
            const q = await client.query(`select id, name, created_at from public.diet_templates where owner_nutritionist_id = $1 order by created_at desc limit 500`, [nutritionistId]);
            const templates = q.rows.map((r) => ({
                id: r.id,
                name: r.name,
                created_at: (r.created_at instanceof Date ? r.created_at : new Date(r.created_at)).toISOString(),
            }));
            return { ok: true, templates };
        });
        if (!out.ok)
            return res.status(403).json({ error: out.error });
        return res.json({ diet_templates: out.templates });
    }
    catch {
        return res.status(500).json({ error: "internal_error" });
    }
});
router.get("/:diet_template_id", async (req, res) => {
    const nutritionistId = authedUserId(req);
    const id = req.params.diet_template_id;
    if (!z.string().uuid().safeParse(id).success)
        return res.status(400).json({ error: "invalid_params" });
    try {
        const out = await withTx(async (client) => {
            const meQ = await client.query(`select tipo::text as tipo from public.profiles where id = $1`, [nutritionistId]);
            if (meQ.rows[0]?.tipo !== "nutricionista")
                return { ok: false, error: "only_nutritionist" };
            const q = await client.query(`select id, name, body, created_at from public.diet_templates where id = $1 and owner_nutritionist_id = $2`, [id, nutritionistId]);
            const row = q.rows[0];
            if (!row)
                return { ok: false, error: "not_found" };
            return {
                ok: true,
                template: {
                    id: row.id,
                    name: row.name,
                    body: row.body,
                    created_at: (row.created_at instanceof Date ? row.created_at : new Date(row.created_at)).toISOString(),
                },
            };
        });
        if (!out.ok) {
            if (out.error === "only_nutritionist")
                return res.status(403).json({ error: out.error });
            return res.status(404).json({ error: "diet_template_not_found" });
        }
        return res.json(out.template);
    }
    catch {
        return res.status(500).json({ error: "internal_error" });
    }
});
router.post("/", async (req, res) => {
    const nutritionistId = authedUserId(req);
    const parsed = createDietSchema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: "invalid_body", details: parsed.error.flatten() });
    const { name, body } = parsed.data;
    try {
        const out = await withTx(async (client) => {
            const meQ = await client.query(`select tipo from public.profiles where id = $1`, [nutritionistId]);
            const tipo = meQ.rows[0]?.tipo ?? null;
            if (tipo !== "nutricionista")
                return { ok: false, error: "only_nutritionist" };
            const id = uuid();
            const q = await client.query(`
        insert into public.diet_templates (id, owner_nutritionist_id, name, body)
        values ($1, $2, $3, $4::jsonb)
        returning id
        `, [id, nutritionistId, name, JSON.stringify(body ?? {})]);
            return { ok: true, diet_template_id: q.rows[0]?.id ?? id };
        });
        if (!out.ok)
            return res.status(403).json({ error: out.error });
        return res.status(201).json(out);
    }
    catch {
        return res.status(500).json({ error: "internal_error" });
    }
});
router.patch("/:diet_template_id", async (req, res) => {
    const nutritionistId = authedUserId(req);
    const id = req.params.diet_template_id;
    if (!z.string().uuid().safeParse(id).success)
        return res.status(400).json({ error: "invalid_params" });
    const parsed = patchDietSchema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: "invalid_body", details: parsed.error.flatten() });
    const { name, body } = parsed.data;
    try {
        const out = await withTx(async (client) => {
            const meQ = await client.query(`select tipo::text as tipo from public.profiles where id = $1`, [nutritionistId]);
            if (meQ.rows[0]?.tipo !== "nutricionista")
                return { ok: false, error: "only_nutritionist" };
            const own = await client.query(`select 1 from public.diet_templates where id = $1 and owner_nutritionist_id = $2`, [id, nutritionistId]);
            if (!own.rowCount)
                return { ok: false, error: "not_found" };
            const sets = [];
            const vals = [];
            let i = 1;
            if (name !== undefined) {
                sets.push(`name = $${i++}`);
                vals.push(name);
            }
            if (body !== undefined) {
                sets.push(`body = $${i++}::jsonb`);
                vals.push(JSON.stringify(body));
            }
            vals.push(id);
            await client.query(`update public.diet_templates set ${sets.join(", ")}, updated_at = now() where id = $${i}`, vals);
            const q = await client.query(`select id, name, body, created_at from public.diet_templates where id = $1`, [id]);
            const row = q.rows[0];
            return {
                ok: true,
                template: {
                    id: row.id,
                    name: row.name,
                    body: row.body,
                    created_at: (row.created_at instanceof Date ? row.created_at : new Date(row.created_at)).toISOString(),
                },
            };
        });
        if (!out.ok) {
            if (out.error === "only_nutritionist")
                return res.status(403).json({ error: out.error });
            return res.status(404).json({ error: "diet_template_not_found" });
        }
        return res.json(out.template);
    }
    catch {
        return res.status(500).json({ error: "internal_error" });
    }
});
export default router;
