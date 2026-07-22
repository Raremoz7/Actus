import { Router } from "express";
import type { Request } from "express";
import { z } from "zod";
import { withTx } from "../db.js";
import { authedUserId } from "../middleware/requireAuth.js";
import { verifyAccessToken } from "../auth/jwt.js";

const router = Router();

function actorRoles(req: Request): string[] {
  const h = req.header("authorization");
  if (!h?.startsWith("Bearer ")) return [];
  try {
    return verifyAccessToken(h.slice("Bearer ".length).trim()).roles;
  } catch {
    return [];
  }
}

const patchStaffSchema = z
  .object({
    display_name: z.string().min(1).max(200).optional(),
    email: z.string().email().max(320).optional(),
    must_change_password: z.boolean().optional(),
    full_name: z.string().min(3).max(200).optional(),
    phone: z.string().min(6).max(40).optional().nullable(),
    gender: z.enum(["masculino", "feminino", "nao_informar", "outro"]).optional(),
    staff_roles: z.array(z.enum(["actus_admin", "actus_suporte"])).max(2).optional(),
  })
  .refine((o) => Object.keys(o).length > 0, { message: "empty_patch" });

router.get("/", async (req, res) => {
  const limit = Math.min(500, Math.max(1, Number(req.query.limit ?? 100) || 100));

  try {
    const rows = await withTx(async (client) => {
      const q = await client.query<{
        id: string;
        email: string;
        display_name: string | null;
        tipo: string;
      }>(
        `
        select distinct u.id, u.email, p.display_name, p.tipo::text as tipo
        from public.app_users u
        join public.profiles p on p.id = u.id
        join public.app_user_roles r on r.user_id = u.id
        order by u.email asc
        limit $1
        `,
        [limit],
      );
      const ids = q.rows.map((r) => r.id);
      const roleMap = new Map<string, string[]>();
      if (ids.length) {
        const ph = ids.map((_, idx) => `$${idx + 1}`).join(", ");
        const rq = await client.query<{ user_id: string; role: string }>(
          `select user_id, role from public.app_user_roles where user_id in (${ph}) order by role`,
          ids,
        );
        for (const row of rq.rows) {
          const cur = roleMap.get(row.user_id) ?? [];
          cur.push(row.role);
          roleMap.set(row.user_id, cur);
        }
      }
      return q.rows.map((r) => ({
        id: r.id,
        email: r.email,
        display_name: r.display_name,
        tipo: r.tipo,
        staff_roles: roleMap.get(r.id) ?? [],
      }));
    });
    return res.json({ staff: rows });
  } catch {
    return res.status(500).json({ error: "internal_error" });
  }
});

router.patch("/:user_id", async (req, res) => {
  const actorId = authedUserId(req);
  const targetId = req.params.user_id;
  if (!z.string().uuid().safeParse(targetId).success) return res.status(400).json({ error: "invalid_params" });

  const roles = actorRoles(req);
  const isAdmin = roles.includes("actus_admin");

  const parsed = patchStaffSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "invalid_body", details: parsed.error.flatten() });

  const b = parsed.data;

  if (!isAdmin && (b.email !== undefined || b.must_change_password !== undefined || b.staff_roles !== undefined)) {
    return res.status(403).json({ error: "forbidden" });
  }

  try {
    const out = await withTx(async (client) => {
      const staffQ = await client.query(`select 1 from public.app_user_roles where user_id = $1 limit 1`, [targetId]);
      if (!staffQ.rowCount) return { ok: false as const, error: "not_staff" as const };

      if (b.staff_roles !== undefined) {
        if (!isAdmin) return { ok: false as const, error: "forbidden_roles" as const };

        const next = new Set(b.staff_roles);
        const hadAdmin = await client.query(`select 1 from public.app_user_roles where user_id = $1 and role = 'actus_admin'`, [targetId]);
        const willHaveAdmin = next.has("actus_admin");

        if (hadAdmin.rowCount && !willHaveAdmin) {
          const others = await client.query<{ c: string }>(
            `select count(*)::text as c from public.app_user_roles where role = 'actus_admin' and user_id <> $1`,
            [targetId],
          );
          if (Number(others.rows[0]?.c ?? "0") < 1) {
            return { ok: false as const, error: "last_actus_admin" as const };
          }
        }

        await client.query(`delete from public.app_user_roles where user_id = $1`, [targetId]);
        for (const role of next) {
          await client.query(
            `insert into public.app_user_roles (user_id, role, created_by) values ($1, $2, $3)`,
            [targetId, role, actorId],
          );
        }

        const newTipo = next.has("actus_admin") ? "actus_admin" : next.has("actus_suporte") ? "actus_suporte" : null;
        if (!newTipo) return { ok: false as const, error: "staff_roles_empty" as const };
        await client.query(`update public.profiles set tipo = $1::public.user_role, updated_at = now() where id = $2`, [newTipo, targetId]);
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

      if (b.full_name !== undefined || b.phone !== undefined || b.gender !== undefined) {
        const ubi: string[] = [];
        const vals: unknown[] = [];
        let i = 1;
        if (b.full_name !== undefined) {
          ubi.push(`full_name = $${i++}`);
          vals.push(b.full_name);
        }
        if (b.phone !== undefined) {
          ubi.push(`phone = $${i++}`);
          vals.push(b.phone);
        }
        if (b.gender !== undefined) {
          ubi.push(`gender = $${i++}::public.user_gender`);
          vals.push(b.gender);
        }
        vals.push(targetId);
        const ex = await client.query(`select 1 from public.user_basic_info where user_id = $1`, [targetId]);
        if (!ex.rowCount) return { ok: false as const, error: "user_basic_info_missing" as const };
        await client.query(`update public.user_basic_info set ${ubi.join(", ")} where user_id = $${i}`, vals);
      }

      const emailRow = await client.query<{ email: string }>(`select email from public.app_users where id = $1`, [targetId]);
      const rolesRow = await client.query<{ role: string }>(`select role from public.app_user_roles where user_id = $1 order by role`, [targetId]);
      const tipoRow = await client.query<{ tipo: string }>(`select tipo::text as tipo from public.profiles where id = $1`, [targetId]);
      return {
        ok: true as const,
        id: targetId,
        email: emailRow.rows[0]!.email,
        tipo: tipoRow.rows[0]!.tipo,
        staff_roles: rolesRow.rows.map((r) => r.role),
      };
    });

    if (!out.ok) {
      if (out.error === "not_staff") return res.status(404).json({ error: "staff_user_not_found" });
      if (out.error === "forbidden_roles") return res.status(403).json({ error: "forbidden" });
      if (out.error === "last_actus_admin") return res.status(400).json({ error: out.error });
      if (out.error === "staff_roles_empty") return res.status(400).json({ error: out.error });
      if (out.error === "user_basic_info_missing") return res.status(400).json({ error: out.error });
      return res.status(500).json({ error: "internal_error" });
    }
    return res.json(out);
  } catch (e: any) {
    const msg = String(e?.message ?? "");
    if (msg.includes("app_users_email_key") || msg.includes("duplicate key")) {
      return res.status(409).json({ error: "email_already_in_use" });
    }
    return res.status(500).json({ error: "internal_error" });
  }
});

export default router;
