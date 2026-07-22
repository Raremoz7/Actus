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

  it("returns rich fields and filters by status", async () => {
    const proId = crypto.randomUUID();
    await pool.query(`insert into public.app_users (id, email, password_hash) values ($1, 'p2@x.com', $2)`, [proId, await bcrypt.hash("propass", 12)]);
    await pool.query(`insert into public.profiles (id, tipo, display_name) values ($1, 'personal', 'Pro2')`, [proId]);

    const activeId = crypto.randomUUID();
    await pool.query(`insert into public.app_users (id, email, password_hash) values ($1, 'act@x.com', $2)`, [activeId, await bcrypt.hash("x", 12)]);
    await pool.query(`insert into public.profiles (id, tipo, display_name) values ($1, 'aluno', 'A')`, [activeId]);
    await pool.query(`insert into public.user_basic_info (user_id, full_name, birth_date, phone, gender, body_weight_kg, height_cm, cpf_last4) values ($1,'Ativo','1990-01-01','11999','feminino',64.0,168.0,'1234')`, [activeId]);
    await pool.query(`insert into public.student_professional_links (student_id, professional_id, professional_role, status) values ($1,$2,'personal','active')`, [activeId, proId]);

    const revId = crypto.randomUUID();
    await pool.query(`insert into public.app_users (id, email, password_hash) values ($1, 'rev@x.com', $2)`, [revId, await bcrypt.hash("x", 12)]);
    await pool.query(`insert into public.profiles (id, tipo, display_name) values ($1, 'aluno', 'R')`, [revId]);
    await pool.query(`insert into public.user_basic_info (user_id, full_name, birth_date) values ($1,'Arquivado','1991-02-02')`, [revId]);
    await pool.query(`insert into public.student_professional_links (student_id, professional_id, professional_role, status) values ($1,$2,'personal','revoked')`, [revId, proId]);

    const app = createApp();
    const login = await request(app).post("/auth/login").send({ email: "p2@x.com", password: "propass" });

    const def = await request(app).get("/professional/students").set("Authorization", `Bearer ${login.body.access_token}`);
    expect(def.body.students.length).toBe(1);
    expect(def.body.students[0].full_name).toBe("Ativo");
    expect(def.body.students[0].phone).toBe("11999");
    expect(def.body.students[0].gender).toBe("feminino");
    expect(def.body.students[0].body_weight_kg).toBe(64);
    expect(def.body.students[0].height_cm).toBe(168);
    expect(def.body.students[0].cpf_last4).toBe("1234");

    const arch = await request(app).get("/professional/students?status=revoked").set("Authorization", `Bearer ${login.body.access_token}`);
    expect(arch.body.students.map((s: any) => s.full_name)).toEqual(["Arquivado"]);

    const all = await request(app).get("/professional/students?status=all").set("Authorization", `Bearer ${login.body.access_token}`);
    expect(all.status, JSON.stringify(all.body)).toBe(200);
    expect(all.body.students.length).toBe(2);
  });

  it("returns the student's badge catalog with earned flags", async () => {
    const proId = crypto.randomUUID();
    await pool.query(`insert into public.app_users (id, email, password_hash) values ($1, 'p3@x.com', $2)`, [proId, await bcrypt.hash("propass", 12)]);
    await pool.query(`insert into public.profiles (id, tipo, display_name) values ($1, 'personal', 'Pro3')`, [proId]);
    const sId = crypto.randomUUID();
    await pool.query(`insert into public.app_users (id, email, password_hash) values ($1, 's3@x.com', $2)`, [sId, await bcrypt.hash("x", 12)]);
    await pool.query(`insert into public.profiles (id, tipo, display_name) values ($1, 'aluno', 'S3')`, [sId]);
    await pool.query(`insert into public.user_basic_info (user_id, full_name, birth_date) values ($1,'S3','1990-01-01')`, [sId]);
    await pool.query(`insert into public.student_professional_links (student_id, professional_id, professional_role, status) values ($1,$2,'personal','active')`, [sId, proId]);
    await pool.query(`insert into public.student_badges (student_id, badge_id) values ($1, 'first_step')`, [sId]);

    const app = createApp();
    const login = await request(app).post("/auth/login").send({ email: "p3@x.com", password: "propass" });
    const res = await request(app).get(`/professional/students/${sId}/badges`).set("Authorization", `Bearer ${login.body.access_token}`);
    expect(res.status, JSON.stringify(res.body)).toBe(200);
    expect(res.body.badges.length).toBe(7);
    const first = res.body.badges.find((b: any) => b.id === "first_step");
    expect(first.earned).toBe(true);
    const legendary = res.body.badges.find((b: any) => b.id === "legendary_30");
    expect(legendary.earned).toBe(false);
  });

  it("rejects badges for a non-linked student", async () => {
    const proId = crypto.randomUUID();
    await pool.query(`insert into public.app_users (id, email, password_hash) values ($1, 'p4@x.com', $2)`, [proId, await bcrypt.hash("propass", 12)]);
    await pool.query(`insert into public.profiles (id, tipo, display_name) values ($1, 'personal', 'Pro4')`, [proId]);
    const app = createApp();
    const login = await request(app).post("/auth/login").send({ email: "p4@x.com", password: "propass" });
    const res = await request(app).get(`/professional/students/${crypto.randomUUID()}/badges`).set("Authorization", `Bearer ${login.body.access_token}`);
    expect(res.status).toBe(404);
    expect(res.body.error).toBe("student_not_linked");
  });

  it("patches a linked student's basic data (no email/password)", async () => {
    const proId = crypto.randomUUID();
    await pool.query(`insert into public.app_users (id, email, password_hash) values ($1, 'p5@x.com', $2)`, [proId, await bcrypt.hash("propass", 12)]);
    await pool.query(`insert into public.profiles (id, tipo, display_name) values ($1, 'personal', 'Pro5')`, [proId]);
    const sId = crypto.randomUUID();
    await pool.query(`insert into public.app_users (id, email, password_hash) values ($1, 's5@x.com', $2)`, [sId, await bcrypt.hash("x", 12)]);
    await pool.query(`insert into public.profiles (id, tipo, display_name) values ($1, 'aluno', 'S5')`, [sId]);
    await pool.query(`insert into public.user_basic_info (user_id, full_name, birth_date) values ($1,'Nome Antigo','1990-01-01')`, [sId]);
    await pool.query(`insert into public.student_professional_links (student_id, professional_id, professional_role, status) values ($1,$2,'personal','active')`, [sId, proId]);

    const app = createApp();
    const login = await request(app).post("/auth/login").send({ email: "p5@x.com", password: "propass" });
    const res = await request(app)
      .patch(`/professional/students/${sId}`)
      .set("Authorization", `Bearer ${login.body.access_token}`)
      .send({ full_name: "Nome Novo", phone: "11888", gender: "outro", body_weight_kg: 70.5, height_cm: 175 });
    expect(res.status, JSON.stringify(res.body)).toBe(200);

    const list = await request(app).get("/professional/students").set("Authorization", `Bearer ${login.body.access_token}`);
    const s = list.body.students[0];
    expect(s.full_name).toBe("Nome Novo");
    expect(s.body_weight_kg).toBe(70.5);
    expect(s.height_cm).toBe(175);
  });

  it("rejects invalid gender", async () => {
    const proId = crypto.randomUUID();
    await pool.query(`insert into public.app_users (id, email, password_hash) values ($1, 'p6@x.com', $2)`, [proId, await bcrypt.hash("propass", 12)]);
    await pool.query(`insert into public.profiles (id, tipo, display_name) values ($1, 'personal', 'Pro6')`, [proId]);
    const sId = crypto.randomUUID();
    await pool.query(`insert into public.app_users (id, email, password_hash) values ($1, 's6@x.com', $2)`, [sId, await bcrypt.hash("x", 12)]);
    await pool.query(`insert into public.profiles (id, tipo, display_name) values ($1, 'aluno', 'S6')`, [sId]);
    await pool.query(`insert into public.user_basic_info (user_id, full_name, birth_date) values ($1,'S6','1990-01-01')`, [sId]);
    await pool.query(`insert into public.student_professional_links (student_id, professional_id, professional_role, status) values ($1,$2,'personal','active')`, [sId, proId]);
    const app = createApp();
    const login = await request(app).post("/auth/login").send({ email: "p6@x.com", password: "propass" });
    const res = await request(app).patch(`/professional/students/${sId}`).set("Authorization", `Bearer ${login.body.access_token}`).send({ gender: "x" });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("invalid_body");
  });

  it("toggles link status (revoke then reactivate)", async () => {
    const proId = crypto.randomUUID();
    await pool.query(`insert into public.app_users (id, email, password_hash) values ($1, 'p7@x.com', $2)`, [proId, await bcrypt.hash("propass", 12)]);
    await pool.query(`insert into public.profiles (id, tipo, display_name) values ($1, 'personal', 'Pro7')`, [proId]);
    const sId = crypto.randomUUID();
    await pool.query(`insert into public.app_users (id, email, password_hash) values ($1, 's7@x.com', $2)`, [sId, await bcrypt.hash("x", 12)]);
    await pool.query(`insert into public.profiles (id, tipo, display_name) values ($1, 'aluno', 'S7')`, [sId]);
    await pool.query(`insert into public.user_basic_info (user_id, full_name, birth_date) values ($1,'S7','1990-01-01')`, [sId]);
    await pool.query(`insert into public.student_professional_links (student_id, professional_id, professional_role, status) values ($1,$2,'personal','active')`, [sId, proId]);

    const app = createApp();
    const login = await request(app).post("/auth/login").send({ email: "p7@x.com", password: "propass" });
    const auth = `Bearer ${login.body.access_token}`;

    const revoke = await request(app).patch(`/professional/students/${sId}/status`).set("Authorization", auth).send({ status: "revoked" });
    expect(revoke.status, JSON.stringify(revoke.body)).toBe(200);
    const afterRevoke = await request(app).get("/professional/students").set("Authorization", auth);
    expect(afterRevoke.body.students.length).toBe(0);

    const react = await request(app).patch(`/professional/students/${sId}/status`).set("Authorization", auth).send({ status: "active" });
    expect(react.status).toBe(200);
    const afterReact = await request(app).get("/professional/students").set("Authorization", auth);
    expect(afterReact.body.students.length).toBe(1);
  });
});

