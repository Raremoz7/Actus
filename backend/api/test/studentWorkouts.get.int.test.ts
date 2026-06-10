// [ACTUS-NEW] A1 — GET /students/:student_id/workouts (visão do profissional). pg-mem.
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import request from "supertest";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { createApp } from "../src/app.js";
import { closePool, setPoolForTests } from "../src/db.js";
import { createInMemoryPg, minimalSchemaSql } from "./helpers/testDb.js";

describe("A1 — GET /students/:student_id/workouts", () => {
  let pool: any;
  let app: any;
  const personalId = crypto.randomUUID(); // vinculado
  const otherId = crypto.randomUUID(); // personal NÃO vinculado
  const alunoId = crypto.randomUUID();

  beforeAll(async () => {
    const mem = createInMemoryPg();
    pool = mem.pool;
    setPoolForTests(pool);
    process.env.JWT_ACCESS_SECRET = "test-secret";
    process.env.NODE_ENV = "test";
    process.env.REFRESH_TOKEN_TTL_DAYS = "30";
    process.env.DEFAULT_MAX_ACTIVE_INVITES = "20";
    await pool.query(minimalSchemaSql);

    async function mkUser(id: string, email: string, tipo: string, pass: string) {
      const h = await bcrypt.hash(pass, 12);
      await pool.query(`insert into public.app_users (id, email, password_hash) values ($1, $2, $3)`, [id, email, h]);
      await pool.query(`insert into public.profiles (id, tipo, display_name) values ($1, $2::public.user_role, $3)`, [id, tipo, tipo]);
    }
    await mkUser(personalId, "p1@ex.com", "personal", "p1pass");
    await mkUser(otherId, "p2@ex.com", "personal", "p2pass");
    await mkUser(alunoId, "a@ex.com", "aluno", "alpass");
    await pool.query(
      `insert into public.student_professional_links (student_id, professional_id, professional_role, status) values ($1, $2, 'personal', 'active')`,
      [alunoId, personalId],
    );
    app = createApp();
  });

  afterAll(async () => {
    await closePool();
  });

  async function token(email: string, password: string): Promise<string> {
    const r = await request(app).post("/auth/login").send({ email, password });
    expect(r.status, JSON.stringify(r.body)).toBe(200);
    return r.body.access_token;
  }

  it("lista as atribuições do aluno para o profissional vinculado", async () => {
    const t = await token("p1@ex.com", "p1pass");

    const w = await request(app)
      .post("/workouts")
      .set("Authorization", `Bearer ${t}`)
      .send({
        name: "Treino A",
        exercises: [{ position: 1, wger_exercise_id: 73, name_snapshot: "Supino", sets: 4, reps: 10, rest_seconds: 90 }],
      });
    expect(w.status, JSON.stringify(w.body)).toBe(201);

    const assign = await request(app)
      .post(`/students/${alunoId}/workouts`)
      .set("Authorization", `Bearer ${t}`)
      .send({ workout_id: w.body.workout_id, weekdays: [1, 3, 5] });
    expect(assign.status, JSON.stringify(assign.body)).toBe(201);

    const res = await request(app).get(`/students/${alunoId}/workouts`).set("Authorization", `Bearer ${t}`);
    expect(res.status, JSON.stringify(res.body)).toBe(200);
    expect(res.body.student_workouts).toHaveLength(1);
    const sw = res.body.student_workouts[0];
    expect(sw.workout_name).toBe("Treino A");
    expect(sw.weekdays).toEqual([1, 3, 5]);
    expect(sw.exercise_count).toBe(1);
    expect(sw.is_active).toBe(true);
    expect(sw.start_date === null || /^\d{4}-\d{2}-\d{2}$/.test(sw.start_date)).toBe(true);
  });

  it("profissional NÃO vinculado recebe 403 student_not_linked", async () => {
    const t = await token("p2@ex.com", "p2pass");
    const res = await request(app).get(`/students/${alunoId}/workouts`).set("Authorization", `Bearer ${t}`);
    expect(res.status).toBe(403);
    expect(res.body.error).toBe("student_not_linked");
  });

  it("aluno (não-personal) recebe 403 only_personal", async () => {
    const t = await token("a@ex.com", "alpass");
    const res = await request(app).get(`/students/${alunoId}/workouts`).set("Authorization", `Bearer ${t}`);
    expect(res.status).toBe(403);
    expect(res.body.error).toBe("only_personal");
  });
});
