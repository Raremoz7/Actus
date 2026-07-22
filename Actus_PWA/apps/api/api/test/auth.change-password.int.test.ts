import { beforeAll, afterAll, describe, it, expect } from "vitest";
import request from "supertest";
import bcrypt from "bcryptjs";
import { createApp } from "../src/app.js";
import { closePool, setPoolForTests } from "../src/db.js";
import { createInMemoryPg, minimalSchemaSql } from "./helpers/testDb.js";

describe("must_change_password + POST /auth/change-password", () => {
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

  it("blocks protected routes until password change; change-password issues new token", async () => {
    const hash = await bcrypt.hash("oldpw1234", 12);
    const ins = await pool.query<{ id: string }>(
      `
      insert into public.app_users (email, password_hash, must_change_password)
      values ('force@example.com', $1, true)
      returning id
      `,
      [hash],
    );
    const id = ins.rows[0]!.id;
    await pool.query(`insert into public.profiles (id, tipo, display_name) values ($1, 'aluno', 'User')`, [id]);

    const app = createApp();
    const login = await request(app).post("/auth/login").send({
      email: "force@example.com",
      password: "oldpw1234",
    });
    expect(login.status).toBe(200);
    const token1 = login.body.access_token as string;

    const blocked = await request(app).get("/me").set("Authorization", `Bearer ${token1}`);
    expect(blocked.status).toBe(403);
    expect(blocked.body.error).toBe("must_change_password");

    const changed = await request(app)
      .post("/auth/change-password")
      .set("Authorization", `Bearer ${token1}`)
      .send({ current_password: "oldpw1234", new_password: "newpw12345" });
    expect(changed.status, JSON.stringify(changed.body)).toBe(200);
    const token2 = changed.body.access_token as string;

    const ok = await request(app).get("/me").set("Authorization", `Bearer ${token2}`);
    expect(ok.status).toBe(200);
  });
});
