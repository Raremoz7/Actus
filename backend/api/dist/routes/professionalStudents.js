import { Router } from "express";
import { withTx } from "../db.js";
const router = Router();
router.get("/", async (req, res) => {
    const professionalId = req.userId;
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
          spl.linked_at
        from public.student_professional_links spl
        join public.profiles sp on sp.id = spl.student_id
        join public.app_users au on au.id = spl.student_id
        left join public.user_basic_info ubi on ubi.user_id = spl.student_id
        where spl.professional_id = $1
          and spl.status = 'active'
        order by spl.linked_at desc
        limit 500
        `, [professionalId]);
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
            return { ok: true, students };
        });
        if (!out.ok)
            return res.status(403).json({ error: out.error });
        return res.json({ students: out.students });
    }
    catch {
        return res.status(500).json({ error: "internal_error" });
    }
});
export default router;
