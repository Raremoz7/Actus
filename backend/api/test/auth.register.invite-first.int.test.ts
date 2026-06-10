import { beforeAll, afterAll, describe, it, expect } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import { createApp } from "../src/app.js";
import { closePool, setPoolForTests } from "../src/db.js";
import { createInMemoryPg, minimalSchemaSql } from "./helpers/testDb.js";

describe("POST /auth/register (invite-first)", () => {
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

  it("should register only with a valid invite and create link", async () => {
    // Create professional user + profile (personal)
    const profUser = await pool.query<{ id: string }>(
        `insert into public.app_users (email, password_hash) values ('pro@example.com', 'x') returning id`,
      );
    const professionalId = profUser.rows[0]!.id;
    await pool.query(`insert into public.profiles (id, tipo, display_name) values ($1, 'personal', 'Pro')`, [
      professionalId,
    ]);

    // Create invite
    const inv = await pool.query<{ code: string }>(
      `insert into public.invites (professional_id, code, expires_at, max_uses, used_count) values ($1, 'INV123', now() + interval '1 day', 1, 0) returning code`,
      [professionalId],
    );

    const app = createApp();
    const res = await request(app).post("/auth/register").send({
      invite_code: inv.rows[0]!.code,
      email: "aluno@example.com",
      password: "password123",
      full_name: "Aluno Teste",
      birth_date: "1995-10-01",
    });

    expect(res.status, JSON.stringify(res.body)).toBe(201);
    expect(res.body.access_token).toBeTypeOf("string");
    expect(res.body.refresh_token).toBeTypeOf("string");

    const decoded = jwt.verify(res.body.access_token, "test-secret") as { roles?: string[] };
    expect(decoded.roles).toEqual(["aluno"]);

    const aluno = await pool.query<{ id: string }>(`select id from public.app_users where email = 'aluno@example.com'`);
    expect(aluno.rowCount).toBe(1);
    const alunoId = aluno.rows[0]!.id;

    const link = await pool.query(
      `select * from public.student_professional_links where student_id = $1 and professional_id = $2 and status = 'active'`,
      [alunoId, professionalId],
    );
    expect(link.rowCount).toBe(1);

    const used = await pool.query<{ used_count: number }>(`select used_count from public.invites where code = 'INV123'`);
    expect(used.rows[0]!.used_count).toBe(1);
  });

  it("should reject when invite is invalid", async () => {
    const app = createApp();
    const res = await request(app).post("/auth/register").send({
      invite_code: "NOPE",
      email: "x2@example.com",
      password: "password123",
      full_name: "Aluno Teste",
      birth_date: "1995-10-01",
    });
    expect(res.status, JSON.stringify(res.body)).toBe(400);
    expect(res.body.error).toBe("invalid_invite");
  });
});

