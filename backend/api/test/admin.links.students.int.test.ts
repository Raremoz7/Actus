import { beforeAll, afterAll, describe, it, expect } from "vitest";
import request from "supertest";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { createApp } from "../src/app.js";
import { closePool, setPoolForTests } from "../src/db.js";
import { createInMemoryPg, minimalSchemaSql } from "./helpers/testDb.js";

describe("GET /admin/links/students", () => {
  let pool: any;

  beforeAll(async () => {
    const mem = createInMemoryPg();
    pool = mem.pool;
    setPoolForTests(pool);
    process.env.JWT_ACCESS_SECRET = "test-secret";
    process.env.NODE_ENV = "test";
    process.env.REFRESH_TOKEN_TTL_DAYS = "30";
    process.env.DEFAULT_MAX_ACTIVE_INVITES = "20";
    await pool.query(minimalSchemaSql);
  });

  afterAll(async () => {
    await closePool();
  });

  async function staffToken() {
    const hash = await bcrypt.hash("staffpass", 12);
    const id = crypto.randomUUID();
    await pool.query(`insert into public.app_users (id, email, password_hash, must_change_password) values ($1, $2, $3, false)`, [
      id,
      "staff@example.com",
      hash,
    ]);
    await pool.query(`insert into public.profiles (id, tipo, display_name) values ($1, 'actus_admin', 'Staff')`, [id]);
    await pool.query(`insert into public.app_user_roles (user_id, role) values ($1, 'actus_admin')`, [id]);

    const app = createApp();
    const login = await request(app).post("/auth/login").send({ email: "staff@example.com", password: "staffpass" });
    expect(login.status).toBe(200);
    return login.body.access_token as string;
  }

  it("filters by professional_id", async () => {
    const personalId = crypto.randomUUID();
    await pool.query(`insert into public.app_users (id, email, password_hash) values ($1, 'p2@example.com', 'x')`, [personalId]);
    await pool.query(`insert into public.profiles (id, tipo, display_name) values ($1, 'personal', 'Pro2')`, [personalId]);

    const alunoId = crypto.randomUUID();
    await pool.query(`insert into public.app_users (id, email, password_hash) values ($1, 'a2@example.com', 'y')`, [alunoId]);
    await pool.query(`insert into public.profiles (id, tipo, display_name) values ($1, 'aluno', 'Aluno2')`, [alunoId]);

    await pool.query(
      `insert into public.student_professional_links (student_id, professional_id, professional_role, status) values ($1, $2, 'personal', 'active')`,
      [alunoId, personalId],
    );

    const token = await staffToken();
    const app = createApp();
    const res = await request(app)
      .get("/admin/links/students")
      .query({ professional_id: personalId })
      .set("Authorization", `Bearer ${token}`);

    expect(res.status, JSON.stringify(res.body)).toBe(200);
    expect(res.body.links.length).toBe(1);
    expect(res.body.links[0].professional.id).toBe(personalId);
  });
});

