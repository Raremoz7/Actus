import { beforeAll, afterAll, describe, it, expect } from "vitest";
import request from "supertest";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { createApp } from "../src/app.js";
import { closePool, setPoolForTests } from "../src/db.js";
import { createInMemoryPg, minimalSchemaSql } from "./helpers/testDb.js";

describe("PATCH / GET novas rotas", () => {
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

  async function staffToken() {
    const hash = await bcrypt.hash("staffpass", 12);
    const id = crypto.randomUUID();
    await pool.query(`insert into public.app_users (id, email, password_hash, must_change_password) values ($1, 'staff-p@example.com', $2, false)`, [
      id,
      hash,
    ]);
    await pool.query(`insert into public.profiles (id, tipo, display_name) values ($1, 'actus_admin', 'Staff')`, [id]);
    await pool.query(`insert into public.app_user_roles (user_id, role) values ($1, 'actus_admin')`, [id]);
    const app = createApp();
    const login = await request(app).post("/auth/login").send({ email: "staff-p@example.com", password: "staffpass" });
    expect(login.status).toBe(200);
    return login.body.access_token as string;
  }

  it("workouts GET + PATCH e diet-templates GET + PATCH", async () => {
    const personalId = crypto.randomUUID();
    await pool.query(`insert into public.app_users (id, email, password_hash) values ($1, 'p@w.com', 'x')`, [personalId]);
    await pool.query(`insert into public.profiles (id, tipo, display_name) values ($1, 'personal', 'P')`, [personalId]);
    const app0 = createApp();
    const login = await request(app0).post("/auth/login").send({ email: "p@w.com", password: "x" });
    expect(login.status).toBe(401);

    const hash = await bcrypt.hash("pw123456", 12);
    await pool.query(`update public.app_users set password_hash = $1 where id = $2`, [hash, personalId]);
    const token = (await request(app0).post("/auth/login").send({ email: "p@w.com", password: "pw123456" })).body.access_token as string;

    const app = createApp();
    const createW = await request(app)
      .post("/workouts")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Treino A",
        exercises: [{ position: 1, wger_exercise_id: 1, name_snapshot: "Agachamento" }],
      });
    expect(createW.status).toBe(201);
    const wid = createW.body.workout_id as string;

    const list = await request(app).get("/workouts").set("Authorization", `Bearer ${token}`);
    expect(list.status).toBe(200);
    expect(list.body.workouts.length).toBe(1);

    const one = await request(app).get(`/workouts/${wid}`).set("Authorization", `Bearer ${token}`);
    expect(one.status).toBe(200);
    expect(one.body.exercises.length).toBe(1);

    const patchW = await request(app).patch(`/workouts/${wid}`).set("Authorization", `Bearer ${token}`).send({ name: "Treino B" });
    expect(patchW.status).toBe(200);
    expect(patchW.body.name).toBe("Treino B");

    const nutriId = crypto.randomUUID();
    const nh = await bcrypt.hash("pw123456", 12);
    await pool.query(`insert into public.app_users (id, email, password_hash) values ($1, 'n@w.com', $2)`, [nutriId, nh]);
    await pool.query(`insert into public.profiles (id, tipo, display_name) values ($1, 'nutricionista', 'N')`, [nutriId]);
    const nt = (await request(app0).post("/auth/login").send({ email: "n@w.com", password: "pw123456" })).body.access_token as string;

    const cd = await request(app).post("/diet-templates").set("Authorization", `Bearer ${nt}`).send({ name: "Dieta 1", body: { k: 1 } });
    expect(cd.status).toBe(201);
    const did = cd.body.diet_template_id as string;

    const dlist = await request(app).get("/diet-templates").set("Authorization", `Bearer ${nt}`);
    expect(dlist.status).toBe(200);
    expect(dlist.body.diet_templates.length).toBe(1);

    const dp = await request(app).patch(`/diet-templates/${did}`).set("Authorization", `Bearer ${nt}`).send({ name: "Dieta 2" });
    expect(dp.status).toBe(200);
    expect(dp.body.name).toBe("Dieta 2");
  });

  it("PATCH student_workouts, student_diets, invites, admin links e professionals", async () => {
    const personalId = crypto.randomUUID();
    const studentId = crypto.randomUUID();
    const ph = await bcrypt.hash("pw123456", 12);
    const sh = await bcrypt.hash("pw123456", 12);
    await pool.query(`insert into public.app_users (id, email, password_hash) values ($1, 'pp@x.com', $2), ($3, 'ss@x.com', $4)`, [
      personalId,
      ph,
      studentId,
      sh,
    ]);
    await pool.query(`insert into public.profiles (id, tipo, display_name) values ($1, 'personal', 'P'), ($2, 'aluno', 'S')`, [
      personalId,
      studentId,
    ]);
    await pool.query(
      `insert into public.user_basic_info (user_id, full_name, birth_date) values ($1, 'S', '1990-01-01')`,
      [studentId],
    );
    const linkPerId = crypto.randomUUID();
    await pool.query(
      `insert into public.student_professional_links (id, student_id, professional_id, professional_role, status) values ($1, $2, $3, 'personal', 'active')`,
      [linkPerId, studentId, personalId],
    );

    const workoutId = crypto.randomUUID();
    await pool.query(
      `insert into public.workouts (id, owner_personal_id, name) values ($1, $2, 'W')`,
      [workoutId, personalId],
    );
    const swId = crypto.randomUUID();
    await pool.query(
      `insert into public.student_workouts (id, student_id, workout_id, weekdays, start_date, is_active) values ($1, $2, $3, '{1,2}', '2026-01-01', true)`,
      [swId, studentId, workoutId],
    );

    const pToken = (await request(createApp()).post("/auth/login").send({ email: "pp@x.com", password: "pw123456" })).body
      .access_token as string;
    const app = createApp();
    const psw = await request(app)
      .patch(`/students/${studentId}/workouts/${swId}`)
      .set("Authorization", `Bearer ${pToken}`)
      .send({ weekdays: [3, 4], is_active: false });
    expect(psw.status).toBe(200);
    expect(psw.body.is_active).toBe(false);

    const nutriId = crypto.randomUUID();
    const nh = await bcrypt.hash("pw123456", 12);
    await pool.query(`insert into public.app_users (id, email, password_hash) values ($1, 'nn@x.com', $2)`, [nutriId, nh]);
    await pool.query(`insert into public.profiles (id, tipo, display_name) values ($1, 'nutricionista', 'N')`, [nutriId]);
    const linkNutriId = crypto.randomUUID();
    await pool.query(
      `insert into public.student_professional_links (id, student_id, professional_id, professional_role, status) values ($1, $2, $3, 'nutricionista', 'active')`,
      [linkNutriId, studentId, nutriId],
    );
    const dtId = crypto.randomUUID();
    await pool.query(`insert into public.diet_templates (id, owner_nutritionist_id, name) values ($1, $2, 'D')`, [dtId, nutriId]);
    const sdId = crypto.randomUUID();
    await pool.query(
      `insert into public.student_diets (id, student_id, diet_template_id, start_date, is_active) values ($1, $2, $3, '2026-01-01', true)`,
      [sdId, studentId, dtId],
    );
    const nToken = (await request(createApp()).post("/auth/login").send({ email: "nn@x.com", password: "pw123456" })).body
      .access_token as string;
    const psd = await request(app).patch(`/students/${studentId}/diets/${sdId}`).set("Authorization", `Bearer ${nToken}`).send({ is_active: false });
    expect(psd.status).toBe(200);

    const invId = crypto.randomUUID();
    await pool.query(
      `insert into public.invites (id, professional_id, code, expires_at, max_uses, used_count) values ($1, $2, 'CODE1', now() + interval '1 day', 5, 1)`,
      [invId, personalId],
    );
    const pinv = await request(app).patch(`/invites/${invId}`).set("Authorization", `Bearer ${pToken}`).send({ max_uses: 10 });
    expect(pinv.status).toBe(200);
    expect(pinv.body.max_uses).toBe(10);

    const personal2Id = crypto.randomUUID();
    const p2h = await bcrypt.hash("pw123456", 12);
    await pool.query(`insert into public.app_users (id, email, password_hash) values ($1, 'p2@x.com', $2)`, [personal2Id, p2h]);
    await pool.query(`insert into public.profiles (id, tipo, display_name) values ($1, 'personal', 'P2')`, [personal2Id]);
    const linkRevId = crypto.randomUUID();
    const linkIns = await pool.query<{ id: string }>(
      `insert into public.student_professional_links (id, student_id, professional_id, professional_role, status) values ($1, $2, $3, 'personal', 'revoked') returning id`,
      [linkRevId, studentId, personal2Id],
    );
    const linkId = linkIns.rows[0]!.id;
    const st = await staffToken();
    const plink = await request(app).patch(`/admin/links/students/${linkId}`).set("Authorization", `Bearer ${st}`).send({ status: "active" });
    expect(plink.status).toBe(409);

    const profPatch = await request(app)
      .patch(`/admin/professionals/${personalId}`)
      .set("Authorization", `Bearer ${st}`)
      .send({ display_name: "Prof Novo" });
    expect(profPatch.status).toBe(200);
    expect(profPatch.body.email).toBe("pp@x.com");
  });

  it("GET e PATCH /admin/staff", async () => {
    const st = await (async () => {
      const hash = await bcrypt.hash("staffpass", 12);
      const id = crypto.randomUUID();
      await pool.query(`insert into public.app_users (id, email, password_hash, must_change_password) values ($1, 'staff-s2@example.com', $2, false)`, [
        id,
        hash,
      ]);
      await pool.query(`insert into public.profiles (id, tipo, display_name) values ($1, 'actus_admin', 'Staff2')`, [id]);
      await pool.query(`insert into public.app_user_roles (user_id, role) values ($1, 'actus_admin')`, [id]);
      await pool.query(
        `insert into public.user_basic_info (user_id, full_name, birth_date) values ($1, 'Staff2', '1990-01-01')`,
        [id],
      );
      const app = createApp();
      const login = await request(app).post("/auth/login").send({ email: "staff-s2@example.com", password: "staffpass" });
      expect(login.status).toBe(200);
      return login.body.access_token as string;
    })();

    const app = createApp();
    const list = await request(app).get("/admin/staff").set("Authorization", `Bearer ${st}`);
    expect(list.status).toBe(200);
    expect(Array.isArray(list.body.staff)).toBe(true);

    const suId = crypto.randomUUID();
    const suh = await bcrypt.hash("pw123456", 12);
    await pool.query(`insert into public.app_users (id, email, password_hash) values ($1, 'su@x.com', $2)`, [suId, suh]);
    await pool.query(`insert into public.profiles (id, tipo, display_name) values ($1, 'actus_suporte', 'Su')`, [suId]);
    await pool.query(`insert into public.app_user_roles (user_id, role) values ($1, 'actus_suporte')`, [suId]);
    await pool.query(`insert into public.user_basic_info (user_id, full_name, birth_date) values ($1, 'Suporte', '1990-01-01')`, [suId]);

    const patchSu = await request(app).patch(`/admin/staff/${suId}`).set("Authorization", `Bearer ${st}`).send({ display_name: "Suporte 2" });
    expect(patchSu.status).toBe(200);
    expect(patchSu.body.staff_roles).toContain("actus_suporte");
  });
});
