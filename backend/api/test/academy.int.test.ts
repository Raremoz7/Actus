import { beforeAll, afterAll, describe, it, expect } from "vitest";
import request from "supertest";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { createApp } from "../src/app.js";
import { closePool, setPoolForTests } from "../src/db.js";
import { createInMemoryPg, minimalSchemaSql } from "./helpers/testDb.js";

describe("Academia (módulo)", () => {
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

  async function createPersonal(name = "Personal"): Promise<{ id: string; email: string; token: string }> {
    const email = `personal-${crypto.randomUUID()}@ex.com`;
    const hash = await bcrypt.hash("personalpw", 12);
    const ins = await pool.query<{ id: string }>(
      `insert into public.app_users (email, password_hash, must_change_password) values ($1, $2, false) returning id`,
      [email, hash],
    );
    const id = ins.rows[0]!.id;
    await pool.query(`insert into public.profiles (id, tipo, display_name) values ($1, 'personal', $2)`, [id, name]);
    const login = await request(app).post("/auth/login").send({ email, password: "personalpw" });
    return { id, email, token: login.body.access_token as string };
  }

  async function createStudentLinkedTo(personalId: string, checkInDaysAgo: number[] = []): Promise<string> {
    const email = `aluno-${crypto.randomUUID()}@ex.com`;
    const hash = await bcrypt.hash("alunopw", 12);
    const ins = await pool.query<{ id: string }>(
      `insert into public.app_users (email, password_hash) values ($1, $2) returning id`,
      [email, hash],
    );
    const id = ins.rows[0]!.id;
    await pool.query(`insert into public.profiles (id, tipo, display_name) values ($1, 'aluno', 'Aluno')`, [id]);
    await pool.query(
      `insert into public.student_professional_links (student_id, professional_id, professional_role, status)
       values ($1, $2, 'personal', 'active')`,
      [id, personalId],
    );
    for (const d of checkInDaysAgo) {
      const date = new Date();
      date.setUTCDate(date.getUTCDate() - d);
      await pool.query(`insert into public.check_ins (student_id, check_in_date, source) values ($1, $2::date, 'app')`, [
        id,
        date.toISOString().slice(0, 10),
      ]);
    }
    return id;
  }

  async function createAcademyWithManager(): Promise<{ academyId: string; gtoken: string }> {
    const staff = await staffToken();
    const ac = await request(app)
      .post("/admin/academies")
      .set("Authorization", `Bearer ${staff}`)
      .send({ name: `Ac-${crypto.randomUUID()}` });
    expect(ac.status, JSON.stringify(ac.body)).toBe(201);
    const academyId = ac.body.id as string;
    const email = `gestor-${crypto.randomUUID()}@ex.com`;
    const mgr = await request(app)
      .post(`/admin/academies/${academyId}/manager`)
      .set("Authorization", `Bearer ${staff}`)
      .send({ email, password: "gestorpw1", full_name: "Gestor Teste", must_change_password: false });
    expect(mgr.status, JSON.stringify(mgr.body)).toBe(201);
    const login = await request(app).post("/auth/login").send({ email, password: "gestorpw1" });
    expect(login.status).toBe(200);
    return { academyId, gtoken: login.body.access_token as string };
  }

  it("admin cria academia, designa gestor (tipo='gestor') e o gestor acessa o dashboard vazio", async () => {
    const { gtoken } = await createAcademyWithManager();
    const dash = await request(app).get("/academy/dashboard").set("Authorization", `Bearer ${gtoken}`);
    expect(dash.status, JSON.stringify(dash.body)).toBe(200);
    expect(dash.body.kpis.instructors).toBe(0);
    expect(dash.body.kpis.total_students).toBe(0);
    expect(dash.body.kpis.adherence_7d_pct).toBeNull();
  });

  it("gestor vincula instrutor e vê alunos agregados no dashboard e em /students", async () => {
    const { gtoken } = await createAcademyWithManager();
    const personal = await createPersonal("Instrutor A");
    await createStudentLinkedTo(personal.id, [1]); // ativo (1 dia atrás)
    await createStudentLinkedTo(personal.id, [20]); // inativo nos 7d, ativo nos 30d

    const link = await request(app)
      .post("/academy/members/instructors")
      .set("Authorization", `Bearer ${gtoken}`)
      .send({ email: personal.email });
    expect(link.status, JSON.stringify(link.body)).toBe(201);

    const dash = await request(app).get("/academy/dashboard").set("Authorization", `Bearer ${gtoken}`);
    expect(dash.body.kpis.instructors).toBe(1);
    expect(dash.body.kpis.total_students).toBe(2);
    expect(dash.body.kpis.active_students_7d).toBe(1);
    expect(dash.body.kpis.check_ins_30d).toBe(2);
    expect(dash.body.instructor_ranking[0].student_count).toBe(2);

    const studs = await request(app).get("/academy/students").set("Authorization", `Bearer ${gtoken}`);
    expect(studs.status).toBe(200);
    expect(studs.body.students.length).toBe(2);
  });

  it("comissão: regra percent + base manual → relatório calculado, e marcar pago zera o devido", async () => {
    const { gtoken } = await createAcademyWithManager();
    const personal = await createPersonal("Instrutor B");
    await createStudentLinkedTo(personal.id);
    await createStudentLinkedTo(personal.id);
    await request(app)
      .post("/academy/members/instructors")
      .set("Authorization", `Bearer ${gtoken}`)
      .send({ email: personal.email });

    const rule = await request(app)
      .post("/academy/commissions/rules")
      .set("Authorization", `Bearer ${gtoken}`)
      .send({ instructor_user_id: personal.id, rule_type: "percent", percent: 10 });
    expect(rule.status, JSON.stringify(rule.body)).toBe(201);

    const period = new Date().toISOString().slice(0, 7);
    const base = await request(app)
      .post("/academy/commissions/base")
      .set("Authorization", `Bearer ${gtoken}`)
      .send({ instructor_user_id: personal.id, period, amount_cents: 100000 });
    expect(base.status, JSON.stringify(base.body)).toBe(201);

    const report = await request(app)
      .get(`/academy/commissions/report?period=${period}`)
      .set("Authorization", `Bearer ${gtoken}`);
    expect(report.status, JSON.stringify(report.body)).toBe(200);
    const row = report.body.rows.find((r: any) => r.instructor_user_id === personal.id);
    expect(row.base_cents).toBe(100000);
    expect(row.commission_cents).toBe(10000); // 10% de R$ 1000,00
    expect(row.status).toBe("pending");
    expect(report.body.totals.due_cents).toBe(10000);

    const payout = await request(app)
      .post("/academy/commissions/payouts")
      .set("Authorization", `Bearer ${gtoken}`)
      .send({ instructor_user_id: personal.id, period, status: "paid", amount_cents: 10000 });
    expect(payout.status).toBe(200);

    const report2 = await request(app)
      .get(`/academy/commissions/report?period=${period}`)
      .set("Authorization", `Bearer ${gtoken}`);
    const row2 = report2.body.rows.find((r: any) => r.instructor_user_id === personal.id);
    expect(row2.status).toBe("paid");
    expect(report2.body.totals.due_cents).toBe(0);
  });

  it("comissão fixed_per_student multiplica pelo nº de alunos", async () => {
    const { gtoken } = await createAcademyWithManager();
    const personal = await createPersonal("Instrutor C");
    await createStudentLinkedTo(personal.id);
    await createStudentLinkedTo(personal.id);
    await createStudentLinkedTo(personal.id);
    await request(app)
      .post("/academy/members/instructors")
      .set("Authorization", `Bearer ${gtoken}`)
      .send({ email: personal.email });

    await request(app)
      .post("/academy/commissions/rules")
      .set("Authorization", `Bearer ${gtoken}`)
      .send({ instructor_user_id: personal.id, rule_type: "fixed_per_student", amount_cents: 5000 });

    const period = new Date().toISOString().slice(0, 7);
    const report = await request(app)
      .get(`/academy/commissions/report?period=${period}`)
      .set("Authorization", `Bearer ${gtoken}`);
    const row = report.body.rows.find((r: any) => r.instructor_user_id === personal.id);
    expect(row.commission_cents).toBe(15000); // 3 alunos × R$ 50,00
  });

  it("fluxo autônomo permanece isolado: aluno de personal autônomo não vaza para academia", async () => {
    const autonomous = await createPersonal("Autônomo");
    await createStudentLinkedTo(autonomous.id, [1]);

    const { gtoken } = await createAcademyWithManager();
    const dash = await request(app).get("/academy/dashboard").set("Authorization", `Bearer ${gtoken}`);
    expect(dash.body.kpis.total_students).toBe(0); // sem instrutores, nenhum aluno agregado

    // E o personal autônomo continua com seu próprio dashboard funcional.
    const overview = await request(app)
      .get("/professional/dashboard/overview")
      .set("Authorization", `Bearer ${autonomous.token}`);
    expect(overview.status, JSON.stringify(overview.body)).toBe(200);
    expect(overview.body.total_students).toBe(1);
    expect(overview.body.active_students_7d).toBe(1);
  });

  it("personal sem vínculo de academia recebe 403 no painel do gestor", async () => {
    const personal = await createPersonal("Sem academia");
    const res = await request(app).get("/academy/dashboard").set("Authorization", `Bearer ${personal.token}`);
    expect(res.status).toBe(403);
    expect(res.body.error).toBe("forbidden_not_academy_manager");
  });
});
