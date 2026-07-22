import { Router } from "express";
import { z } from "zod";
import { authedUserId } from "../middleware/requireAuth.js";
import { withTx } from "../db.js";
import { sendInternalError } from "../schemaCompat.js";

const router = Router();

// Aceita `fcm_token` (app RN bare, token FCM cru) OU `expo_push_token` (apps
// antigos instalados, transição). O token vai para a MESMA coluna
// expo_push_token — o pushService decide o provedor pelo formato do token
// (ExponentPushToken[...] → Expo; resto → FCM).
const RegisterBody = z
  .object({
    expo_push_token: z.string().min(1).optional(),
    fcm_token: z.string().min(1).optional(),
    platform: z.enum(["ios", "android"]),
  })
  .refine((b) => !!(b.expo_push_token ?? b.fcm_token), { message: "token_required" })
  .transform((b) => ({
    expo_push_token: (b.expo_push_token ?? b.fcm_token) as string,
    platform: b.platform,
  }));

router.post("/device-tokens", async (req, res) => {
  const userId = authedUserId(req);
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "invalid_body" });
  try {
    await withTx(async (client) => {
      // Upsert manual (compatível com pg-mem): tenta atualizar; se não houver linha, insere.
      const updated = await client.query(
        `update public.device_tokens
            set user_id = $1, platform = $3, last_seen_at = now()
          where expo_push_token = $2`,
        [userId, parsed.data.expo_push_token, parsed.data.platform],
      );
      if (updated.rowCount === 0) {
        await client.query(
          `insert into public.device_tokens (user_id, expo_push_token, platform, last_seen_at)
           values ($1, $2, $3, now())`,
          [userId, parsed.data.expo_push_token, parsed.data.platform],
        );
      }
    });
    return res.json({ ok: true });
  } catch (e) {
    return sendInternalError(res, e);
  }
});

router.delete("/device-tokens/:token", async (req, res) => {
  const userId = authedUserId(req);
  try {
    await withTx(async (client) => {
      await client.query(
        `delete from public.device_tokens where user_id = $1 and expo_push_token = $2`,
        [userId, req.params.token],
      );
    });
    return res.json({ ok: true });
  } catch (e) {
    return sendInternalError(res, e);
  }
});

export default router;
