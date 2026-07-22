import { beforeAll, afterAll, describe, it, expect } from "vitest";
import request from "supertest";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { createApp } from "../src/app.js";
import { closePool, setPoolForTests } from "../src/db.js";
import { createInMemoryPg, minimalSchemaSql } from "./helpers/testDb.js";

describe("Professional students — gamification fields", () => {
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

  it("GET /professional/students traz streak_current, is_broken e badge_count", async () => {
    const personalId = crypto.randomUUID();
    const studentId = crypto.randomUUID();

    await pool.query(`insert into public.app_users (id, email, password_hash) values ($1, 'prof-gam-p@example.com', $2)`, [
      personalId,
      await bcrypt.hash("pass", 12),
    ]);
    await pool.query(`insert into public.profiles (id, tipo, display_name) values ($1, 'personal', 'P')`, [personalId]);

    await pool.query(`insert into public.app_users (id, email, password_hash) values ($1, 'prof-gam-s@example.com', $2)`, [
      studentId,
      await bcrypt.hash("pass", 12),
    ]);
    await pool.query(
      `insert into public.profiles (id, tipo, display_name, streak_current, streak_best, last_activity_at) values ($1, 'aluno', 'S', 4, 6, now())`,
      [studentId],
    );
    await pool.query(
      `insert into public.user_basic_info (user_id, full_name, birth_date) values ($1, 'Aluno Gam', '1990-01-01')`,
      [studentId],
    );
    await pool.query(
      `insert into public.student_professional_links (student_id, professional_id, professional_role, status) values ($1, $2, 'personal', 'active')`,
      [studentId, personalId],
    );

    const badgeIds = ["first_step", "committed_5", "consistent_10"];
    for (const badgeId of badgeIds) {
      await pool.query(`insert into public.student_badges (student_id, badge_id) values ($1, $2)`, [studentId, badgeId]);
    }

    const app = createApp();
    const login = await request(app)
      .post("/auth/login")
      .send({ email: "prof-gam-p@example.com", password: "pass" });
    expect(login.status).toBe(200);
    const token = login.body.access_token as string;

    const res = await request(app).get("/professional/students").set("Authorization", `Bearer ${token}`);
    expect(res.status, JSON.stringify(res.body)).toBe(200);

    const student = (res.body.students as Array<{ id: string }>).find((s) => s.id === studentId) as
      | { id: string; streak_current: number; is_broken: boolean; badge_count: number }
      | undefined;
    expect(student).toBeDefined();
    expect(typeof student!.streak_current).toBe("number");
    expect(student!.streak_current).toBe(4);
    expect(typeof student!.is_broken).toBe("boolean");
    expect(student!.is_broken).toBe(false);
    expect(student!.badge_count).toBe(badgeIds.length);
  });
});
