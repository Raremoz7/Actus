import { beforeAll, afterAll, describe, it, expect } from "vitest";
import request from "supertest";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { createApp } from "../src/app.js";
import { closePool, setPoolForTests } from "../src/db.js";
import { createInMemoryPg, minimalSchemaSql } from "./helpers/testDb.js";

describe("Workouts + Diets templates and assignment", () => {
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

  it("personal creates workout with exercises and assigns to linked student", async () => {
    const personalId = crypto.randomUUID();
    const personalHash = await bcrypt.hash("propass", 12);
    await pool.query(`insert into public.app_users (id, email, password_hash) values ($1, 'p3@example.com', $2)`, [
      personalId,
      personalHash,
    ]);
    await pool.query(`insert into public.profiles (id, tipo, display_name) values ($1, 'personal', 'P3')`, [personalId]);

    const studentId = crypto.randomUUID();
    const studentHash = await bcrypt.hash("alunopass", 12);
    await pool.query(`insert into public.app_users (id, email, password_hash) values ($1, 's3@example.com', $2)`, [
      studentId,
      studentHash,
    ]);
    await pool.query(`insert into public.profiles (id, tipo, display_name) values ($1, 'aluno', 'S3')`, [studentId]);
    await pool.query(
      `insert into public.student_professional_links (student_id, professional_id, professional_role, status) values ($1, $2, 'personal', 'active')`,
      [studentId, personalId],
    );

    const app = createApp();
    const login = await request(app).post("/auth/login").send({ email: "p3@example.com", password: "propass" });
    expect(login.status).toBe(200);
    const token = login.body.access_token as string;

    const created = await request(app)
      .post("/workouts")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Treino A",
        exercises: [
          { position: 1, wger_exercise_id: 10, name_snapshot: "Supino", sets: 3, reps: 10, rest_seconds: 60 },
        ],
      });
    expect(created.status, JSON.stringify(created.body)).toBe(201);
    const workoutId = created.body.workout_id as string;

    const assigned = await request(app)
      .post(`/students/${studentId}/workouts`)
      .set("Authorization", `Bearer ${token}`)
      .send({ workout_id: workoutId, weekdays: [1, 3, 5] });
    expect(assigned.status, JSON.stringify(assigned.body)).toBe(201);
  });

  it("nutricionista creates diet template and assigns to linked student", async () => {
    const nutriId = crypto.randomUUID();
    const nutriHash = await bcrypt.hash("nutripass", 12);
    await pool.query(`insert into public.app_users (id, email, password_hash) values ($1, 'n@example.com', $2)`, [
      nutriId,
      nutriHash,
    ]);
    await pool.query(`insert into public.profiles (id, tipo, display_name) values ($1, 'nutricionista', 'N')`, [nutriId]);

    const studentId = crypto.randomUUID();
    const studentHash = await bcrypt.hash("alunopass2", 12);
    await pool.query(`insert into public.app_users (id, email, password_hash) values ($1, 's4@example.com', $2)`, [
      studentId,
      studentHash,
    ]);
    await pool.query(`insert into public.profiles (id, tipo, display_name) values ($1, 'aluno', 'S4')`, [studentId]);
    await pool.query(
      `insert into public.student_professional_links (id, student_id, professional_id, professional_role, status) values ($1, $2, $3, 'nutricionista', 'active')`,
      [crypto.randomUUID(), studentId, nutriId],
    );

    const app = createApp();
    const login = await request(app).post("/auth/login").send({ email: "n@example.com", password: "nutripass" });
    expect(login.status).toBe(200);
    const token = login.body.access_token as string;

    const created = await request(app)
      .post("/diet-templates")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Dieta X", body: { calories: 2000 } });
    expect(created.status, JSON.stringify(created.body)).toBe(201);
    const dietTemplateId = created.body.diet_template_id as string;

    const assigned = await request(app)
      .post(`/students/${studentId}/diets`)
      .set("Authorization", `Bearer ${token}`)
      .send({ diet_template_id: dietTemplateId });
    expect(assigned.status, JSON.stringify(assigned.body)).toBe(201);
  });
});

