import { authedUserId } from "./requireAuth.js";
import { withTx } from "../db.js";
/**
 * Após `requireAuth`: exige membro ativo com `role='manager'`.
 * Resolve o `academy_id` por `req.params.academy_id` (se houver) ou pela academia ativa do gestor,
 * e injeta `req.academyId`. A autorização é na camada Node (RLS off — ver docs/SECURITY-RLS.md).
 */
export async function requireAcademyManager(req, res, next) {
    const userId = authedUserId(req);
    const paramAcademyId = req.params.academy_id ?? null;
    try {
        const academyId = await withTx(async (client) => {
            if (paramAcademyId) {
                const q = await client.query(`select academy_id from public.academy_members
           where user_id = $1 and academy_id = $2 and role = 'manager' and status = 'active'
           limit 1`, [userId, paramAcademyId]);
                return q.rows[0]?.academy_id ?? null;
            }
            const q = await client.query(`select academy_id from public.academy_members
         where user_id = $1 and role = 'manager' and status = 'active'
         order by created_at asc
         limit 1`, [userId]);
            return q.rows[0]?.academy_id ?? null;
        });
        if (!academyId) {
            return res.status(403).json({ error: "forbidden_not_academy_manager" });
        }
        req.academyId = academyId;
        return next();
    }
    catch {
        return res.status(500).json({ error: "internal_error" });
    }
}
/** Lê o `academy_id` resolvido em rotas com `mergeParams` onde o `Request` tipado não o inclui. */
export function scopedAcademyId(req) {
    return req.academyId;
}
