import { beforeAll, afterAll, describe, it, expect } from "vitest";
import request from "supertest";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { createApp } from "../src/app.js";
import { closePool, setPoolForTests } from "../src/db.js";
import { createInMemoryPg, minimalSchemaSql } from "./helpers/testDb.js";

describe("POST /admin/professionals", () => {
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

  async function staffAccessToken(role: "actus_admin" | "actus_suporte" = "actus_admin") {
    const hash = await bcrypt.hash("staffpass", 12);
    const ins = await pool.query<{ id: string }>(
      `
      insert into public.app_users (email, password_hash, must_change_password)
      values ($1, $2, false)
      returning id
      `,
      [`staff-${role}@example.com`, hash],
    );
    const id = ins.rows[0]!.id;
    await pool.query(`insert into public.profiles (id, tipo, display_name) values ($1, $2, 'Staff')`, [id, role]);
    await pool.query(`insert into public.app_user_roles (user_id, role) values ($1, $2)`, [id, role]);

    const app = createApp();
    const login = await request(app).post("/auth/login").send({
      email: `staff-${role}@example.com`,
      password: "staffpass",
    });
    expect(login.status).toBe(200);
    return login.body.access_token as string;
  }

  it("creates a professional without invite for staff", async () => {
    const token = await staffAccessToken("actus_suporte");
    const app = createApp();
    const res = await request(app)
      .post("/admin/professionals")
      .set("Authorization", `Bearer ${token}`)
      .send({
        email: "newpro@example.com",
        password: "initialpw1",
        full_name: "Novo Pro",
        professional_role: "personal",
        cref_number: "CREF-12345",
        birth_date: "1990-05-05",
        must_change_password: true,
      });

    expect(res.status, JSON.stringify(res.body)).toBe(201);
    expect(res.body.id).toBeTruthy();

    const row = await pool.query<{ must_change_password: boolean }>(
      `select must_change_password from public.app_users where email = 'newpro@example.com'`,
    );
    expect(row.rows[0]?.must_change_password).toBe(true);

    const prof = await pool.query<{ tipo: string }>(
      `select tipo::text from public.profiles where id = $1`,
      [res.body.id],
    );
    expect(prof.rows[0]?.tipo).toBe("personal");

    const pinfo = await pool.query(`select 1 from public.professional_info where user_id = $1`, [res.body.id]);
    expect(pinfo.rowCount).toBe(1);

    const crefVals = await pool.query<{ cref_number: string | null }>(
      `select cref_number from public.professional_info where user_id = $1`,
      [res.body.id],
    );
    expect(crefVals.rows[0]?.cref_number).toBe("CREF-12345");

    const noCrefEmail = `withoutcref-${crypto.randomUUID()}@example.com`;
    const noCref = await request(app)
      .post("/admin/professionals")
      .set("Authorization", `Bearer ${token}`)
      .send({
        email: noCrefEmail,
        password: "initialpw1",
        full_name: "Sem CREF",
        professional_role: "personal",
        birth_date: "1992-01-01",
        must_change_password: true,
      });
    expect(noCref.status, JSON.stringify(noCref.body)).toBe(201);
    const piBare = await pool.query<{ cref_number: string | null; crn_number: string | null }>(
      `select cref_number, crn_number from public.professional_info where user_id = $1`,
      [noCref.body.id],
    );
    expect(piBare.rows[0]?.cref_number).toBeNull();
    expect(piBare.rows[0]?.crn_number).toBeNull();
  });

  it("returns 403 for non-staff professional", async () => {
    const hash = await bcrypt.hash("propw", 12);
    const explicitId = crypto.randomUUID();
    const ins = await pool.query<{ id: string }>(
      `insert into public.app_users (id, email, password_hash) values ($1, 'pro2@example.com', $2) returning id`,
      [explicitId, hash],
    );
    const id = ins.rows[0]!.id;
    await pool.query(`insert into public.profiles (id, tipo, display_name) values ($1, 'personal', 'Pro')`, [id]);

    const app = createApp();
    const login = await request(app).post("/auth/login").send({ email: "pro2@example.com", password: "propw" });
    expect(login.status).toBe(200);
    const token = login.body.access_token as string;

    const res = await request(app)
      .post("/admin/professionals")
      .set("Authorization", `Bearer ${token}`)
      .send({
        email: "other@example.com",
        password: "initialpw1",
        full_name: "X",
        professional_role: "nutricionista",
        crn_number: "CRN-9999",
        birth_date: "1990-05-05",
      });

    expect(res.status).toBe(403);
    expect(res.body.error).toBe("forbidden");
  });
});
