import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { withTx } from "../db.js";
import { randomToken, sha256, uuid } from "../crypto.js";
import { signAccessToken } from "../auth/jwt.js";
import { loadSessionClaims } from "../auth/sessionClaims.js";
import { requireAuth, type AuthedRequest } from "../middleware/requireAuth.js";

const router = Router();

function normalizeCpf(input: string): string {
  return input.replace(/\D/g, "");
}

// Emite uma sessão (access + refresh persistido) para um usuário recém-criado.
// Compartilhado por /register e /register-professional — fonte única do trio de tokens.
async function issueSession(
  userId: string,
): Promise<{ access_token: string; access_token_expires_in: number; refresh_token: string }> {
  const claimsBundle = await withTx(async (client) => loadSessionClaims(client, userId));
  const { token: access_token, expiresInSeconds } = signAccessToken({
    userId,
    roles: claimsBundle.roles,
    must_change_password: claimsBundle.must_change_password,
  });
  const refresh_token = randomToken(32);
  const refresh_hash = sha256(refresh_token);
  const refreshTtlDays = Number(process.env.REFRESH_TOKEN_TTL_DAYS ?? 30);
  const expiresAt = new Date(Date.now() + refreshTtlDays * 24 * 60 * 60 * 1000);
  await withTx(async (client) => {
    await client.query(
      `insert into public.refresh_tokens (id, user_id, token_hash, expires_at) values ($1, $2, $3, $4)`,
      [uuid(), userId, refresh_hash, expiresAt.toISOString()],
    );
  });
  return { access_token, access_token_expires_in: expiresInSeconds, refresh_token };
}

const registerSchema = z.object({
  invite_code: z.string().min(3).max(200),
  email: z.string().email().max(320),
  password: z.string().min(8).max(200),
  full_name: z.string().min(3).max(200),
  cpf: z.string().min(11).max(32).optional(),
  birth_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  phone: z.string().min(6).max(40).optional(),
  gender: z.enum(["masculino", "feminino", "nao_informar", "outro"]).optional(),
  // Para simplificar o cadastro, aceitamos ausência e assumimos consentimento.
  // Se o app enviar explicitamente false, rejeitamos.
  lgpd_consent: z.literal(true).optional().default(true),
  policy_version: z.string().min(1).max(100).optional().default("v1"),
});

router.post("/register", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "invalid_body", details: parsed.error.flatten() });

  const { invite_code, email, password, full_name, cpf, birth_date, phone, gender, policy_version } = parsed.data;
  const password_hash = await bcrypt.hash(password, 12);

  try {
    const created = await withTx(async (client) => {
      // Lock + valida convite
      const invQ = await client.query<{
        id: string;
        professional_id: string;
        expires_at: any;
        max_uses: number;
        used_count: number;
      }>(
        `
        select id, professional_id, expires_at, max_uses, used_count
        from public.invites
        where code = $1
        for update
        `,
        [invite_code],
      );
      const inv = invQ.rows[0];
      if (!inv) return { ok: false as const, error: "invalid_invite" as const };
      const exp = inv.expires_at instanceof Date ? inv.expires_at : new Date(inv.expires_at);
      if (exp.getTime() < Date.now()) return { ok: false as const, error: "invite_expired" as const };
      if (inv.used_count >= inv.max_uses) return { ok: false as const, error: "invite_exhausted" as const };

      // Valida emissor (define papel do vínculo)
      const profQ = await client.query<{ tipo: "personal" | "nutricionista" | "aluno" }>(
        `select tipo from public.profiles where id = $1`,
        [inv.professional_id],
      );
      const prof = profQ.rows[0]?.tipo ?? null;
      if (prof !== "personal" && prof !== "nutricionista") {
        return { ok: false as const, error: "invalid_invite_professional" as const };
      }

      const userId = uuid();
      const user = await client.query<{ id: string }>(
        `
        insert into public.app_users (id, email, password_hash)
        values ($1, $2, $3)
        returning id
        `,
        [userId, email, password_hash],
      );

      const insertedUserId = user.rows[0]?.id;
      if (!insertedUserId) throw new Error("failed_to_create_user");

      await client.query(
        `
        insert into public.profiles (id, display_name, tipo)
        values ($1, $2, 'aluno')
        `,
        [insertedUserId, full_name],
      );

      const cpfNorm = cpf ? normalizeCpf(cpf) : null;
      const cpfHash = cpfNorm ? sha256(cpfNorm) : null;
      const cpfLast4 = cpfNorm ? cpfNorm.slice(-4) : null;

      await client.query(
        `
        insert into public.user_basic_info
          (user_id, full_name, cpf_normalized, cpf_hash, cpf_last4, birth_date, phone, gender)
        values
          ($1, $2, $3, $4, $5, $6::date, $7, $8::public.user_gender)
        `,
        [insertedUserId, full_name, cpfNorm, cpfHash, cpfLast4, birth_date, phone ?? null, gender ?? "nao_informar"],
      );

      await client.query(
        `
        insert into public.user_lgpd_consents (id, user_id, policy_version, source)
        values ($1, $2, $3, 'api')
        `,
        [uuid(), insertedUserId, policy_version],
      );

      // Aplica vínculo aluno ↔ profissional (papel deduzido)
      const linkId = uuid();
      await client.query(
        `
        insert into public.student_professional_links (id, student_id, professional_id, professional_role, status)
        values ($1, $2, $3, $4, 'active')
        on conflict (student_id, professional_id) do update
        set status = 'active', professional_role = excluded.professional_role, linked_at = now()
        `,
        [linkId, insertedUserId, inv.professional_id, prof],
      );

      await client.query(
        `
        update public.invites
        set used_count = used_count + 1
        where id = $1
        `,
        [inv.id],
      );

      await client.query(
        `
        insert into public.invite_redemptions (invite_id, redeemed_user_id)
        values ($1, $2)
        on conflict do nothing
        `,
        [inv.id, insertedUserId],
      );

      return { ok: true as const, userId: insertedUserId };
    });

    if (!created.ok) return res.status(400).json({ error: created.error });

    return res.status(201).json(await issueSession(created.userId));
  } catch (e: any) {
    const msg = String(e?.message ?? "");
    if (msg.includes("app_users_email_key") || msg.includes("duplicate key")) {
      if (process.env.NODE_ENV === "test") {
        return res.status(409).json({ error: "email_already_in_use", detail: msg });
      }
      return res.status(409).json({ error: "email_already_in_use" });
    }
    if (msg.includes("user_basic_info_cpf_hash_key")) {
      if (process.env.NODE_ENV === "test") {
        return res.status(409).json({ error: "cpf_already_in_use", detail: msg });
      }
      return res.status(409).json({ error: "cpf_already_in_use" });
    }
    if (process.env.NODE_ENV === "test") {
      return res.status(500).json({ error: "internal_error", detail: msg });
    }
    return res.status(500).json({ error: "internal_error" });
  }
});

// [ACTUS — NOVO vs produção: auto-cadastro de profissional (card MVP "Fluxo cadastro
// personal"). Em produção, profissional só nasce via /admin/professionals (staff). Aqui o
// próprio se cadastra: conta ATIVA + tokens (espelha /register, sem convite). Cria tipo
// 'personal' — o contrato do app não envia role; CREF/CRN e nutri vêm no onboarding/futuro.
// Ver backend/CHANGES-FROM-PRODUCTION.md]
const registerProfessionalSchema = z.object({
  email: z.string().trim().email().max(320),
  password: z.string().min(8).max(200),
  full_name: z.string().trim().min(3).max(200),
  phone: z.string().trim().min(6).max(40),
  lgpd_consent: z.literal(true).optional().default(true),
  policy_version: z.string().min(1).max(100).optional().default("v1"),
});

router.post("/register-professional", async (req, res) => {
  const parsed = registerProfessionalSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "invalid_body", details: parsed.error.flatten() });

  const { email, password, full_name, phone, policy_version } = parsed.data;
  const password_hash = await bcrypt.hash(password, 12);

  try {
    const created = await withTx(async (client) => {
      const userId = uuid();
      await client.query(
        `insert into public.app_users (id, email, password_hash) values ($1, $2, $3)`,
        [userId, email, password_hash],
      );
      // tipo 'personal' ativo; perfil profissional detalhado (CREF etc.) vem no onboarding.
      await client.query(
        `insert into public.profiles (id, display_name, tipo, phone) values ($1, $2, 'personal', $3)`,
        [userId, full_name, phone],
      );
      await client.query(
        `insert into public.user_lgpd_consents (id, user_id, policy_version, source) values ($1, $2, $3, 'api')`,
        [uuid(), userId, policy_version],
      );
      return { userId };
    });

    // Conta ativa imediata — mesma emissão de sessão do /register.
    return res.status(201).json(await issueSession(created.userId));
  } catch (e: any) {
    const msg = String(e?.message ?? "");
    if (msg.includes("app_users_email_key") || msg.includes("duplicate key")) {
      if (process.env.NODE_ENV === "test") return res.status(409).json({ error: "email_already_in_use", detail: msg });
      return res.status(409).json({ error: "email_already_in_use" });
    }
    if (process.env.NODE_ENV === "test") return res.status(500).json({ error: "internal_error", detail: msg });
    return res.status(500).json({ error: "internal_error" });
  }
});

const loginSchema = z.object({
  email: z.string().email().max(320),
  password: z.string().min(1).max(200),
});

router.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "invalid_body", details: parsed.error.flatten() });

  const { email, password } = parsed.data;
  const row = await withTx(async (client) => {
    const q = await client.query<{ id: string; password_hash: string; must_change_password: boolean }>(
      `select id, password_hash, must_change_password from public.app_users where email = $1`,
      [email],
    );
    return q.rows[0] ?? null;
  });

  if (!row) return res.status(401).json({ error: "invalid_credentials" });
  const ok = await bcrypt.compare(password, row.password_hash);
  if (!ok) return res.status(401).json({ error: "invalid_credentials" });

  const claimsBundle = await withTx(async (client) => loadSessionClaims(client, row.id));
  const { token: access_token, expiresInSeconds } = signAccessToken({
    userId: row.id,
    roles: claimsBundle.roles,
    must_change_password: claimsBundle.must_change_password,
  });

  const refresh_token = randomToken(32);
  const refresh_hash = sha256(refresh_token);
  const refreshTtlDays = Number(process.env.REFRESH_TOKEN_TTL_DAYS ?? 30);
  const expiresAt = new Date(Date.now() + refreshTtlDays * 24 * 60 * 60 * 1000);

  await withTx(async (client) => {
    const id = uuid();
    await client.query(
      `
      insert into public.refresh_tokens (id, user_id, token_hash, expires_at)
      values ($1, $2, $3, $4)
      `,
      [id, row.id, refresh_hash, expiresAt.toISOString()],
    );
  });

  return res.json({
    access_token,
    access_token_expires_in: expiresInSeconds,
    refresh_token,
  });
});

const refreshSchema = z.object({
  refresh_token: z.string().min(10).max(5000),
});

router.post("/refresh", async (req, res) => {
  const parsed = refreshSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "invalid_body", details: parsed.error.flatten() });

  const refresh_token = parsed.data.refresh_token;
  const refresh_hash = sha256(refresh_token);

  const refreshTtlDays = Number(process.env.REFRESH_TOKEN_TTL_DAYS ?? 30);
  const newExpiresAt = new Date(Date.now() + refreshTtlDays * 24 * 60 * 60 * 1000);

  try {
    const rotated = await withTx(async (client) => {
      const q = await client.query<{ id: string; user_id: string; expires_at: any; revoked_at: any }>(
        `
        select id, user_id, expires_at, revoked_at
        from public.refresh_tokens
        where token_hash = $1
        for update
        `,
        [refresh_hash],
      );
      const rt = q.rows[0];
      if (!rt) return null;
      if (rt.revoked_at) return null;
      const exp = rt.expires_at instanceof Date ? rt.expires_at : new Date(rt.expires_at);
      if (exp.getTime() <= Date.now()) return null;

      const nextRefresh = randomToken(32);
      const nextHash = sha256(nextRefresh);

      const newId = uuid();
      const ins = await client.query<{ id: string }>(
        `
        insert into public.refresh_tokens (id, user_id, token_hash, expires_at, replaced_by)
        values ($1, $2, $3, $4, null)
        returning id
        `,
        [newId, rt.user_id, nextHash, newExpiresAt.toISOString()],
      );
      const nextId = ins.rows[0]?.id;
      if (!nextId) throw new Error("failed_to_rotate_refresh");

      await client.query(
        `
        update public.refresh_tokens
        set revoked_at = now(), replaced_by = $2
        where id = $1
        `,
        [rt.id, nextId],
      );

      return { userId: rt.user_id, refresh: nextRefresh };
    });

    if (!rotated) return res.status(401).json({ error: "invalid_refresh_token" });

    const claimsBundle = await withTx(async (client) => loadSessionClaims(client, rotated.userId));
    const { token: access_token, expiresInSeconds } = signAccessToken({
      userId: rotated.userId,
      roles: claimsBundle.roles,
      must_change_password: claimsBundle.must_change_password,
    });
    return res.json({
      access_token,
      access_token_expires_in: expiresInSeconds,
      refresh_token: rotated.refresh,
    });
  } catch {
    return res.status(500).json({ error: "internal_error" });
  }
});

const changePasswordSchema = z.object({
  current_password: z.string().min(1).max(200),
  new_password: z.string().min(8).max(200),
});

router.post("/change-password", requireAuth, async (req, res) => {
  const userId = (req as AuthedRequest).userId;
  const parsed = changePasswordSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "invalid_body", details: parsed.error.flatten() });

  const { current_password, new_password } = parsed.data;

  try {
    const ok = await withTx(async (client) => {
      const q = await client.query<{ password_hash: string }>(
        `select password_hash from public.app_users where id = $1 for update`,
        [userId],
      );
      const row = q.rows[0];
      if (!row) return false;
      const match = await bcrypt.compare(current_password, row.password_hash);
      if (!match) return false;
      const nextHash = await bcrypt.hash(new_password, 12);
      await client.query(
        `
        update public.app_users
        set password_hash = $2, must_change_password = false, updated_at = now()
        where id = $1
        `,
        [userId, nextHash],
      );
      return true;
    });

    if (!ok) return res.status(401).json({ error: "invalid_credentials" });

    const claimsBundle = await withTx(async (client) => loadSessionClaims(client, userId));
    const { token: access_token, expiresInSeconds } = signAccessToken({
      userId,
      roles: claimsBundle.roles,
      must_change_password: claimsBundle.must_change_password,
    });

    return res.json({
      access_token,
      access_token_expires_in: expiresInSeconds,
      must_change_password: claimsBundle.must_change_password,
    });
  } catch {
    return res.status(500).json({ error: "internal_error" });
  }
});

const logoutSchema = z.object({
  refresh_token: z.string().min(10).max(5000),
});

router.post("/logout", async (req, res) => {
  const parsed = logoutSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "invalid_body", details: parsed.error.flatten() });

  const refresh_hash = sha256(parsed.data.refresh_token);
  await withTx(async (client) => {
    await client.query(
      `
      update public.refresh_tokens
      set revoked_at = now()
      where token_hash = $1 and revoked_at is null
      `,
      [refresh_hash],
    );
  });

  return res.status(204).send();
});

export default router;

