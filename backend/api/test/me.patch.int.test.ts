import { beforeAll, afterAll, describe, it, expect } from "vitest";
import request from "supertest";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { createApp } from "../src/app.js";
import { closePool, setPoolForTests } from "../src/db.js";
import { createInMemoryPg, minimalSchemaSql } from "./helpers/testDb.js";

describe("PATCH /me", () => {
  let pool: any;

  beforeAll(async () => {
    const mem = createInMemoryPg();
    pool = mem.pool;
    setPoolForTests(pool);
    process.env.JWT_ACCESS_SECRET = "test-secret";
    process.env.NODE_ENV = "test";
    await pool.query(minimalSchemaSql);
  });

  afterAll(async () => {
    await closePool();
  });

  async function loginUser(email: string, password: string) {
    const app = createApp();
    const res = await request(app).post("/auth/login").send({ email, password });
    expect(res.status).toBe(200);
    return res.body.access_token as string;
  }

  it("updates profile and user_basic_info", async () => {
    const id = crypto.randomUUID();
    const hash = await bcrypt.hash("pass12345", 12);
    await pool.query(`insert into public.app_users (id, email, password_hash) values ($1, 'me@example.com', $2)`, [id, hash]);
    await pool.query(`insert into public.profiles (id, tipo, display_name) values ($1, 'aluno', 'Antigo')`, [id]);
    await pool.query(
      `insert into public.user_basic_info (user_id, full_name, birth_date) values ($1, 'Nome Legal', '1990-01-01')`,
      [id],
    );

    const token = await loginUser("me@example.com", "pass12345");
    const app = createApp();
    const res = await request(app)
      .patch("/me")
      .set("Authorization", `Bearer ${token}`)
      .send({
        display_name: "Novo display",
        timezone: "America/Fortaleza",
        full_name: "Nome Atualizado",
        phone: "85999999999",
        gender: "masculino",
        body_weight_kg: 82.5,
      });

    expect(res.status, JSON.stringify(res.body)).toBe(200);
    expect(res.body.display_name).toBe("Novo display");

    const p = await pool.query(`select timezone, display_name from public.profiles where id = $1`, [id]);
    expect(p.rows[0].timezone).toBe("America/Fortaleza");
    const u = await pool.query(
      `select full_name, phone, gender::text, body_weight_kg::text from public.user_basic_info where user_id = $1`,
      [id],
    );
    expect(u.rows[0].full_name).toBe("Nome Atualizado");
    expect(u.rows[0].phone).toBe("85999999999");
    expect(u.rows[0].gender).toBe("masculino");
    expect(u.rows[0].body_weight_kg).toBe("82.5");
  });

  it("returns 400 when no user_basic_info and patching basic fields", async () => {
    const id = crypto.randomUUID();
    const hash = await bcrypt.hash("pass12345", 12);
    await pool.query(`insert into public.app_users (id, email, password_hash) values ($1, 'nobasic@example.com', $2)`, [id, hash]);
    await pool.query(`insert into public.profiles (id, tipo, display_name) values ($1, 'actus_admin', 'Staff')`, [id]);
    await pool.query(`insert into public.app_user_roles (user_id, role) values ($1, 'actus_admin')`, [id]);

    const token = await loginUser("nobasic@example.com", "pass12345");
    const app = createApp();
    const res = await request(app)
      .patch("/me")
      .set("Authorization", `Bearer ${token}`)
      .send({ full_name: "Nome Válido" });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("user_basic_info_not_found");
  });
});
