import { Router } from "express";
import { z } from "zod";
import { withTx } from "../db.js";
import { randomToken, uuid } from "../crypto.js";
import { authedUserId } from "../middleware/requireAuth.js";
const router = Router();
router.get("/", async (req, res) => {
    const userId = authedUserId(req);
    try {
        const out = await withTx(async (client) => {
            const prof = await client.query(`select tipo from public.profiles where id = $1`, [userId]);
            const tipo = prof.rows[0]?.tipo ?? null;
            if (tipo !== "personal" && tipo !== "nutricionista") {
                return { ok: false, reason: "not_professional" };
            }
            const q = await client.query(`
        select id, code, expires_at, max_uses, used_count, created_at
        from public.invites
        where professional_id = $1
        order by created_at desc
        limit 200
        `, [userId]);
            const invites = q.rows.map((r) => {
                const exp = r.expires_at instanceof Date ? r.expires_at : new Date(r.expires_at);
                const createdAt = r.created_at instanceof Date ? r.created_at : new Date(r.created_at);
                return {
                    id: r.id,
                    code: r.code,
                    expires_at: exp.toISOString(),
                    max_uses: r.max_uses,
                    used_count: r.used_count,
                    created_at: createdAt.toISOString(),
                    active: exp.getTime() > Date.now() && r.used_count < r.max_uses,
                };
            });
            return { ok: true, invites };
        });
        if (!out.ok)
            return res.status(403).json({ error: out.reason });
        return res.json({ invites: out.invites });
    }
    catch {
        return res.status(500).json({ error: "internal_error" });
    }
});
const createInviteSchema = z.object({
    expires_at: z.string().datetime(),
    max_uses: z.number().int().min(1).max(1000).default(1),
});
router.post("/", async (req, res) => {
    const userId = authedUserId(req);
    const parsed = createInviteSchema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: "invalid_body", details: parsed.error.flatten() });
    const { expires_at, max_uses } = parsed.data;
    try {
        const created = await withTx(async (client) => {
            const prof = await client.query(`select tipo from public.profiles where id = $1`, [userId]);
            const tipo = prof.rows[0]?.tipo ?? null;
            if (tipo !== "personal" && tipo !== "nutricionista") {
                return { ok: false, reason: "not_professional" };
            }
            const defaultMax = Number(process.env.DEFAULT_MAX_ACTIVE_INVITES ?? 20);
            const limitQ = await client.query(`select max_active_invites from public.professional_invite_limits where professional_id = $1`, [userId]);
            const maxActive = limitQ.rows[0]?.max_active_invites ?? defaultMax;
            if (!Number.isFinite(maxActive) || maxActive < 0) {
                return { ok: false, reason: "invalid_invite_limit_config" };
            }
            const activeCountQ = await client.query(`
        select count(*)::text as c
        from public.invites i
        where i.professional_id = $1
          and i.expires_at > now()
          and i.used_count < i.max_uses
        `, [userId]);
            const activeCount = Number(activeCountQ.rows[0]?.c ?? "0");
            if (activeCount >= maxActive) {
                return { ok: false, reason: "invite_limit_reached", max_active_invites: maxActive };
            }
            const code = randomToken(9); // ~12 chars base64url (curto e copiável)
            const inviteId = uuid();
            const q = await client.query(`
        insert into public.invites (id, professional_id, code, expires_at, max_uses, used_count)
        values ($1, $2, $3, $4, $5, 0)
        returning id, code
        `, [inviteId, userId, code, expires_at, max_uses]);
            return { ok: true, invite: q.rows[0] };
        });
        if (!created.ok)
            return res.status(403).json({ error: created.reason, max_active_invites: created.max_active_invites });
        return res.status(201).json(created.invite);
    }
    catch {
        return res.status(500).json({ error: "internal_error" });
    }
});
const patchInviteSchema = z
    .object({
    expires_at: z.string().datetime().optional(),
    max_uses: z.number().int().min(1).max(1000).optional(),
})
    .refine((o) => o.expires_at !== undefined || o.max_uses !== undefined, { message: "empty_patch" });
router.patch("/:invite_id", async (req, res) => {
    const userId = authedUserId(req);
    const inviteId = req.params.invite_id;
    if (!z.string().uuid().safeParse(inviteId).success)
        return res.status(400).json({ error: "invalid_params" });
    const parsed = patchInviteSchema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: "invalid_body", details: parsed.error.flatten() });
    const { expires_at, max_uses } = parsed.data;
    try {
        const out = await withTx(async (client) => {
            const prof = await client.query(`select tipo from public.profiles where id = $1`, [userId]);
            const tipo = prof.rows[0]?.tipo ?? null;
            if (tipo !== "personal" && tipo !== "nutricionista") {
                return { ok: false, reason: "not_professional" };
            }
            const invQ = await client.query(`select id, used_count, max_uses, expires_at from public.invites where id = $1 and professional_id = $2 for update`, [inviteId, userId]);
            const inv = invQ.rows[0];
            if (!inv)
                return { ok: false, error: "invite_not_found" };
            const nextMax = max_uses ?? inv.max_uses;
            if (inv.used_count > nextMax) {
                return { ok: false, error: "max_uses_below_used_count" };
            }
            const sets = [];
            const vals = [];
            let i = 1;
            if (expires_at !== undefined) {
                sets.push(`expires_at = $${i++}`);
                vals.push(expires_at);
            }
            if (max_uses !== undefined) {
                sets.push(`max_uses = $${i++}`);
                vals.push(max_uses);
            }
            vals.push(inviteId);
            await client.query(`update public.invites set ${sets.join(", ")} where id = $${i}`, vals);
            const after = await client.query(`select id, code, expires_at, max_uses, used_count, created_at from public.invites where id = $1`, [inviteId]);
            const r = after.rows[0];
            const exp = r.expires_at instanceof Date ? r.expires_at : new Date(r.expires_at);
            const createdAt = r.created_at instanceof Date ? r.created_at : new Date(r.created_at);
            return {
                ok: true,
                invite: {
                    id: r.id,
                    code: r.code,
                    expires_at: exp.toISOString(),
                    max_uses: r.max_uses,
                    used_count: r.used_count,
                    created_at: createdAt.toISOString(),
                    active: exp.getTime() > Date.now() && r.used_count < r.max_uses,
                },
            };
        });
        if (!out.ok) {
            if ("reason" in out && out.reason === "not_professional")
                return res.status(403).json({ error: out.reason });
            if ("error" in out && out.error === "max_uses_below_used_count")
                return res.status(400).json({ error: out.error });
            return res.status(404).json({ error: "invite_not_found" });
        }
        return res.json(out.invite);
    }
    catch {
        return res.status(500).json({ error: "internal_error" });
    }
});
const consumeSchema = z.object({
    code: z.string().min(3).max(200),
});
router.post("/consume", async (req, res) => {
    const userId = authedUserId(req);
    const parsed = consumeSchema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: "invalid_body", details: parsed.error.flatten() });
    const code = parsed.data.code;
    try {
        const out = await withTx(async (client) => {
            const meQ = await client.query(`select tipo from public.profiles where id = $1`, [userId]);
            const me = meQ.rows[0]?.tipo ?? null;
            if (me !== "aluno")
                return { ok: false, error: "only_student_can_consume" };
            const invQ = await client.query(`
        select id, professional_id, expires_at, max_uses, used_count
        from public.invites
        where code = $1
        for update
        `, [code]);
            const inv = invQ.rows[0];
            if (!inv)
                return { ok: false, error: "invalid_invite" };
            const exp = inv.expires_at instanceof Date ? inv.expires_at : new Date(inv.expires_at);
            if (exp.getTime() < Date.now())
                return { ok: false, error: "invite_expired" };
            if (inv.used_count >= inv.max_uses)
                return { ok: false, error: "invite_exhausted" };
            const profQ = await client.query(`select tipo from public.profiles where id = $1`, [inv.professional_id]);
            const prof = profQ.rows[0]?.tipo ?? null;
            if (prof !== "personal" && prof !== "nutricionista") {
                return { ok: false, error: "invalid_invite_professional" };
            }
            const role = prof;
            const already = await client.query(`
        select 1
        from public.student_professional_links l
        where l.student_id = $1
          and l.professional_id = $2
          and l.status = 'active'
        limit 1
        `, [userId, inv.professional_id]);
            if (already.rowCount && already.rowCount > 0) {
                return {
                    ok: true,
                    note: "already_linked",
                    professional_id: inv.professional_id,
                    professional_role: role,
                };
            }
            const otherActive = await client.query(`
        select 1
        from public.student_professional_links l
        where l.student_id = $1
          and l.professional_role = $2
          and l.status = 'active'
          and l.professional_id <> $3
        limit 1
        `, [userId, role, inv.professional_id]);
            if (otherActive.rowCount && otherActive.rowCount > 0) {
                return { ok: false, error: "already_has_active_professional_for_role" };
            }
            await client.query(`
        insert into public.student_professional_links (id, student_id, professional_id, professional_role, status)
        values ($1, $2, $3, $4, 'active')
        on conflict (student_id, professional_id) do update
        set status = 'active', professional_role = excluded.professional_role, linked_at = now()
        `, [uuid(), userId, inv.professional_id, role]);
            await client.query(`
        update public.invites
        set used_count = used_count + 1
        where id = $1
        `, [inv.id]);
            return { ok: true, professional_id: inv.professional_id, professional_role: role };
        });
        if (!out.ok)
            return res.status(400).json({ error: out.error });
        return res.json(out);
    }
    catch {
        return res.status(500).json({ error: "internal_error" });
    }
});
export default router;
