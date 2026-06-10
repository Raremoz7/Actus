import { beforeAll, afterAll, describe, it, expect } from "vitest";
import request from "supertest";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { createApp } from "../src/app.js";
import { closePool, setPoolForTests } from "../src/db.js";
import { createInMemoryPg, minimalSchemaSql } from "./helpers/testDb.js";

describe("Aluno — programa (me/workouts + me/diets)", () => {
  let pool: import("pg").Pool;

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

  it("fluxo: lista treinos, sessão idempotente, exercícios, conclusão estrita; dietas só leitura; não-aluno recebe 403", async () => {
    const personalId = crypto.randomUUID();
    const nutriId = crypto.randomUUID();
    const studentId = crypto.randomUUID();
    await pool.query(`insert into public.app_users (id, email, password_hash) values ($1, 'msp-p@example.com', $2)`, [
      personalId,
      await bcrypt.hash("msp-pro", 12),
    ]);
    await pool.query(`insert into public.profiles (id, tipo, display_name) values ($1, 'personal', 'MSP-P')`, [personalId]);
    await pool.query(`insert into public.app_users (id, email, password_hash) values ($1, 'msp-n@example.com', $2)`, [
      nutriId,
      await bcrypt.hash("msp-nut", 12),
    ]);
    await pool.query(`insert into public.profiles (id, tipo, display_name) values ($1, 'nutricionista', 'MSP-N')`, [nutriId]);
    await pool.query(`insert into public.app_users (id, email, password_hash) values ($1, 'msp-s@example.com', $2)`, [
      studentId,
      await bcrypt.hash("msp-aluno", 12),
    ]);
    await pool.query(`insert into public.profiles (id, tipo, display_name) values ($1, 'aluno', 'MSP-S')`, [studentId]);
    await pool.query(
      `insert into public.student_professional_links (student_id, professional_id, professional_role, status) values ($1, $2, 'personal', 'active')`,
      [studentId, personalId],
    );
    await pool.query(
      `insert into public.student_professional_links (id, student_id, professional_id, professional_role, status) values ($1, $2, $3, 'nutricionista', 'active')`,
      [crypto.randomUUID(), studentId, nutriId],
    );

    const app = createApp();
    const loginPro = await request(app).post("/auth/login").send({ email: "msp-p@example.com", password: "msp-pro" });
    expect(loginPro.status).toBe(200);
    const tokenPro = loginPro.body.access_token as string;

    const loginNutri = await request(app).post("/auth/login").send({ email: "msp-n@example.com", password: "msp-nut" });
    expect(loginNutri.status).toBe(200);
    const tokenNutri = loginNutri.body.access_token as string;

    const loginStudent = await request(app).post("/auth/login").send({ email: "msp-s@example.com", password: "msp-aluno" });
    expect(loginStudent.status).toBe(200);
    const tokenStudent = loginStudent.body.access_token as string;

    const forb = await request(app).get("/me/workouts").set("Authorization", `Bearer ${tokenPro}`);
    expect(forb.status).toBe(403);
    expect(forb.body.error).toBe("forbidden_not_student");

    const workoutRes = await request(app)
      .post("/workouts")
      .set("Authorization", `Bearer ${tokenPro}`)
      .send({
        name: "MSP Treino",
        exercises: [
          { position: 1, wger_exercise_id: 1, name_snapshot: "A", sets: 3, reps: 10, rest_seconds: 60 },
          { position: 2, wger_exercise_id: 2, name_snapshot: "B", sets: 3, reps: 8, rest_seconds: 90 },
        ],
      });
    expect(workoutRes.status).toBe(201);
    const workoutId = workoutRes.body.workout_id as string;

    const assignRes = await request(app)
      .post(`/students/${studentId}/workouts`)
      .set("Authorization", `Bearer ${tokenPro}`)
      .send({ workout_id: workoutId, weekdays: [1, 3, 5] });
    expect(assignRes.status).toBe(201);
    const studentWorkoutId = assignRes.body.student_workout_id as string;

    const dietTpl = await request(app)
      .post("/diet-templates")
      .set("Authorization", `Bearer ${tokenNutri}`)
      .send({ name: "MSP Dieta", body: { kcal: 2200 } });
    expect(dietTpl.status).toBe(201);
    const dietTemplateId = dietTpl.body.diet_template_id as string;

    const assignDiet = await request(app)
      .post(`/students/${studentId}/diets`)
      .set("Authorization", `Bearer ${tokenNutri}`)
      .send({ diet_template_id: dietTemplateId });
    expect(assignDiet.status).toBe(201);
    const studentDietId = assignDiet.body.student_diet_id as string;

    const listW = await request(app).get("/me/workouts").set("Authorization", `Bearer ${tokenStudent}`);
    expect(listW.status).toBe(200);
    expect(listW.body.student_workouts).toHaveLength(1);
    expect(listW.body.student_workouts[0].id).toBe(studentWorkoutId);

    const detail = await request(app).get(`/me/workouts/${studentWorkoutId}`).set("Authorization", `Bearer ${tokenStudent}`);
    expect(detail.status).toBe(200);
    expect(detail.body.workout.exercises).toHaveLength(2);
    const we1 = detail.body.workout.exercises[0].id as string;
    const we2 = detail.body.workout.exercises[1].id as string;

    const scheduledFor = "2026-05-04";
    const postSess = await request(app)
      .post(`/me/workouts/${studentWorkoutId}/sessions`)
      .set("Authorization", `Bearer ${tokenStudent}`)
      .send({ scheduled_for_date: scheduledFor });
    expect(postSess.status).toBe(200);
    const sessionId = postSess.body.session.id as string;
    expect(postSess.body.exercises).toHaveLength(2);

    const postAgain = await request(app)
      .post(`/me/workouts/${studentWorkoutId}/sessions`)
      .set("Authorization", `Bearer ${tokenStudent}`)
      .send({ scheduled_for_date: scheduledFor });
    expect(postAgain.status).toBe(200);
    expect(postAgain.body.session.id).toBe(sessionId);

    const scheduledPartial = "2026-05-06";
    const postPartial = await request(app)
      .post(`/me/workouts/${studentWorkoutId}/sessions`)
      .set("Authorization", `Bearer ${tokenStudent}`)
      .send({ scheduled_for_date: scheduledPartial });
    expect(postPartial.status).toBe(200);
    const sessionPartialId = postPartial.body.session.id as string;

    const putSets = await request(app)
      .put(`/me/workouts/sessions/${sessionPartialId}/exercises/${we1}/sets`)
      .set("Authorization", `Bearer ${tokenStudent}`)
      .send({ sets: [{ set_index: 1, weight_kg: 50, reps_done: 10, rest_seconds_actual: 60 }] });
    expect(putSets.status).toBe(200);
    expect(putSets.body.exercises[0].sets_logged.length).toBe(1);

    const partialPatch = await request(app)
      .patch(`/me/workouts/sessions/${sessionPartialId}`)
      .set("Authorization", `Bearer ${tokenStudent}`)
      .send({ status: "completed_partial" });
    expect(partialPatch.status).toBe(200);
    expect(partialPatch.body.session.status).toBe("completed_partial");

    const finishAgain = await request(app)
      .post(`/me/workouts/sessions/${sessionPartialId}/finish`)
      .set("Authorization", `Bearer ${tokenStudent}`)
      .send({ with_check_in: true });
    expect(finishAgain.status).toBe(200);
    expect(finishAgain.body.summary?.share?.layout).toBe("strava_style_v1");
    expect(finishAgain.body.summary?.has_load_data).toBe(true);

    const ciDup = await request(app)
      .post("/me/check-ins")
      .set("Authorization", `Bearer ${tokenStudent}`)
      .send({ check_in_date: scheduledPartial });
    expect(ciDup.status).toBe(201);
    const ckRows = await pool.query<{ c: string }>(
      `select count(*)::text as c from public.check_ins where student_id = $1 and check_in_date = $2::date`,
      [studentId, scheduledPartial],
    );
    expect(Number(ckRows.rows[0]?.c)).toBe(1);

    const ciNew = await request(app)
      .post("/me/check-ins")
      .set("Authorization", `Bearer ${tokenStudent}`)
      .send({ check_in_date: "2026-05-07" });
    expect(ciNew.status).toBe(201);
    expect(ciNew.body.created).toBe(true);

    const listCi = await request(app).get("/me/check-ins").set("Authorization", `Bearer ${tokenStudent}`);
    expect(listCi.status).toBe(200);
    expect(Array.isArray(listCi.body.check_ins)).toBe(true);
    expect(listCi.body.check_ins.length).toBeGreaterThanOrEqual(2);
    const ciDates = listCi.body.check_ins.map((c: { check_in_date: string }) => c.check_in_date);
    expect(ciDates).toContain("2026-05-07");
    expect(ciDates).toContain(scheduledPartial);

    const listCiPro = await request(app)
      .get(`/professional/students/${studentId}/check-ins`)
      .set("Authorization", `Bearer ${tokenPro}`);
    expect(listCiPro.status).toBe(200);
    expect(listCiPro.body.student_id).toBe(studentId);
    expect(Array.isArray(listCiPro.body.check_ins)).toBe(true);
    expect(listCiPro.body.check_ins.length).toBeGreaterThanOrEqual(2);

    const listCiNutri = await request(app)
      .get(`/professional/students/${studentId}/check-ins`)
      .set("Authorization", `Bearer ${tokenNutri}`);
    expect(listCiNutri.status).toBe(200);

    const listCiForbidden = await request(app).get("/me/check-ins").set("Authorization", `Bearer ${tokenPro}`);
    expect(listCiForbidden.status).toBe(403);

    const badSessionCheckIn = await request(app)
      .post("/me/check-ins")
      .set("Authorization", `Bearer ${tokenStudent}`)
      .send({ check_in_date: "2026-04-01", workout_session_id: crypto.randomUUID() });
    expect(badSessionCheckIn.status).toBe(400);
    expect(badSessionCheckIn.body.error).toBe("workout_session_not_found");

    const badUuid = await request(app)
      .get("/professional/students/00000000-0000-4000-8000-000000000000/check-ins")
      .set("Authorization", `Bearer ${tokenPro}`);
    expect(badUuid.status).toBe(404);
    expect(badUuid.body.error).toBe("student_not_linked");

    const badDay = await request(app)
      .post(`/me/workouts/${studentWorkoutId}/sessions`)
      .set("Authorization", `Bearer ${tokenStudent}`)
      .send({ scheduled_for_date: "2026-05-05" });
    expect(badDay.status).toBe(200);
    expect(badDay.body.schedule_hint?.matches_planned_weekdays).toBe(false);
    expect(badDay.body.session.scheduled_for_date).toBe("2026-05-05");

    const startMark = await request(app)
      .post(`/me/workouts/sessions/${sessionId}/start`)
      .set("Authorization", `Bearer ${tokenStudent}`)
      .send({});
    expect(startMark.status).toBe(200);

    const completeEarly = await request(app)
      .patch(`/me/workouts/sessions/${sessionId}`)
      .set("Authorization", `Bearer ${tokenStudent}`)
      .send({ status: "completed" });
    expect(completeEarly.status).toBe(400);
    expect(completeEarly.body.error).toBe("session_exercises_incomplete");

    const p1 = await request(app)
      .patch(`/me/workouts/sessions/${sessionId}/exercises/${we1}`)
      .set("Authorization", `Bearer ${tokenStudent}`)
      .send({ completed: true });
    expect(p1.status).toBe(200);
    expect(p1.body.exercises.find((e: any) => e.workout_exercise_id === we1).completed).toBe(true);

    const completeStill = await request(app)
      .patch(`/me/workouts/sessions/${sessionId}`)
      .set("Authorization", `Bearer ${tokenStudent}`)
      .send({ status: "completed" });
    expect(completeStill.status).toBe(400);

    const p2 = await request(app)
      .patch(`/me/workouts/sessions/${sessionId}/exercises/${we2}`)
      .set("Authorization", `Bearer ${tokenStudent}`)
      .send({ completed: true });
    expect(p2.status).toBe(200);

    const done = await request(app)
      .post(`/me/workouts/sessions/${sessionId}/finish`)
      .set("Authorization", `Bearer ${tokenStudent}`)
      .send({});
    expect(done.status).toBe(200);
    expect(done.body.session.status).toBe("completed");
    expect(done.body.summary?.estimated_calories_kcal).toBeGreaterThanOrEqual(0);

    const getSess = await request(app).get(`/me/workouts/sessions/${sessionId}`).set("Authorization", `Bearer ${tokenStudent}`);
    expect(getSess.status).toBe(200);
    expect(getSess.body.session.status).toBe("completed");

    const profAfter = await pool.query<{ total_workouts_completed: number }>(
      `select total_workouts_completed from public.profiles where id = $1`,
      [studentId],
    );
    expect(profAfter.rows[0]?.total_workouts_completed).toBe(0);

    const dietsList = await request(app).get("/me/diets").set("Authorization", `Bearer ${tokenStudent}`);
    expect(dietsList.status).toBe(200);
    expect(dietsList.body.diets.some((d: any) => d.id === studentDietId)).toBe(true);

    const dietDetail = await request(app).get(`/me/diets/${studentDietId}`).set("Authorization", `Bearer ${tokenStudent}`);
    expect(dietDetail.status).toBe(200);
    expect(dietDetail.body.template_name).toBe("MSP Dieta");
    expect(dietDetail.body.template_body).toEqual({ kcal: 2200 });
  });
});
