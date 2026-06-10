import { Router } from "express";
import { z } from "zod";
import { withTx } from "../db.js";

const router = Router();

const querySchema = z.object({
  professional_id: z.string().uuid().optional(),
  professional_role: z.enum(["personal", "nutricionista"]).optional(),
  status: z.enum(["active", "revoked"]).optional().default("active"),
});

router.get("/", async (req, res) => {
  const parsed = querySchema.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: "invalid_query", details: parsed.error.flatten() });

  const { professional_id, professional_role, status } = parsed.data;

  try {
    const out = await withTx(async (client) => {
      const params: any[] = [status];
      let where = `spl.status = $1::public.link_status`;

      if (professional_id) {
        params.push(professional_id);
        where += ` and spl.professional_id = $${params.length}`;
      }
      if (professional_role) {
        params.push(professional_role);
        where += ` and spl.professional_role = $${params.length}::public.professional_role`;
      }

      const q = await client.query<{
        link_id: string;
        student_id: string;
        professional_id: string;
        professional_role: "personal" | "nutricionista";
        status: "active" | "revoked";
        linked_at: any;
        student_email: string;
        student_display_name: string | null;
        student_full_name: string | null;
        student_birth_date: any;
        professional_email: string;
        professional_display_name: string | null;
        professional_tipo: string;
      }>(
        `
        select
          spl.id as link_id,
          spl.student_id,
          spl.professional_id,
          spl.professional_role,
          spl.status::text as status,
          spl.linked_at,
          sau.email as student_email,
          sp.display_name as student_display_name,
          subi.full_name as student_full_name,
          subi.birth_date as student_birth_date,
          pau.email as professional_email,
          pp.display_name as professional_display_name,
          pp.tipo::text as professional_tipo
        from public.student_professional_links spl
        join public.app_users sau on sau.id = spl.student_id
        join public.profiles sp on sp.id = spl.student_id
        left join public.user_basic_info subi on subi.user_id = spl.student_id
        join public.app_users pau on pau.id = spl.professional_id
        join public.profiles pp on pp.id = spl.professional_id
        where ${where}
        order by spl.linked_at desc
        limit 1000
        `,
        params,
      );

      const links = q.rows.map((r) => {
        const linkedAt = r.linked_at instanceof Date ? r.linked_at : new Date(r.linked_at);
        const birthDate = r.student_birth_date instanceof Date ? r.student_birth_date : new Date(r.student_birth_date);
        return {
          id: r.link_id,
          student: {
            id: r.student_id,
            email: r.student_email,
            full_name: r.student_full_name ?? r.student_display_name ?? null,
            birth_date: Number.isFinite(birthDate.getTime()) ? birthDate.toISOString().slice(0, 10) : null,
          },
          professional: {
            id: r.professional_id,
            email: r.professional_email,
            display_name: r.professional_display_name,
            tipo: r.professional_tipo,
          },
          professional_role: r.professional_role,
          status: r.status,
          linked_at: linkedAt.toISOString(),
        };
      });

      return { links };
    });

    return res.json(out);
  } catch {
    return res.status(500).json({ error: "internal_error" });
  }
});

const patchLinkSchema = z.object({
  status: z.enum(["active", "revoked"]),
});

router.patch("/:link_id", async (req, res) => {
  const linkId = req.params.link_id;
  if (!z.string().uuid().safeParse(linkId).success) return res.status(400).json({ error: "invalid_params" });

  const parsed = patchLinkSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "invalid_body", details: parsed.error.flatten() });

  const { status } = parsed.data;

  try {
    const out = await withTx(async (client) => {
      const cur = await client.query<{
        id: string;
        student_id: string;
        professional_role: "personal" | "nutricionista";
        status: string;
      }>(
        `select id, student_id, professional_role::text, status::text from public.student_professional_links where id = $1 for update`,
        [linkId],
      );
      const row = cur.rows[0];
      if (!row) return { ok: false as const, error: "not_found" as const };

      if (status === "active") {
        const clash = await client.query(
          `
          select 1 from public.student_professional_links
          where student_id = $1
            and professional_role = $2::public.professional_role
            and status = 'active'
            and id <> $3
          limit 1
          `,
          [row.student_id, row.professional_role, linkId],
        );
        if (clash.rowCount) return { ok: false as const, error: "conflict_active_role" as const };
      }

      await client.query(`update public.student_professional_links set status = $1::public.link_status where id = $2`, [
        status,
        linkId,
      ]);

      return { ok: true as const, link_id: linkId, status };
    });

    if (!out.ok) {
      if (out.error === "conflict_active_role") return res.status(409).json({ error: out.error });
      return res.status(404).json({ error: "link_not_found" });
    }
    return res.json(out);
  } catch (e: any) {
    const msg = String(e?.message ?? "");
    if (msg.includes("unique") || msg.includes("duplicate") || msg.includes("violates")) {
      return res.status(409).json({ error: "link_conflict" });
    }
    return res.status(500).json({ error: "internal_error" });
  }
});

export default router;

