import { authedUserId } from "./requireAuth.js";
import { withTx } from "../db.js";
/**
 * Após `requireAuth`: exige membro ativo com `role in ('manager','instructor')`.
 * Útil para instrutor ler contexto da academia. Injeta `req.academyId` e `req.academyRole`.
 */
export async function requireAcademyMember(req, res, next) {
    const userId = authedUserId(req);
    const paramAcademyId = req.params.academy_id ?? null;
    try {
        const row = await withTx(async (client) => {
            if (paramAcademyId) {
                const q = await client.query(`select academy_id, role from public.academy_members
           where user_id = $1 and academy_id = $2 and role in ('manager', 'instructor') and status = 'active'
           limit 1`, [userId, paramAcademyId]);
                return q.rows[0] ?? null;
            }
            const q = await client.query(`select academy_id, role from public.academy_members
         where user_id = $1 and role in ('manager', 'instructor') and status = 'active'
         order by created_at asc
         limit 1`, [userId]);
            return q.rows[0] ?? null;
        });
        if (!row) {
            return res.status(403).json({ error: "forbidden_not_academy_member" });
        }
        req.academyId = row.academy_id;
        req.academyRole = row.role;
        return next();
    }
    catch {
        return res.status(500).json({ error: "internal_error" });
    }
}
