import { beforeAll, afterAll, describe, it, expect } from "vitest";
import request from "supertest";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { createApp } from "../src/app.js";
import { closePool, setPoolForTests } from "../src/db.js";
import { createInMemoryPg, minimalSchemaSql } from "./helpers/testDb.js";

describe("Badges — rotas do aluno", () => {
  let pool: import("pg").Pool;
  let app: ReturnType<typeof createApp>;
  let token: string;

  beforeAll(async () => {
    const mem = createInMemoryPg();
    pool = mem.pool;
    setPoolForTests(pool);
    process.env.JWT_ACCESS_SECRET = "test-secret";
    process.env.NODE_ENV = "test";
    process.env.REFRESH_TOKEN_TTL_DAYS = "30";
    await pool.query(minimalSchemaSql);

    const personalId = crypto.randomUUID();
    const studentId = crypto.randomUUID();
    await pool.query(
      `insert into public.app_users (id, email, password_hash) values ($1, 'badge-p@example.com', $2)`,
      [personalId, await bcrypt.hash("pass", 12)],
    );
    await pool.query(`insert into public.profiles (id, tipo, display_name) values ($1, 'personal', 'P')`, [
      personalId,
    ]);
    await pool.query(
      `insert into public.app_users (id, email, password_hash) values ($1, 'badge-s@example.com', $2)`,
      [studentId, await bcrypt.hash("pass", 12)],
    );
    await pool.query(`insert into public.profiles (id, tipo, display_name) values ($1, 'aluno', 'S')`, [
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
    await pool.query(
      `insert into public.student_badges (id, student_id, badge_id, seen_at) values ($1, $2, 'first_step', null)`,
      [crypto.randomUUID(), studentId],
    );

    app = createApp();
    const login = await request(app)
      .post("/auth/login")
      .send({ email: "badge-s@example.com", password: "pass" });
    expect(login.status).toBe(200);
    token = login.body.access_token as string;
  });

  afterAll(async () => {
    await closePool();
  });

  it("GET /me/badges retorna os 7 badges com earned correto", async () => {
    const res = await request(app).get("/me/badges").set("Authorization", `Bearer ${token}`);
    expect(res.status, JSON.stringify(res.body)).toBe(200);
    expect(res.body.badges).toHaveLength(7);
    const first = res.body.badges.find((b: { id: string }) => b.id === "first_step");
    expect(first?.earned).toBe(true);
    const others = res.body.badges.filter((b: { id: string }) => b.id !== "first_step");
    expect(others.every((b: { earned: boolean }) => b.earned === false)).toBe(true);
  });

  it("GET /me/badges/unseen retorna first_step", async () => {
    const res = await request(app).get("/me/badges/unseen").set("Authorization", `Bearer ${token}`);
    expect(res.status, JSON.stringify(res.body)).toBe(200);
    expect(res.body.badges).toHaveLength(1);
    expect(res.body.badges[0].id).toBe("first_step");
  });

  it("POST /me/badges/seen marca como visto e some do unseen", async () => {
    const seen = await request(app)
      .post("/me/badges/seen")
      .set("Authorization", `Bearer ${token}`)
      .send({ badge_ids: ["first_step"] });
    expect(seen.status, JSON.stringify(seen.body)).toBe(200);
    expect(seen.body.ok).toBe(true);

    const res = await request(app).get("/me/badges/unseen").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.badges).toHaveLength(0);
  });
});
