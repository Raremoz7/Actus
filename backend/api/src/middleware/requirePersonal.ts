import type { Request, Response, NextFunction } from "express";
import { authedUserId } from "./requireAuth.js";
import { withTx } from "../db.js";

/** Após `requireAuth`: só `profiles.tipo = personal` (desafios / vínculos como personal). */
export async function requirePersonal(req: Request, res: Response, next: NextFunction) {
  const userId = authedUserId(req);
  try {
    const tipo = await withTx(async (client) => {
      const q = await client.query<{ tipo: string }>(`select tipo from public.profiles where id = $1`, [userId]);
      return q.rows[0]?.tipo ?? null;
    });
    if (tipo !== "personal") {
      return res.status(403).json({ error: "forbidden_not_personal" });
    }
    return next();
  } catch {
    return res.status(500).json({ error: "internal_error" });
  }
}
