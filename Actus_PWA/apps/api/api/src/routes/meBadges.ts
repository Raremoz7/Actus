import { Router } from "express";
import { z } from "zod";
import { authedUserId } from "../middleware/requireAuth.js";
import { withTx } from "../db.js";
import { sendInternalError } from "../schemaCompat.js";

const router = Router();

router.get("/badges", async (req, res) => {
  const studentId = authedUserId(req);
  try {
    const body = await withTx(async (client) => {
      const r = await client.query(
        `select b.id, b.name, b.description, b.asset_key, b.sort_order,
                (sb.id is not null) as earned, sb.earned_at
           from public.badges b
           left join public.student_badges sb
             on sb.badge_id = b.id and sb.student_id = $1
          where b.active = true
          order by b.sort_order`,
        [studentId],
      );
      return { badges: r.rows };
    });
    return res.json(body);
  } catch (e) {
    return sendInternalError(res, e);
  }
});

router.get("/badges/unseen", async (req, res) => {
  const studentId = authedUserId(req);
  try {
    const body = await withTx(async (client) => {
      const r = await client.query(
        `select b.id, b.name, b.description, b.asset_key, sb.earned_at
           from public.student_badges sb
           join public.badges b on b.id = sb.badge_id
          where sb.student_id = $1 and sb.seen_at is null
          order by sb.earned_at`,
        [studentId],
      );
      return { badges: r.rows };
    });
    return res.json(body);
  } catch (e) {
    return sendInternalError(res, e);
  }
});

const SeenBody = z.object({ badge_ids: z.array(z.string()).min(1) });

router.post("/badges/seen", async (req, res) => {
  const studentId = authedUserId(req);
  const parsed = SeenBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "invalid_body" });
  try {
    await withTx(async (client) => {
      const ids = parsed.data.badge_ids;
      const placeholders = ids.map((_, i) => `$${i + 2}`).join(", ");
      await client.query(
        `update public.student_badges set seen_at = now()
          where student_id = $1 and badge_id in (${placeholders}) and seen_at is null`,
        [studentId, ...ids],
      );
    });
    return res.json({ ok: true });
  } catch (e) {
    return sendInternalError(res, e);
  }
});

export default router;
