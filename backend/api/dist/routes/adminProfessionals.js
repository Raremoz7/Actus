import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { withTx } from "../db.js";
import { sha256, uuid } from "../crypto.js";
const router = Router();
const baseProfessionalSchema = z.object({
    email: z.string().email().max(320),
    password: z.string().min(8).max(200),
    full_name: z.string().min(3).max(200),
    cpf: z.string().min(11).max(32).optional(),
    birth_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    phone: z.string().min(6).max(40).optional(),
    gender: z.enum(["masculino", "feminino", "nao_informar", "outro"]).optional(),
    lgpd_consent: z.literal(true).optional().default(true),
    policy_version: z.string().min(1).max(100).optional().default("v1"),
    must_change_password: z.boolean().optional().default(true),
});
const createProfessionalSchema = z.discriminatedUnion("professional_role", [
    baseProfessionalSchema
        .extend({
        professional_role: z.literal("personal"),
        cref_number: z.string().min(3).max(50).nullish(),
        cref_expires_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullish(),
    })
        .refine((d) => !(d.cref_expires_at && !d.cref_number), {
        message: "cref_expires_requires_cref_number",
        path: ["cref_expires_at"],
    }),
    baseProfessionalSchema
        .extend({
        professional_role: z.literal("nutricionista"),
        crn_number: z.string().min(3).max(50).nullish(),
        crn_expires_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullish(),
    })
        .refine((d) => !(d.crn_expires_at && !d.crn_number), {
        message: "crn_expires_requires_crn_number",
        path: ["crn_expires_at"],
    }),
]);
function normalizeCpf(input) {
    return input.replace(/\D/g, "");
}
const patchProfessionalSchema = z
    .object({
    display_name: z.string().min(1).max(200).optional(),
    email: z.string().email().max(320).optional(),
    must_change_password: z.boolean().optional(),
    full_name: z.string().min(3).max(200).optional(),
    phone: z.string().min(6).max(40).optional().nullable(),
    gender: z.enum(["masculino", "feminino", "nao_informar", "outro"]).optional(),
    birth_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    cpf: z.string().min(11).max(32).optional().nullable(),
    cref_number: z.string().min(3).max(50).optional().nullable(),
    cref_expires_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
    crn_number: z.string().min(3).max(50).optional().nullable(),
    crn_expires_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
})
    .refine((o) => Object.keys(o).length > 0, { message: "empty_patch" });
router.post("/", async (req, res) => {
    const actorId = req.userId;
    const parsed = createProfessionalSchema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: "invalid_body", details: parsed.error.flatten() });
    const { email, password, full_name, professional_role, cpf, birth_date, phone, gender, policy_version, must_change_password } = parsed.data;
    const professional = professional_role === "personal"
        ? {
            cref_number: parsed.data.cref_number ?? null,
            cref_expires_at: parsed.data.cref_expires_at ?? null,
            crn_number: null,
            crn_expires_at: null,
        }
        : {
            crn_number: parsed.data.crn_number ?? null,
            crn_expires_at: parsed.data.crn_expires_at ?? null,
            cref_number: null,
            cref_expires_at: null,
        };
    const password_hash = await bcrypt.hash(password, 12);
    try {
        const created = await withTx(async (client) => {
            const userId = uuid();
            await client.query(`
        insert into public.app_users (id, email, password_hash, must_change_password)
        values ($1, $2, $3, $4)
        `, [userId, email, password_hash, must_change_password]);
            await client.query(`
        insert into public.profiles (id, display_name, tipo)
        values ($1, $2, $3::public.user_role)
        `, [userId, full_name, professional_role]);
            const cpfNorm = cpf ? normalizeCpf(cpf) : null;
            const cpfHash = cpfNorm ? sha256(cpfNorm) : null;
            const cpfLast4 = cpfNorm ? cpfNorm.slice(-4) : null;
            await client.query(`
        insert into public.user_basic_info
          (user_id, full_name, cpf_normalized, cpf_hash, cpf_last4, birth_date, phone, gender)
        values
          ($1, $2, $3, $4, $5, $6::date, $7, $8::public.user_gender)
        `, [userId, full_name, cpfNorm, cpfHash, cpfLast4, birth_date, phone ?? null, gender ?? "nao_informar"]);
            await client.query(`
        insert into public.user_lgpd_consents (id, user_id, policy_version, source)
        values ($1, $2, $3, 'admin')
        `, [uuid(), userId, policy_version]);
            await client.query(`
        insert into public.professional_info (user_id, cref_number, cref_expires_at, crn_number, crn_expires_at)
        values ($1, $2, $3::date, $4, $5::date)
        on conflict (user_id) do update set
          cref_number = excluded.cref_number,
          cref_expires_at = excluded.cref_expires_at,
          crn_number = excluded.crn_number,
          crn_expires_at = excluded.crn_expires_at,
          updated_at = now()
        `, [
                userId,
                professional.cref_number,
                professional.cref_expires_at,
                professional.crn_number,
                professional.crn_expires_at,
            ]);
            return { userId };
        });
        return res.status(201).json({ id: created.userId, email, professional_role, created_by: actorId });
    }
    catch (e) {
        const msg = String(e?.message ?? "");
        if (msg.includes("app_users_email_key")) {
            return res.status(409).json({ error: "email_already_in_use" });
        }
        if (msg.includes("user_basic_info_cpf_hash_key")) {
            return res.status(409).json({ error: "cpf_already_in_use" });
        }
        if (msg.includes("duplicate key")) {
            return res.status(409).json({
                error: "conflict",
                ...(process.env.NODE_ENV === "test" ? { detail: msg } : {}),
            });
        }
        return res.status(500).json({ error: "internal_error" });
    }
});
router.patch("/:user_id", async (req, res) => {
    const targetId = req.params.user_id;
    if (!z.string().uuid().safeParse(targetId).success)
        return res.status(400).json({ error: "invalid_params" });
    const parsed = patchProfessionalSchema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: "invalid_body", details: parsed.error.flatten() });
    const b = parsed.data;
    try {
        const out = await withTx(async (client) => {
            const prof = await client.query(`select tipo::text as tipo from public.profiles where id = $1 for update`, [targetId]);
            const tipo = prof.rows[0]?.tipo ?? null;
            if (!tipo || (tipo !== "personal" && tipo !== "nutricionista")) {
                return { ok: false, error: "target_not_professional" };
            }
            if (tipo === "personal" && (b.crn_number !== undefined || b.crn_expires_at !== undefined)) {
                return { ok: false, error: "invalid_professional_fields" };
            }
            if (tipo === "nutricionista" && (b.cref_number !== undefined || b.cref_expires_at !== undefined)) {
                return { ok: false, error: "invalid_professional_fields" };
            }
            if (b.email !== undefined) {
                await client.query(`update public.app_users set email = $1 where id = $2`, [b.email, targetId]);
            }
            if (b.must_change_password !== undefined) {
                await client.query(`update public.app_users set must_change_password = $1 where id = $2`, [b.must_change_password, targetId]);
            }
            if (b.display_name !== undefined) {
                await client.query(`update public.profiles set display_name = $1, updated_at = now() where id = $2`, [b.display_name, targetId]);
            }
            const ubiFields = [];
            const ubiVals = [];
            let i = 1;
            if (b.full_name !== undefined) {
                ubiFields.push(`full_name = $${i++}`);
                ubiVals.push(b.full_name);
            }
            if (b.phone !== undefined) {
                ubiFields.push(`phone = $${i++}`);
                ubiVals.push(b.phone);
            }
            if (b.gender !== undefined) {
                ubiFields.push(`gender = $${i++}::public.user_gender`);
                ubiVals.push(b.gender);
            }
            if (b.birth_date !== undefined) {
                ubiFields.push(`birth_date = $${i++}::date`);
                ubiVals.push(b.birth_date);
            }
            if (b.cpf !== undefined) {
                const cpfNorm = b.cpf ? normalizeCpf(b.cpf) : null;
                const cpfHash = cpfNorm ? sha256(cpfNorm) : null;
                const cpfLast4 = cpfNorm ? cpfNorm.slice(-4) : null;
                ubiFields.push(`cpf_normalized = $${i++}`, `cpf_hash = $${i++}`, `cpf_last4 = $${i++}`);
                ubiVals.push(cpfNorm, cpfHash, cpfLast4);
            }
            if (ubiFields.length) {
                ubiVals.push(targetId);
                const info = await client.query(`select 1 from public.user_basic_info where user_id = $1`, [targetId]);
                if (!info.rowCount)
                    return { ok: false, error: "user_basic_info_missing" };
                await client.query(`update public.user_basic_info set ${ubiFields.join(", ")} where user_id = $${i}`, ubiVals);
            }
            const piSets = [];
            const piVals = [];
            let j = 1;
            if (b.cref_number !== undefined) {
                piSets.push(`cref_number = $${j++}`);
                piVals.push(b.cref_number);
            }
            if (b.cref_expires_at !== undefined) {
                piSets.push(`cref_expires_at = $${j++}::date`);
                piVals.push(b.cref_expires_at);
            }
            if (b.crn_number !== undefined) {
                piSets.push(`crn_number = $${j++}`);
                piVals.push(b.crn_number);
            }
            if (b.crn_expires_at !== undefined) {
                piSets.push(`crn_expires_at = $${j++}::date`);
                piVals.push(b.crn_expires_at);
            }
            if (piSets.length) {
                await client.query(`insert into public.professional_info (user_id) values ($1) on conflict (user_id) do nothing`, [targetId]);
                piVals.push(targetId);
                await client.query(`update public.professional_info set ${piSets.join(", ")}, updated_at = now() where user_id = $${j}`, piVals);
            }
            const emailRow = await client.query(`select email from public.app_users where id = $1`, [targetId]);
            const tipoRow = await client.query(`select tipo::text as tipo from public.profiles where id = $1`, [targetId]);
            return { ok: true, id: targetId, email: emailRow.rows[0].email, tipo: tipoRow.rows[0].tipo };
        });
        if (!out.ok) {
            if (out.error === "target_not_professional")
                return res.status(404).json({ error: "professional_not_found" });
            if (out.error === "invalid_professional_fields")
                return res.status(400).json({ error: out.error });
            if (out.error === "user_basic_info_missing")
                return res.status(400).json({ error: out.error });
            return res.status(500).json({ error: "internal_error" });
        }
        return res.json(out);
    }
    catch (e) {
        const msg = String(e?.message ?? "");
        if (msg.includes("app_users_email_key")) {
            return res.status(409).json({ error: "email_already_in_use" });
        }
        if (msg.includes("user_basic_info_cpf_hash_key")) {
            return res.status(409).json({ error: "cpf_already_in_use" });
        }
        if (msg.includes("duplicate key")) {
            return res.status(409).json({
                error: "conflict",
                ...(process.env.NODE_ENV === "test" ? { detail: msg } : {}),
            });
        }
        return res.status(500).json({ error: "internal_error" });
    }
});
export default router;
