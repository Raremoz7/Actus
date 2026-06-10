import { beforeAll, afterAll, describe, it, expect } from "vitest";
import request from "supertest";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { createApp } from "../src/app.js";
import { closePool, setPoolForTests } from "../src/db.js";
import { createInMemoryPg, minimalSchemaSql } from "./helpers/testDb.js";

describe("Desafios — fluxo personal + aluno + ranking", () => {
  let pool: import("pg").Pool;

  beforeAll(async () => {
    const mem = createInMemoryPg();
    pool = mem.pool;
    setPoolForTests(pool);
    process.env.JWT_ACCESS_SECRET = "test-secret";
    process.env.NODE_ENV = "test";
    process.env.REFRESH_TOKEN_TTL_DAYS = "30";
    await pool.query(minimalSchemaSql);
  });

  afterAll(async () => {
    await closePool();
  });

  it("convite, aceite, check-in pontua no ranking público; privado bloqueia aluno", async () => {
    const personalId = crypto.randomUUID();
    const studentId = crypto.randomUUID();
    await pool.query(`insert into public.app_users (id, email, password_hash) values ($1, 'ch-p@example.com', $2)`, [
      personalId,
      await bcrypt.hash("pass", 12),
    ]);
    await pool.query(`insert into public.profiles (id, tipo, display_name) values ($1, 'personal', 'Personal')`, [personalId]);
    await pool.query(`insert into public.app_users (id, email, password_hash) values ($1, 'ch-s@example.com', $2)`, [
      studentId,
      await bcrypt.hash("pass", 12),
    ]);
    await pool.query(`insert into public.profiles (id, tipo, display_name) values ($1, 'aluno', 'Aluno A')`, [studentId]);
    await pool.query(
      `insert into public.user_basic_info (user_id, full_name, birth_date) values ($1, 'Aluno A', '1990-01-01')`,
      [studentId],
    );
    await pool.query(
      `insert into public.student_professional_links (student_id, professional_id, professional_role, status) values ($1, $2, 'personal', 'active')`,
      [studentId, personalId],
    );

    const app = createApp();
    const pLogin = await request(app).post("/auth/login").send({ email: "ch-p@example.com", password: "pass" });
    expect(pLogin.status).toBe(200);
    const pToken = pLogin.body.access_token as string;

    const createRes = await request(app)
      .post("/professional/challenges")
      .set("Authorization", `Bearer ${pToken}`)
      .send({
        name: "Maio fit",
        starts_on: "2020-01-01",
        ends_on: "2099-12-31",
        visibility: "public_among_participants",
        status: "active",
      });
    expect(createRes.status, JSON.stringify(createRes.body)).toBe(201);
    const challengeId = createRes.body.challenge.id as string;

    const inv = await request(app)
      .post(`/professional/challenges/${challengeId}/participants`)
      .set("Authorization", `Bearer ${pToken}`)
      .send({ student_ids: [studentId] });
    expect(inv.status).toBe(200);
    expect(inv.body.invited_count).toBe(1);

    const sLogin = await request(app).post("/auth/login").send({ email: "ch-s@example.com", password: "pass" });
    expect(sLogin.status).toBe(200);
    const sToken = sLogin.body.access_token as string;

    const acc = await request(app)
      .post(`/me/challenges/${challengeId}/accept`)
      .set("Authorization", `Bearer ${sToken}`);
    expect(acc.status).toBe(200);

    const td = await pool.query<{ d: unknown }>(`select (now())::date as d`);
    const todayStr =
      td.rows[0]?.d instanceof Date
        ? (td.rows[0].d as Date).toISOString().slice(0, 10)
        : String(td.rows[0]?.d ?? "").slice(0, 10);

    await pool.query(`insert into public.check_ins (id, student_id, check_in_date, source) values ($1, $2, $3::date, 'app')`, [
      crypto.randomUUID(),
      studentId,
      todayStr,
    ]);

    const rankP = await request(app).get(`/professional/challenges/${challengeId}/ranking`).set("Authorization", `Bearer ${pToken}`);
    expect(rankP.status).toBe(200);
    const row = rankP.body.ranking.find((r: { student_id: string }) => r.student_id === studentId);
    expect(row?.active_days).toBeGreaterThanOrEqual(1);
    expect(row?.display_name).toBe("Aluno A");

    const rankS = await request(app).get(`/me/challenges/${challengeId}/ranking`).set("Authorization", `Bearer ${sToken}`);
    expect(rankS.status).toBe(200);
    expect(rankS.body.ranking.some((r: { student_id: string }) => r.student_id === studentId)).toBe(true);

    const patchPrv = await request(app)
      .patch(`/professional/challenges/${challengeId}`)
      .set("Authorization", `Bearer ${pToken}`)
      .send({ visibility: "private_ranking" });
    expect(patchPrv.status).toBe(200);

    const rankPrivate = await request(app).get(`/me/challenges/${challengeId}/ranking`).set("Authorization", `Bearer ${sToken}`);
    expect(rankPrivate.status).toBe(403);
    expect(rankPrivate.body.error).toBe("ranking_private");
  });
});
