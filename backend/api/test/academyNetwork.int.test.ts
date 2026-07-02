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

  it("retorna 404 quando parent_academy_id não corresponde a nenhuma academia", async () => {
    const staff = await staffToken();
    const res = await request(app)
      .post("/admin/academies")
      .set("Authorization", `Bearer ${staff}`)
      .send({ name: "Filial fantasma", network_role: "unit", parent_academy_id: crypto.randomUUID() });
    expect(res.status, JSON.stringify(res.body)).toBe(404);
    expect(res.body.error).toBe("parent_academy_not_found");
  });

  it("rejeita parent_academy_id quando network_role não é unit", async () => {
    const staff = await staffToken();
    const res = await request(app)
      .post("/admin/academies")
      .set("Authorization", `Bearer ${staff}`)
      .send({ name: "X", network_role: "standalone", parent_academy_id: crypto.randomUUID() });
    expect(res.status, JSON.stringify(res.body)).toBe(400);
    expect(res.body.error).toBe("invalid_body");
  });

  it("expõe network_role e parent_academy_id em GET /admin/academies e GET /admin/academies/:id", async () => {
    const staff = await staffToken();

    const hq = await request(app)
      .post("/admin/academies")
      .set("Authorization", `Bearer ${staff}`)
      .send({ name: "Rede Matriz GET", network_role: "network_hq" });
    expect(hq.status, JSON.stringify(hq.body)).toBe(201);

    const unit = await request(app)
      .post("/admin/academies")
      .set("Authorization", `Bearer ${staff}`)
      .send({ name: "Filial GET", network_role: "unit", parent_academy_id: hq.body.id });
    expect(unit.status, JSON.stringify(unit.body)).toBe(201);

    const list = await request(app).get("/admin/academies").set("Authorization", `Bearer ${staff}`);
    expect(list.status, JSON.stringify(list.body)).toBe(200);
    const hqInList = list.body.academies.find((a: any) => a.id === hq.body.id);
    const unitInList = list.body.academies.find((a: any) => a.id === unit.body.id);
    expect(hqInList.network_role).toBe("network_hq");
    expect(hqInList.parent_academy_id).toBeNull();
    expect(unitInList.network_role).toBe("unit");
    expect(unitInList.parent_academy_id).toBe(hq.body.id);

    const hqDetail = await request(app).get(`/admin/academies/${hq.body.id}`).set("Authorization", `Bearer ${staff}`);
    expect(hqDetail.status, JSON.stringify(hqDetail.body)).toBe(200);
    expect(hqDetail.body.academy.network_role).toBe("network_hq");
    expect(hqDetail.body.academy.parent_academy_id).toBeNull();

    const unitDetail = await request(app).get(`/admin/academies/${unit.body.id}`).set("Authorization", `Bearer ${staff}`);
    expect(unitDetail.status, JSON.stringify(unitDetail.body)).toBe(200);
    expect(unitDetail.body.academy.network_role).toBe("unit");
    expect(unitDetail.body.academy.parent_academy_id).toBe(hq.body.id);
  });

  async function createAcademyDirect(
    name: string,
    opts: { networkRole?: "standalone" | "network_hq" | "unit"; parentId?: string } = {},
  ): Promise<string> {
    const staff = await staffToken();
    const res = await request(app)
      .post("/admin/academies")
      .set("Authorization", `Bearer ${staff}`)
      .send({ name, network_role: opts.networkRole ?? "standalone", parent_academy_id: opts.parentId });
    expect(res.status, JSON.stringify(res.body)).toBe(201);
    return res.body.id as string;
  }

  async function createManagerFor(academyId: string): Promise<string> {
    const staff = await staffToken();
    const email = `gestor-${crypto.randomUUID()}@ex.com`;
    const mgr = await request(app)
      .post(`/admin/academies/${academyId}/manager`)
      .set("Authorization", `Bearer ${staff}`)
      .send({ email, password: "senhaforte1", full_name: "Gestor", must_change_password: false });
    expect(mgr.status, JSON.stringify(mgr.body)).toBe(201);
    const login = await request(app).post("/auth/login").send({ email, password: "senhaforte1" });
    return login.body.access_token as string;
  }

  it("gestor da matriz vê o dashboard de rede consolidado das unidades", async () => {
    const hqId = await createAcademyDirect("Rede X", { networkRole: "network_hq" });
    const hqToken = await createManagerFor(hqId);
    const unitAId = await createAcademyDirect("Unidade A", { networkRole: "unit", parentId: hqId });
    const unitBId = await createAcademyDirect("Unidade B", { networkRole: "unit", parentId: hqId });

    const list = await request(app).get("/academy/network").set("Authorization", `Bearer ${hqToken}`);
    expect(list.status, JSON.stringify(list.body)).toBe(200);
    expect(list.body.units.map((u: any) => u.id).sort()).toEqual([unitAId, unitBId].sort());

    const dash = await request(app).get("/academy/network/dashboard").set("Authorization", `Bearer ${hqToken}`);
    expect(dash.status, JSON.stringify(dash.body)).toBe(200);
    expect(dash.body.kpis.total_students).toBe(0);
    expect(dash.body.units).toHaveLength(2);
  });

  it("gestor de uma unidade (não matriz) recebe 403 ao acessar rotas de rede", async () => {
    const hqId = await createAcademyDirect("Rede Y", { networkRole: "network_hq" });
    const unitId = await createAcademyDirect("Unidade Y1", { networkRole: "unit", parentId: hqId });
    const unitToken = await createManagerFor(unitId);

    const res = await request(app).get("/academy/network/dashboard").set("Authorization", `Bearer ${unitToken}`);
    expect(res.status, JSON.stringify(res.body)).toBe(403);
  });

  it("academia standalone recebe 403 ao acessar rotas de rede", async () => {
    const standaloneId = await createAcademyDirect("Academia Solo");
    const token = await createManagerFor(standaloneId);

    const res = await request(app).get("/academy/network/dashboard").set("Authorization", `Bearer ${token}`);
    expect(res.status, JSON.stringify(res.body)).toBe(403);
  });
});
