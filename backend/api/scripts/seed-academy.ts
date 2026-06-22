// [ACTUS — academia] Seed de uma academia + gestor para testar o login/dashboard.
// Idempotente: pode rodar várias vezes. Verifica o schema antes de escrever.
//
// Uso:
//   cd backend/api
//   node --env-file=.env.local --import tsx scripts/seed-academy.ts
//
// Customizável por env: SEED_EMAIL, SEED_PASSWORD, SEED_ACADEMY.

import pg from "pg";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";

const EMAIL = process.env.SEED_EMAIL ?? "gestor@actus.com";
const PASSWORD = process.env.SEED_PASSWORD ?? "academia123";
const FULL_NAME = "Gestor Demo";
const ACADEMY_NAME = process.env.SEED_ACADEMY ?? "Academia Demo";
const ACADEMY_SLUG = "academia-demo";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL ausente (rode com node --env-file=.env.local)");

  const pool = new pg.Pool({ connectionString: url });
  const client = await pool.connect();
  try {
    // 1) Schema presente? (enum 'gestor' + tabelas da academia)
    const enumOk = await client.query(
      `select 1 from pg_enum e join pg_type t on t.oid = e.enumtypid
       where t.typname = 'user_role' and e.enumlabel = 'gestor'`,
    );
    const tableOk = await client.query(`select to_regclass('public.academy_members') as t`);
    if (!enumOk.rowCount || !tableOk.rows[0]?.t) {
      console.error("\n❌ Schema da academia ausente. Aplique as migrations primeiro:");
      console.error("   backend/supabase/migrations/20260621120000_actus_academies_core.sql");
      console.error("   backend/supabase/migrations/20260621121000_actus_academy_commissions.sql\n");
      process.exit(1);
    }

    await client.query("begin");

    // 2) Academia (reusa por slug se já existir)
    let academyId: string;
    const ac = await client.query<{ id: string }>(`select id from public.academies where slug = $1`, [ACADEMY_SLUG]);
    if (ac.rowCount) {
      academyId = ac.rows[0]!.id;
    } else {
      academyId = crypto.randomUUID();
      await client.query(`insert into public.academies (id, name, slug) values ($1, $2, $3)`, [
        academyId,
        ACADEMY_NAME,
        ACADEMY_SLUG,
      ]);
    }

    // 3) Gestor (reusa por email; reseta senha/tipo para garantir o login)
    const hash = await bcrypt.hash(PASSWORD, 12);
    let userId: string;
    const u = await client.query<{ id: string }>(`select id from public.app_users where email = $1`, [EMAIL]);
    if (u.rowCount) {
      userId = u.rows[0]!.id;
      await client.query(`update public.app_users set password_hash = $1, must_change_password = false where id = $2`, [
        hash,
        userId,
      ]);
      await client.query(`update public.profiles set tipo = 'gestor', display_name = $1 where id = $2`, [FULL_NAME, userId]);
    } else {
      userId = crypto.randomUUID();
      await client.query(
        `insert into public.app_users (id, email, password_hash, must_change_password) values ($1, $2, $3, false)`,
        [userId, EMAIL, hash],
      );
      await client.query(`insert into public.profiles (id, display_name, tipo) values ($1, $2, 'gestor')`, [
        userId,
        FULL_NAME,
      ]);
      await client.query(
        `insert into public.user_lgpd_consents (id, user_id, policy_version, source) values ($1, $2, 'v1', 'seed')`,
        [crypto.randomUUID(), userId],
      );
    }

    // 4) Vínculo de gestor (manager) ativo
    const m = await client.query<{ id: string }>(
      `select id from public.academy_members where academy_id = $1 and user_id = $2`,
      [academyId, userId],
    );
    if (m.rowCount) {
      await client.query(`update public.academy_members set role = 'manager', status = 'active' where id = $1`, [
        m.rows[0]!.id,
      ]);
    } else {
      await client.query(
        `insert into public.academy_members (id, academy_id, user_id, role, status, joined_at)
         values ($1, $2, $3, 'manager', 'active', now())`,
        [crypto.randomUUID(), academyId, userId],
      );
    }

    await client.query("commit");

    console.log("\n✅ Login da academia pronto:");
    console.log(`   Academia: ${ACADEMY_NAME}`);
    console.log(`   Email:    ${EMAIL}`);
    console.log(`   Senha:    ${PASSWORD}`);
    console.log("\n   Entre pela tela de login normal — você cai direto no /app/academia.\n");
  } catch (e) {
    await client.query("rollback").catch(() => {});
    throw e;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
