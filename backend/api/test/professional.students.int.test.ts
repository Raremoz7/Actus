import { beforeAll, afterAll, describe, it, expect } from "vitest";
import request from "supertest";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { createApp } from "../src/app.js";
import { closePool, setPoolForTests } from "../src/db.js";
import { createInMemoryPg, minimalSchemaSql } from "./helpers/testDb.js";

describe("GET /professional/students", () => {
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

  it("lists linked students for a personal", async () => {
    const personalHash = await bcrypt.hash("propass", 12);
    const personalId = crypto.randomUUID();
    await pool.query(`insert into public.app_users (id, email, password_hash) values ($1, 'p@example.com', $2)`, [
      personalId,
      personalHash,
    ]);
    await pool.query(`insert into public.profiles (id, tipo, display_name) values ($1, 'personal', 'Pro')`, [personalId]);

    const alunoHash = await bcrypt.hash("alunopass", 12);
    const alunoId = crypto.randomUUID();
    await pool.query(`insert into public.app_users (id, email, password_hash) values ($1, 'a@example.com', $2)`, [
      alunoId,
      alunoHash,
    ]);
    await pool.query(`insert into public.profiles (id, tipo, display_name) values ($1, 'aluno', 'Aluno')`, [alunoId]);
    await pool.query(
      `insert into public.user_basic_info (user_id, full_name, birth_date) values ($1, 'Aluno Teste', '1995-10-01')`,
      [alunoId],
    );

    await pool.query(
      `insert into public.student_professional_links (student_id, professional_id, professional_role, status) values ($1, $2, 'personal', 'active')`,
      [alunoId, personalId],
    );

    const app = createApp();
    const login = await request(app).post("/auth/login").send({ email: "p@example.com", password: "propass" });
    expect(login.status).toBe(200);

    const res = await request(app)
      .get("/professional/students")
      .set("Authorization", `Bearer ${login.body.access_token}`);
    expect(res.status, JSON.stringify(res.body)).toBe(200);
    expect(res.body.students.length).toBe(1);
    expect(res.body.students[0].email).toBe("a@example.com");
  });
});

