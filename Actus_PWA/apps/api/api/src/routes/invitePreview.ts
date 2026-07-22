// [ACTUS-NEW] A3 — preview PÚBLICO de convite (passo 1 do cadastro, ANTES de logar).
// GET /invites/:code/preview → 200 { ok:true, professional_display_name, avatar_url } se válido;
// erro no corpo (invalid_invite / invite_expired / invite_exhausted) caso contrário.
// Read-only, sem efeitos colaterais (não incrementa uso). Ver backend/CHANGES-FROM-PRODUCTION.md.
import { Router } from "express";
import { z } from "zod";
import { withTx } from "../db.js";

const router = Router({ mergeParams: true });

const paramsSchema = z.object({ code: z.string().min(3).max(200) });

router.get("/", async (req, res) => {
  const p = paramsSchema.safeParse(req.params);
  if (!p.success) return res.status(404).json({ error: "invalid_invite" });
  const code = p.data.code;

  try {
    const out = await withTx(async (client) => {
      const invQ = await client.query<{
        professional_id: string;
        expires_at: unknown;
        max_uses: number;
        used_count: number;
      }>(
        `select professional_id, expires_at, max_uses, used_count from public.invites where code = $1`,
        [code],
      );
      const inv = invQ.rows[0];
      if (!inv) return { ok: false as const, status: 404, error: "invalid_invite" as const };

      const exp = inv.expires_at instanceof Date ? inv.expires_at : new Date(String(inv.expires_at));
      if (exp.getTime() < Date.now()) return { ok: false as const, status: 410, error: "invite_expired" as const };
      if (inv.used_count >= inv.max_uses) return { ok: false as const, status: 410, error: "invite_exhausted" as const };

      const profQ = await client.query<{ display_name: string | null; avatar_url: string | null; tipo: string }>(
        `select display_name, avatar_url, tipo::text as tipo from public.profiles where id = $1`,
        [inv.professional_id],
      );
      const prof = profQ.rows[0];
      if (!prof || (prof.tipo !== "personal" && prof.tipo !== "nutricionista")) {
        return { ok: false as const, status: 404, error: "invalid_invite_professional" as const };
      }
      return {
        ok: true as const,
        professional_display_name: prof.display_name,
        avatar_url: prof.avatar_url,
      };
    });

    if (!out.ok) return res.status(out.status).json({ error: out.error });
    return res.json({
      ok: true,
      professional_display_name: out.professional_display_name,
      avatar_url: out.avatar_url,
    });
  } catch {
    return res.status(500).json({ error: "internal_error" });
  }
});

export default router;
