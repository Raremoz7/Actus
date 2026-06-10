import { authedUserId } from "./requireAuth.js";
import { withTx } from "../db.js";
/** Após `requireAuth`: só `profiles.tipo = aluno`. */
export async function requireStudent(req, res, next) {
    const userId = authedUserId(req);
    try {
        const row = await withTx(async (client) => {
            const q = await client.query(`select tipo from public.profiles where id = $1`, [userId]);
            const tipo = q.rows[0]?.tipo ?? null;
            return tipo;
        });
        if (row !== "aluno") {
            return res.status(403).json({ error: "forbidden_not_student" });
        }
        return next();
    }
    catch {
        return res.status(500).json({ error: "internal_error" });
    }
}
