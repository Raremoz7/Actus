import { Router } from "express";
import { z } from "zod";
import { authedUserId } from "../middleware/requireAuth.js";
import { withTx } from "../db.js";

const router = Router();

const patchMeSchema = z
  .object({
    display_name: z.string().min(1).max(200).optional(),
    avatar_url: z.union([z.string().url().max(2000), z.literal("")]).optional(),
    timezone: z.string().min(1).max(64).optional(),
    full_name: z.string().min(3).max(200).optional(),
    phone: z.string().min(6).max(40).optional().nullable(),
    gender: z.enum(["masculino", "feminino", "nao_informar", "outro"]).optional(),
    body_weight_kg: z.number().min(20).max(400).optional().nullable(),
  })
  .refine((o) => Object.keys(o).length > 0, { message: "empty_patch" });

router.get("/", async (req, res) => {
  const userId = authedUserId(req);
  const me = await withTx(async (client) => {
    const q = await client.query<{ id: string; tipo: string; display_name: string | null }>(
      `select id, tipo::text, display_name from public.profiles where id = $1`,
      [userId],
    );
    return q.rows[0] ?? null;
  });
  if (!me) return res.status(404).json({ error: "profile_not_found" });
  return res.json(me);
});

router.patch("/", async (req, res) => {
  const userId = authedUserId(req);
  const parsed = patchMeSchema.safeParse(req.body);
  if (!parsed.success) {
    const flat = parsed.error.flatten();
    if (flat.fieldErrors && Object.keys(flat.fieldErrors).length === 0 && String(parsed.error.message).includes("empty")) {
      return res.status(400).json({ error: "invalid_body", details: { formErrors: ["Informe ao menos um campo"] } });
    }
    return res.status(400).json({ error: "invalid_body", details: flat });
  }

  const { display_name, avatar_url, timezone, full_name, phone, gender, body_weight_kg } = parsed.data;

  try {
    const me = await withTx(async (client) => {
      const profFields: string[] = [];
      const profVals: unknown[] = [];
      let i = 1;
      if (display_name !== undefined) {
        profFields.push(`display_name = $${i++}`);
        profVals.push(display_name);
      }
      if (avatar_url !== undefined) {
        profFields.push(`avatar_url = $${i++}`);
        profVals.push(avatar_url === "" ? null : avatar_url);
      }
      if (timezone !== undefined) {
        profFields.push(`timezone = $${i++}`);
        profVals.push(timezone);
      }
      if (profFields.length) {
        profVals.push(userId);
        await client.query(
          `update public.profiles set ${profFields.join(", ")}, updated_at = now() where id = $${i}`,
          profVals,
        );
      }

      if (full_name !== undefined || phone !== undefined || gender !== undefined || body_weight_kg !== undefined) {
        const infoQ = await client.query(`select 1 from public.user_basic_info where user_id = $1`, [userId]);
        if (!infoQ.rowCount) {
          return { ok: false as const, error: "user_basic_info_not_found" as const };
        }
        const uFields: string[] = [];
        const uVals: unknown[] = [];
        let j = 1;
        if (full_name !== undefined) {
          uFields.push(`full_name = $${j++}`);
          uVals.push(full_name);
        }
        if (phone !== undefined) {
          uFields.push(`phone = $${j++}`);
          uVals.push(phone);
        }
        if (gender !== undefined) {
          uFields.push(`gender = $${j++}::public.user_gender`);
          uVals.push(gender);
        }
        if (body_weight_kg !== undefined) {
          uFields.push(`body_weight_kg = $${j++}`);
          uVals.push(body_weight_kg);
        }
        uVals.push(userId);
        await client.query(
          `update public.user_basic_info set ${uFields.join(", ")} where user_id = $${j}`,
          uVals,
        );
      }

      const q = await client.query<{ id: string; tipo: string; display_name: string | null }>(
        `select id, tipo::text, display_name from public.profiles where id = $1`,
        [userId],
      );
      return { ok: true as const, row: q.rows[0] ?? null };
    });

    if (!me.ok) return res.status(400).json({ error: me.error });
    if (!me.row) return res.status(404).json({ error: "profile_not_found" });
    return res.json(me.row);
  } catch {
    return res.status(500).json({ error: "internal_error" });
  }
});

export default router;
