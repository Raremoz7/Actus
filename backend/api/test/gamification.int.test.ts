import { beforeAll, afterAll, describe, it, expect } from "vitest";
import request from "supertest";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { createApp } from "../src/app.js";
import { closePool, setPoolForTests } from "../src/db.js";
import { createInMemoryPg, minimalSchemaSql } from "./helpers/testDb.js";

describe("Gamificação — weekly overview", () => {
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

  it("GET /me/gamification/weekly-overview retorna 7 dias e streak", async () => {
    const personalId = crypto.randomUUID();
    const studentId = crypto.randomUUID();
    await pool.query(`insert into public.app_users (id, email, password_hash) values ($1, 'gam-p@example.com', $2)`, [
      personalId,
      await bcrypt.hash("pass", 12),
    ]);
    await pool.query(`insert into public.profiles (id, tipo, display_name) values ($1, 'personal', 'P')`, [personalId]);
    await pool.query(`insert into public.app_users (id, email, password_hash) values ($1, 'gam-s@example.com', $2)`, [
      studentId,
      await bcrypt.hash("pass", 12),
    ]);
    await pool.query(`insert into public.profiles (id, tipo, display_name, streak_current, streak_best, last_activity_at) values ($1, 'aluno', 'S', 3, 5, now())`, [
      studentId,
    ]);
    await pool.query(
      `insert into public.user_basic_info (user_id, full_name, birth_date) values ($1, 'Aluno', '1990-01-01')`,
      [studentId],
    );
    await pool.query(
      `insert into public.student_professional_links (student_id, professional_id, professional_role, status) values ($1, $2, 'personal', 'active')`,
      [studentId, personalId],
    );

    const weekMonday = "2026-05-04";
    await pool.query(`insert into public.check_ins (id, student_id, check_in_date, source) values ($1, $2, $3::date, 'app')`, [
      crypto.randomUUID(),
      studentId,
      "2026-05-05",
    ]);

    const app = createApp();
    const login = await request(app).post("/auth/login").send({ email: "gam-s@example.com", password: "pass" });
    expect(login.status).toBe(200);
    const token = login.body.access_token as string;

    const res = await request(app)
      .get("/me/gamification/weekly-overview")
      .query({ week_start: weekMonday })
      .set("Authorization", `Bearer ${token}`);
    expect(res.status, JSON.stringify(res.body)).toBe(200);
    expect(res.body.week_start).toBe(weekMonday);
    expect(res.body.week_end).toBe("2026-05-10");
    expect(res.body.days).toHaveLength(7);
    expect(res.body.streak_current).toBe(3);
    expect(res.body.streak_best).toBe(5);
    expect(res.body.is_broken).toBe(false);
    expect(typeof res.body.last_activity_at).toBe("string");
    const tue = res.body.days.find((d: { date: string }) => d.date === "2026-05-05");
    expect(tue?.completed).toBe(true);
    expect(tue?.sources).toContain("check_in");

    const bad = await request(app)
      .get("/me/gamification/weekly-overview")
      .query({ week_start: "2026-05-05" })
      .set("Authorization", `Bearer ${token}`);
    expect(bad.status).toBe(400);
    expect(bad.body.error).toBe("week_start_not_monday");
  });
});
