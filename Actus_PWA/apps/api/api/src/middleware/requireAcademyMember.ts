import type { Request, Response, NextFunction } from "express";
import { authedUserId } from "./requireAuth.js";
import { withTx } from "../db.js";

/** Request de membro de academia (gestor ou instrutor), com escopo resolvido. */
export type AcademyMemberRequest = Request & {
  userId: string;
  academyId: string;
  academyRole: "manager" | "instructor";
};

/**
 * Após `requireAuth`: exige membro ativo com `role in ('manager','instructor')`.
 * Útil para instrutor ler contexto da academia. Injeta `req.academyId` e `req.academyRole`.
 */
export async function requireAcademyMember(req: Request, res: Response, next: NextFunction) {
  const userId = authedUserId(req);
  const paramAcademyId = (req.params as Record<string, string | undefined>).academy_id ?? null;
  try {
    const row = await withTx(async (client) => {
      if (paramAcademyId) {
        const q = await client.query<{ academy_id: string; role: string }>(
          `select academy_id, role from public.academy_members
           where user_id = $1 and academy_id = $2 and role in ('manager', 'instructor') and status = 'active'
           limit 1`,
          [userId, paramAcademyId],
        );
        return q.rows[0] ?? null;
      }
      const q = await client.query<{ academy_id: string; role: string }>(
        `select academy_id, role from public.academy_members
         where user_id = $1 and role in ('manager', 'instructor') and status = 'active'
         order by created_at asc
         limit 1`,
        [userId],
      );
      return q.rows[0] ?? null;
    });
    if (!row) {
      return res.status(403).json({ error: "forbidden_not_academy_member" });
    }
    (req as AcademyMemberRequest).academyId = row.academy_id;
    (req as AcademyMemberRequest).academyRole = row.role as "manager" | "instructor";
    return next();
  } catch {
    return res.status(500).json({ error: "internal_error" });
  }
}
