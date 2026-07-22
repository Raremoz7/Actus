import { Router } from "express";
import { z } from "zod";
import { withTx } from "../db.js";
import { uuid } from "../crypto.js";
import { authedUserId } from "../middleware/requireAuth.js";
import { scopedAcademyId } from "../middleware/requireAcademyManager.js";
import { buildCommissionReport, monthBounds, } from "../services/commission.js";
// [ACTUS — academia] Comissões do gestor (requireAuth + requireAcademyManager).
// Regra (como calcular) é separada da base de receita (quanto). A base é 'manual' na Fase 1;
// quando o financeiro real chegar, ele insere 'billing' na mesma tabela e o cálculo prefere billing.
// O cálculo vive em services/commission.ts (puro, testável em pg-mem).
const router = Router();
function todayUtc() {
    return new Date().toISOString().slice(0, 10);
}
function toDateOnly(v) {
    if (v instanceof Date)
        return v.toISOString().slice(0, 10);
    return String(v).slice(0, 10);
}
// ---------------------------------------------------------------------------
// Regras de comissão
// ---------------------------------------------------------------------------
router.get("/rules", async (req, res) => {
    const academyId = scopedAcademyId(req);
    try {
        const out = await withTx(async (client) => {
            const q = await client.query(`select id, instructor_user_id, rule_type::text as rule_type, percent, amount_cents, currency,
                effective_from, effective_to
         from public.academy_commission_rules
         where academy_id = $1 and active = true
         order by instructor_user_id asc`, [academyId]);
            return {
                rules: q.rows.map((r) => ({
                    id: r.id,
                    instructor_user_id: r.instructor_user_id,
                    rule_type: r.rule_type,
                    percent: r.percent == null ? null : Number(r.percent),
                    amount_cents: r.amount_cents == null ? null : Number(r.amount_cents),
                    currency: r.currency,
                    effective_from: toDateOnly(r.effective_from),
                    effective_to: r.effective_to == null ? null : toDateOnly(r.effective_to),
                })),
            };
        });
        return res.json(out);
    }
    catch {
        return res.status(500).json({ error: "internal_error" });
    }
});
const ruleSchema = z
    .object({
    instructor_user_id: z.string().uuid().nullable().optional(),
    rule_type: z.enum(["percent", "fixed_per_student", "fixed_monthly"]),
    percent: z.number().min(0).max(100).nullable().optional(),
    amount_cents: z.number().int().nonnegative().nullable().optional(),
    effective_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
})
    .refine((d) => (d.rule_type === "percent" ? d.percent != null : d.amount_cents != null), {
    message: "rule_value_required",
});
// POST /rules — define a regra de um instrutor (ou default da academia: instructor_user_id null).
// Append-only: desativa a regra anterior do mesmo escopo e insere a nova vigente.
router.post("/rules", async (req, res) => {
    const academyId = scopedAcademyId(req);
    const actorId = authedUserId(req);
    const parsed = ruleSchema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: "invalid_body", details: parsed.error.flatten() });
    const { rule_type, percent, amount_cents } = parsed.data;
    const instructorUserId = parsed.data.instructor_user_id ?? null;
    const effectiveFrom = parsed.data.effective_from ?? todayUtc();
    try {
        const out = await withTx(async (client) => {
            if (instructorUserId) {
                const ok = await client.query(`select 1 from public.academy_members
           where academy_id = $1 and user_id = $2 and role = 'instructor' and status = 'active'`, [academyId, instructorUserId]);
                if (!ok.rowCount)
                    return { ok: false };
                await client.query(`update public.academy_commission_rules set active = false, effective_to = $1::date, updated_at = now()
           where academy_id = $2 and active = true and instructor_user_id = $3`, [effectiveFrom, academyId, instructorUserId]);
            }
            else {
                await client.query(`update public.academy_commission_rules set active = false, effective_to = $1::date, updated_at = now()
           where academy_id = $2 and active = true and instructor_user_id is null`, [effectiveFrom, academyId]);
            }
            const id = uuid();
            await client.query(`insert into public.academy_commission_rules
           (id, academy_id, instructor_user_id, rule_type, percent, amount_cents, effective_from, active, created_by)
         values ($1, $2, $3, $4, $5, $6, $7::date, true, $8)`, [id, academyId, instructorUserId, rule_type, percent ?? null, amount_cents ?? null, effectiveFrom, actorId]);
            return { ok: true, id };
        });
        if (!out.ok)
            return res.status(404).json({ error: "instructor_not_found" });
        return res.status(201).json({ id: out.id, instructor_user_id: instructorUserId, rule_type });
    }
    catch {
        return res.status(500).json({ error: "internal_error" });
    }
});
// ---------------------------------------------------------------------------
// Base de receita manual
// ---------------------------------------------------------------------------
const periodSchema = z.string().regex(/^\d{4}-\d{2}$/);
router.get("/base", async (req, res) => {
    const academyId = scopedAcademyId(req);
    const period = periodSchema.safeParse(req.query.period);
    if (!period.success)
        return res.status(400).json({ error: "invalid_query" });
    const monthStart = `${period.data}-01`;
    try {
        const out = await withTx(async (client) => {
            const q = await client.query(`select e.id, e.instructor_user_id, ip.display_name as instructor_name,
                e.subject_type::text as subject_type, e.subject_id, e.amount_cents, e.source::text as source,
                e.note, e.created_at
         from public.academy_revenue_entries e
         join public.profiles ip on ip.id = e.instructor_user_id
         where e.academy_id = $1 and e.period_month = $2::date
         order by e.created_at desc`, [academyId, monthStart]);
            return {
                entries: q.rows.map((r) => ({
                    id: r.id,
                    instructor_user_id: r.instructor_user_id,
                    instructor_name: r.instructor_name,
                    subject_type: r.subject_type,
                    subject_id: r.subject_id,
                    amount_cents: Number(r.amount_cents),
                    source: r.source,
                    note: r.note,
                    created_at: r.created_at instanceof Date ? r.created_at.toISOString() : String(r.created_at),
                })),
            };
        });
        return res.json(out);
    }
    catch {
        return res.status(500).json({ error: "internal_error" });
    }
});
const entrySchema = z.object({
    instructor_user_id: z.string().uuid(),
    subject_type: z.enum(["student", "instructor", "academy"]).optional().default("student"),
    subject_id: z.string().uuid().nullable().optional(),
    period: periodSchema,
    amount_cents: z.number().int().nonnegative(),
    note: z.string().max(500).optional(),
});
// POST /base — lança valor manual (source='manual') que alimenta o cálculo de comissão.
router.post("/base", async (req, res) => {
    const academyId = scopedAcademyId(req);
    const actorId = authedUserId(req);
    const parsed = entrySchema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: "invalid_body", details: parsed.error.flatten() });
    const { instructor_user_id, subject_type, subject_id, period, amount_cents, note } = parsed.data;
    const monthStart = `${period}-01`;
    try {
        const out = await withTx(async (client) => {
            const ok = await client.query(`select 1 from public.academy_members
         where academy_id = $1 and user_id = $2 and role = 'instructor' and status = 'active'`, [academyId, instructor_user_id]);
            if (!ok.rowCount)
                return { ok: false };
            const id = uuid();
            await client.query(`insert into public.academy_revenue_entries
           (id, academy_id, instructor_user_id, subject_type, subject_id, period_month, amount_cents, source, note, created_by)
         values ($1, $2, $3, $4, $5, $6::date, $7, 'manual', $8, $9)`, [id, academyId, instructor_user_id, subject_type, subject_id ?? null, monthStart, amount_cents, note ?? null, actorId]);
            return { ok: true, id };
        });
        if (!out.ok)
            return res.status(404).json({ error: "instructor_not_found" });
        return res.status(201).json({ id: out.id });
    }
    catch {
        return res.status(500).json({ error: "internal_error" });
    }
});
router.delete("/base/:entry_id", async (req, res) => {
    const academyId = scopedAcademyId(req);
    const entryId = req.params.entry_id;
    if (!z.string().uuid().safeParse(entryId).success)
        return res.status(400).json({ error: "invalid_params" });
    try {
        const out = await withTx(async (client) => {
            const r = await client.query(`delete from public.academy_revenue_entries where id = $1 and academy_id = $2 and source = 'manual'`, [entryId, academyId]);
            return { changed: r.rowCount ?? 0 };
        });
        if (!out.changed)
            return res.status(404).json({ error: "entry_not_found" });
        return res.json({ id: entryId, deleted: true });
    }
    catch {
        return res.status(500).json({ error: "internal_error" });
    }
});
// ---------------------------------------------------------------------------
// Relatório (regra × base) e pagamento
// ---------------------------------------------------------------------------
router.get("/report", async (req, res) => {
    const academyId = scopedAcademyId(req);
    const period = periodSchema.safeParse(req.query.period);
    if (!period.success)
        return res.status(400).json({ error: "invalid_query" });
    const { start, end, monthStart } = monthBounds(period.data);
    try {
        const out = await withTx(async (client) => {
            const instructorsQ = await client.query(`select am.user_id, p.display_name
         from public.academy_members am
         join public.profiles p on p.id = am.user_id
         where am.academy_id = $1 and am.role = 'instructor' and am.status = 'active'`, [academyId]);
            const studentsQ = await client.query(`select student_id, instructor_user_id from public.academy_students where academy_id = $1`, [academyId]);
            const rulesQ = await client.query(`select instructor_user_id, rule_type::text as rule_type, percent, amount_cents, effective_from, effective_to, active
         from public.academy_commission_rules where academy_id = $1`, [academyId]);
            const entriesQ = await client.query(`select instructor_user_id, amount_cents, source::text as source
         from public.academy_revenue_entries where academy_id = $1 and period_month = $2::date`, [academyId, monthStart]);
            const payoutsQ = await client.query(`select instructor_user_id, status from public.academy_commission_payouts
         where academy_id = $1 and period_month = $2::date`, [academyId, monthStart]);
            const studentCount = new Map();
            for (const s of studentsQ.rows)
                studentCount.set(s.instructor_user_id, (studentCount.get(s.instructor_user_id) ?? 0) + 1);
            const instructors = instructorsQ.rows.map((r) => ({
                user_id: r.user_id,
                display_name: r.display_name,
                student_count: studentCount.get(r.user_id) ?? 0,
            }));
            const rules = rulesQ.rows.map((r) => ({
                instructor_user_id: r.instructor_user_id,
                rule_type: r.rule_type,
                percent: r.percent == null ? null : Number(r.percent),
                amount_cents: r.amount_cents == null ? null : Number(r.amount_cents),
                effective_from: toDateOnly(r.effective_from),
                effective_to: r.effective_to == null ? null : toDateOnly(r.effective_to),
                active: r.active,
            }));
            const entries = entriesQ.rows.map((r) => ({
                instructor_user_id: r.instructor_user_id,
                amount_cents: Number(r.amount_cents),
                source: r.source,
            }));
            const payouts = payoutsQ.rows.map((r) => ({
                instructor_user_id: r.instructor_user_id,
                status: r.status,
            }));
            const rows = buildCommissionReport({ instructors, rules, entries, payouts, periodStart: start, periodEnd: end });
            const totals = {
                base_cents: rows.reduce((s, r) => s + r.base_cents, 0),
                commission_cents: rows.reduce((s, r) => s + r.commission_cents, 0),
                due_cents: rows.filter((r) => r.status !== "paid").reduce((s, r) => s + r.commission_cents, 0),
            };
            return { period: period.data, rows, totals };
        });
        return res.json(out);
    }
    catch {
        return res.status(500).json({ error: "internal_error" });
    }
});
const payoutSchema = z.object({
    instructor_user_id: z.string().uuid(),
    period: periodSchema,
    status: z.enum(["pending", "paid"]).default("paid"),
    amount_cents: z.number().int().nonnegative().optional().default(0),
});
// POST /payouts — marca a comissão de um instrutor/competência como paga (ou pendente).
router.post("/payouts", async (req, res) => {
    const academyId = scopedAcademyId(req);
    const actorId = authedUserId(req);
    const parsed = payoutSchema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: "invalid_body", details: parsed.error.flatten() });
    const { instructor_user_id, period, status, amount_cents } = parsed.data;
    const monthStart = `${period}-01`;
    try {
        await withTx(async (client) => {
            await client.query(`insert into public.academy_commission_payouts
           (id, academy_id, instructor_user_id, period_month, status, amount_cents, paid_at, created_by)
         values ($1, $2, $3, $4::date, $5, $6, case when $5 = 'paid' then now() else null end, $7)
         on conflict (academy_id, instructor_user_id, period_month)
         do update set status = excluded.status, amount_cents = excluded.amount_cents,
                       paid_at = excluded.paid_at, updated_at = now()`, [uuid(), academyId, instructor_user_id, monthStart, status, amount_cents, actorId]);
        });
        return res.json({ instructor_user_id, period, status });
    }
    catch {
        return res.status(500).json({ error: "internal_error" });
    }
});
export default router;
