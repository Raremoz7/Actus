import { beforeAll, afterAll, describe, it, expect } from "vitest";
import request from "supertest";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { createApp } from "../src/app.js";
import { closePool, setPoolForTests } from "../src/db.js";
import { createInMemoryPg, minimalSchemaSql } from "./helpers/testDb.js";

describe("Device tokens — registro/remoção para push", () => {
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

  it("registra (idempotente) e remove device token", async () => {
    const studentId = crypto.randomUUID();
    await pool.query(`insert into public.app_users (id, email, password_hash) values ($1, 'dev-s@example.com', $2)`, [
      studentId,
      await bcrypt.hash("pass", 12),
    ]);
    await pool.query(`insert into public.profiles (id, tipo, display_name) values ($1, 'aluno', 'S')`, [studentId]);

    const app = createApp();
    const login = await request(app).post("/auth/login").send({ email: "dev-s@example.com", password: "pass" });
    expect(login.status).toBe(200);
    const token = login.body.access_token as string;

    const body = { expo_push_token: "ExponentPushToken[abc]", platform: "ios" as const };

    // 1º POST → 200
    const r1 = await request(app).post("/me/device-tokens").set("Authorization", `Bearer ${token}`).send(body);
    expect(r1.status, JSON.stringify(r1.body)).toBe(200);
    expect(r1.body.ok).toBe(true);

    // 2º POST igual → 200 (idempotente, sem erro de duplicidade)
    const r2 = await request(app).post("/me/device-tokens").set("Authorization", `Bearer ${token}`).send(body);
    expect(r2.status, JSON.stringify(r2.body)).toBe(200);

    // Apenas uma linha persistida
    const count = await pool.query(`select count(*)::int as n from public.device_tokens where user_id = $1`, [studentId]);
    expect(count.rows[0].n).toBe(1);

    // Body inválido → 400
    const bad = await request(app)
      .post("/me/device-tokens")
      .set("Authorization", `Bearer ${token}`)
      .send({ expo_push_token: "x", platform: "windows" });
    expect(bad.status).toBe(400);

    // DELETE → 200
    const del = await request(app)
      .delete("/me/device-tokens/ExponentPushToken[abc]")
      .set("Authorization", `Bearer ${token}`);
    expect(del.status, JSON.stringify(del.body)).toBe(200);

    const after = await pool.query(`select count(*)::int as n from public.device_tokens where user_id = $1`, [studentId]);
    expect(after.rows[0].n).toBe(0);
  });
});
