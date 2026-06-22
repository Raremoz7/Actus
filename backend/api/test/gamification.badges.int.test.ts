import { beforeAll, afterAll, describe, it, expect } from "vitest";
import request from "supertest";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { createApp } from "../src/app.js";
import { closePool, setPoolForTests } from "../src/db.js";
import { createInMemoryPg, minimalSchemaSql } from "./helpers/testDb.js";

/**
 * Cobre a avaliação de badges + streak disparada por POST /me/check-ins.
 *
 * Caminho de teste escolhido: opção (b) do plano — POST /me/check-ins.
 * Motivo: no pg-mem o incremento de `total_workouts_completed` é feito por um
 * trigger (trg_workout_session_completed_stats) que NÃO existe no minimalSchemaSql,
 * de modo que nem o finish nem o check-in incrementam o contador no banco em
 * memória. Para testar `first_step` (workout_count >= 1) de ponta a ponta,
 * semeamos `total_workouts_completed = 1` direto via SQL (simula um treino
 * concluído) e exercitamos o endpoint real, que chama recomputeStreak +
 * evaluateBadges na mesma transação.
 */
describe("Gamificação — badges no check-in", () => {
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

  it("primeiro check-in concede first_step; segundo no mesmo dia não repete", async () => {
    const studentId = crypto.randomUUID();
    await pool.query(
      `insert into public.app_users (id, email, password_hash) values ($1, 'badges-s@example.com', $2)`,
      [studentId, await bcrypt.hash("pass", 12)],
    );
    // total_workouts_completed = 1 simula um treino concluído (no banco real o
    // trigger faria isso ao finalizar a sessão).
    await pool.query(
      `insert into public.profiles (id, tipo, display_name, total_workouts_completed) values ($1, 'aluno', 'S', 1)`,
      [studentId],
    );
    await pool.query(
      `insert into public.user_basic_info (user_id, full_name, birth_date) values ($1, 'Aluno', '1990-01-01')`,
      [studentId],
    );

    const app = createApp();
    const login = await request(app)
      .post("/auth/login")
      .send({ email: "badges-s@example.com", password: "pass" });
    expect(login.status).toBe(200);
    const token = login.body.access_token as string;

    const day = "2026-05-04";

    const first = await request(app)
      .post("/me/check-ins")
      .set("Authorization", `Bearer ${token}`)
      .send({ check_in_date: day });
    expect(first.status, JSON.stringify(first.body)).toBe(201);
    expect(first.body.created).toBe(true);
    expect(Array.isArray(first.body.newly_earned_badges)).toBe(true);
    const firstIds = first.body.newly_earned_badges.map((b: { id: string }) => b.id);
    expect(firstIds).toContain("first_step");
    const firstStep = first.body.newly_earned_badges.find(
      (b: { id: string }) => b.id === "first_step",
    );
    expect(firstStep).toMatchObject({
      id: "first_step",
      name: "Primeiro Passo",
      asset_key: "badge_first_step",
    });
    expect(typeof firstStep.description).toBe("string");

    // Streak creditado no primeiro check-in (null -> 1).
    const afterFirst = await pool.query<{ streak_current: number }>(
      `select streak_current from public.profiles where id = $1`,
      [studentId],
    );
    expect(afterFirst.rows[0].streak_current).toBe(1);

    // Segundo check-in no mesmo dia: idempotente — não repete first_step.
    const second = await request(app)
      .post("/me/check-ins")
      .set("Authorization", `Bearer ${token}`)
      .send({ check_in_date: day });
    expect(second.status, JSON.stringify(second.body)).toBe(201);
    const secondIds = second.body.newly_earned_badges.map((b: { id: string }) => b.id);
    expect(secondIds).not.toContain("first_step");

    // Badge persistido uma única vez.
    const persisted = await pool.query(
      `select count(*)::int as c from public.student_badges where student_id = $1 and badge_id = 'first_step'`,
      [studentId],
    );
    expect(persisted.rows[0].c).toBe(1);
  });
});
