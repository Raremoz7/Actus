import { beforeAll, afterAll, describe, it, expect } from "vitest";
import request from "supertest";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { createApp } from "../src/app.js";
import { closePool, setPoolForTests } from "../src/db.js";
import { createInMemoryPg, minimalSchemaSql } from "./helpers/testDb.js";

describe("GET /invites", () => {
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

  it("lists invites for a professional", async () => {
    const hash = await bcrypt.hash("propass", 12);
    const explicitProId = crypto.randomUUID();
    const ins = await pool.query<{ id: string }>(
      `insert into public.app_users (id, email, password_hash) values ($1, 'pro@example.com', $2) returning id`,
      [explicitProId, hash],
    );
    const proId = ins.rows[0]!.id;
    await pool.query(`insert into public.profiles (id, tipo, display_name) values ($1, 'personal', 'Pro')`, [proId]);
    await pool.query(
      `insert into public.invites (id, professional_id, code, expires_at, max_uses, used_count) values ($1, $2, 'CODE1', now() + interval '1 day', 2, 0)`,
      [crypto.randomUUID(), proId],
    );
    await pool.query(
      `insert into public.invites (id, professional_id, code, expires_at, max_uses, used_count) values ($1, $2, 'CODE2', now() - interval '1 day', 1, 0)`,
      [crypto.randomUUID(), proId],
    );

    const app = createApp();
    const login = await request(app).post("/auth/login").send({ email: "pro@example.com", password: "propass" });
    expect(login.status).toBe(200);
    const token = login.body.access_token as string;

    const res = await request(app).get("/invites").set("Authorization", `Bearer ${token}`);
    expect(res.status, JSON.stringify(res.body)).toBe(200);
    expect(Array.isArray(res.body.invites)).toBe(true);
    expect(res.body.invites.length).toBeGreaterThanOrEqual(2);

    const codes = res.body.invites.map((x: any) => x.code);
    expect(codes).toContain("CODE1");
    expect(codes).toContain("CODE2");
  });

  it("returns 403 for students", async () => {
    const hash = await bcrypt.hash("alunopass", 12);
    const explicitAlunoId = crypto.randomUUID();
    const ins = await pool.query<{ id: string }>(
      `insert into public.app_users (id, email, password_hash) values ($1, 'aluno@example.com', $2) returning id`,
      [explicitAlunoId, hash],
    );
    const alunoId = ins.rows[0]!.id;
    await pool.query(`insert into public.profiles (id, tipo, display_name) values ($1, 'aluno', 'Aluno')`, [alunoId]);

    const app = createApp();
    const login = await request(app).post("/auth/login").send({ email: "aluno@example.com", password: "alunopass" });
    expect(login.status).toBe(200);
    const token = login.body.access_token as string;

    const res = await request(app).get("/invites").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(403);
    expect(res.body.error).toBe("not_professional");
  });
});

