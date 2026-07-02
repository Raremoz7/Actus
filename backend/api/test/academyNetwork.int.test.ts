import { beforeAll, afterAll, describe, it, expect } from "vitest";
import request from "supertest";
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { createApp } from "../src/app.js";
import { closePool, setPoolForTests } from "../src/db.js";
import { createInMemoryPg, minimalSchemaSql } from "./helpers/testDb.js";

describe("Rede de academias (filiais/franquias)", () => {
  let pool: any;
  let app: ReturnType<typeof createApp>;

  beforeAll(async () => {
    const mem = createInMemoryPg();
    pool = mem.pool;
    setPoolForTests(pool);
    process.env.JWT_ACCESS_SECRET = "test-secret";
    process.env.NODE_ENV = "test";
    process.env.REFRESH_TOKEN_TTL_DAYS = "30";
    process.env.DEFAULT_MAX_ACTIVE_INVITES = "20";
    await pool.query(minimalSchemaSql);
    app = createApp();
  });

  afterAll(async () => {
    await closePool();
  });

  async function staffToken(): Promise<string> {
    const hash = await bcrypt.hash("staffpass", 12);
    const email = `staff-${crypto.randomUUID()}@ex.com`;
    const ins = await pool.query<{ id: string }>(
      `insert into public.app_users (email, password_hash, must_change_password) values ($1, $2, false) returning id`,
      [email, hash],
    );
    const id = ins.rows[0]!.id;
    await pool.query(`insert into public.profiles (id, tipo, display_name) values ($1, 'actus_admin', 'Staff')`, [id]);
    await pool.query(`insert into public.app_user_roles (user_id, role) values ($1, 'actus_admin')`, [id]);
    const login = await request(app).post("/auth/login").send({ email, password: "staffpass" });
    return login.body.access_token as string;
  }

  it("cria uma academia matriz (network_hq) e vincula uma filial (unit) a ela", async () => {
    const staff = await staffToken();

    const hq = await request(app)
      .post("/admin/academies")
      .set("Authorization", `Bearer ${staff}`)
      .send({ name: "Rede Matriz", network_role: "network_hq" });
    expect(hq.status, JSON.stringify(hq.body)).toBe(201);

    const unit = await request(app)
      .post("/admin/academies")
      .set("Authorization", `Bearer ${staff}`)
      .send({ name: "Filial 1", network_role: "unit", parent_academy_id: hq.body.id });
    expect(unit.status, JSON.stringify(unit.body)).toBe(201);
  });

  it("rejeita network_role=unit sem parent_academy_id", async () => {
    const staff = await staffToken();
    const res = await request(app)
      .post("/admin/academies")
      .set("Authorization", `Bearer ${staff}`)
      .send({ name: "Filial órfã", network_role: "unit" });
    expect(res.status, JSON.stringify(res.body)).toBe(400);
    expect(res.body.error).toBe("invalid_body");
  });
});
