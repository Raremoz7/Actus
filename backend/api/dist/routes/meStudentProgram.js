import { Router } from "express";
import { z } from "zod";
import { authedUserId } from "../middleware/requireAuth.js";
import { withTx } from "../db.js";
import { uuid } from "../crypto.js";
import { buildWorkoutFinishSummary } from "../services/studentWorkoutSummary.js";
const router = Router();
/** ISO-8601 weekday: 1 = segunda … 7 = domingo (alinha a student_workouts.weekdays). */
export function isoWeekdayFromDateOnly(dateStr) {
    const [y, m, d] = dateStr.split("-").map(Number);
    if (!y || !m || !d)
        return NaN;
    const dt = new Date(Date.UTC(y, m - 1, d));
    const dow = dt.getUTCDay();
    return dow === 0 ? 7 : dow;
}
const createSessionSchema = z.object({
    scheduled_for_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});
const patchSessionExerciseSchema = z.object({
    completed: z.literal(true),
});
const patchSessionSchema = z.object({
    status: z.enum(["completed", "completed_partial", "abandoned", "in_progress"]),
});
const putSessionExerciseSetsSchema = z.object({
    sets: z
        .array(z.object({
        set_index: z.number().int().min(1).max(50),
        weight_kg: z.number().min(0).max(800).nullable().optional(),
        reps_done: z.number().int().min(0).max(1000).nullable().optional(),
        rest_seconds_actual: z.number().int().min(0).max(7200).nullable().optional(),
    }))
        .max(50),
});
const finishSessionSchema = z.object({
    /** Se true, encerra como `completed_partial` mesmo com exercícios pendentes. */
    early_finish: z.boolean().optional().default(false),
    /** Grava check-in do dia (idempotente por data local do aluno). */
    with_check_in: z.boolean().optional().default(true),
});
const postCheckInSchema = z.object({
    check_in_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    workout_session_id: z.string().uuid().optional().nullable(),
});
router.get("/diets", async (req, res) => {
    const studentId = authedUserId(req);
    try {
        const rows = await withTx(async (client) => {
            const q = await client.query(`
        select
          sd.id,
          sd.diet_template_id,
          sd.start_date,
          sd.is_active,
          sd.created_at,
          dt.name as template_name,
          dt.body as template_body
        from public.student_diets sd
        join public.diet_templates dt on dt.id = sd.diet_template_id
        where sd.student_id = $1
        order by sd.created_at desc
        limit 500
        `, [studentId]);
            return q.rows;
        });
        const diets = rows.map((r) => ({
            id: r.id,
            diet_template_id: r.diet_template_id,
            start_date: formatDateOnly(r.start_date),
            is_active: r.is_active,
            created_at: toIso(r.created_at),
            template_name: r.template_name,
            template_body: r.template_body,
        }));
        return res.json({ diets });
    }
    catch {
        return res.status(500).json({ error: "internal_error" });
    }
});
router.get("/diets/:student_diet_id", async (req, res) => {
    const studentId = authedUserId(req);
    const sdId = req.params.student_diet_id;
    if (!z.string().uuid().safeParse(sdId).success)
        return res.status(400).json({ error: "invalid_params" });
    try {
        const row = await withTx(async (client) => {
            const q = await client.query(`
        select
          sd.id,
          sd.diet_template_id,
          sd.start_date,
          sd.is_active,
          sd.created_at,
          sd.updated_at,
          dt.name as template_name,
          dt.body as template_body
        from public.student_diets sd
        join public.diet_templates dt on dt.id = sd.diet_template_id
        where sd.id = $1 and sd.student_id = $2
        `, [sdId, studentId]);
            return q.rows[0] ?? null;
        });
        if (!row)
            return res.status(404).json({ error: "student_diet_not_found" });
        return res.json({
            id: row.id,
            diet_template_id: row.diet_template_id,
            start_date: formatDateOnly(row.start_date),
            is_active: row.is_active,
            created_at: toIso(row.created_at),
            updated_at: toIso(row.updated_at),
            template_name: row.template_name,
            template_body: row.template_body,
        });
    }
    catch {
        return res.status(500).json({ error: "internal_error" });
    }
});
router.get("/workouts/sessions/:session_id", async (req, res) => {
    const studentId = authedUserId(req);
    const sessionId = req.params.session_id;
    if (!z.string().uuid().safeParse(sessionId).success)
        return res.status(400).json({ error: "invalid_params" });
    try {
        const payload = await loadSessionPayload(studentId, sessionId);
        if (!payload)
            return res.status(404).json({ error: "workout_session_not_found" });
        return res.json(payload);
    }
    catch {
        return res.status(500).json({ error: "internal_error" });
    }
});
router.patch("/workouts/sessions/:session_id/exercises/:workout_exercise_id", async (req, res) => {
    const studentId = authedUserId(req);
    const sessionId = req.params.session_id;
    const workoutExerciseId = req.params.workout_exercise_id;
    if (!z.string().uuid().safeParse(sessionId).success || !z.string().uuid().safeParse(workoutExerciseId).success) {
        return res.status(400).json({ error: "invalid_params" });
    }
    const parsed = patchSessionExerciseSchema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: "invalid_body", details: parsed.error.flatten() });
    try {
        const out = await withTx(async (client) => {
            const sQ = await client.query(`
        select ws.status::text as status
        from public.workout_sessions ws
        where ws.id = $1 and ws.student_id = $2
        for update
        `, [sessionId, studentId]);
            const st = sQ.rows[0]?.status;
            if (!st)
                return { ok: false, error: "session_not_found" };
            if (st !== "in_progress")
                return { ok: false, error: "session_not_editable" };
            const exQ = await client.query(`
        select se.id as sid
        from public.session_exercises se
        join public.workout_sessions ws on ws.id = se.session_id
        join public.student_workouts sw on sw.id = ws.student_workout_id
        join public.workout_exercises we on we.id = se.workout_exercise_id
        where se.session_id = $1 and se.workout_exercise_id = $2 and sw.student_id = $3 and we.workout_id = sw.workout_id
        `, [sessionId, workoutExerciseId, studentId]);
            if (!exQ.rowCount)
                return { ok: false, error: "session_exercise_not_found" };
            await client.query(`update public.session_exercises set completed = true, completed_at = now() where session_id = $1 and workout_exercise_id = $2`, [sessionId, workoutExerciseId]);
            return { ok: true };
        });
        if (!out.ok) {
            if (out.error === "session_not_found")
                return res.status(404).json({ error: out.error });
            if (out.error === "session_not_editable")
                return res.status(409).json({ error: out.error });
            return res.status(404).json({ error: out.error });
        }
        const payload = await withTx((client) => loadSessionPayloadTx(client, studentId, sessionId));
        if (!payload)
            return res.status(404).json({ error: "workout_session_not_found" });
        return res.json(payload);
    }
    catch {
        return res.status(500).json({ error: "internal_error" });
    }
});
router.patch("/workouts/sessions/:session_id", async (req, res) => {
    const studentId = authedUserId(req);
    const sessionId = req.params.session_id;
    if (!z.string().uuid().safeParse(sessionId).success)
        return res.status(400).json({ error: "invalid_params" });
    const parsed = patchSessionSchema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: "invalid_body", details: parsed.error.flatten() });
    const nextStatus = parsed.data.status;
    try {
        const out = await withTx(async (client) => {
            const sQ = await client.query(`select status::text as status from public.workout_sessions where id = $1 and student_id = $2 for update`, [sessionId, studentId]);
            const cur = sQ.rows[0]?.status;
            if (!cur)
                return { ok: false, error: "session_not_found" };
            if (nextStatus === "in_progress") {
                if (cur !== "abandoned")
                    return { ok: false, error: "invalid_session_transition" };
                await client.query(`update public.workout_sessions set status = 'in_progress'::public.workout_session_status, completed_at = null, updated_at = now() where id = $1`, [sessionId]);
                return { ok: true };
            }
            if (nextStatus === "abandoned") {
                if (cur !== "in_progress")
                    return { ok: false, error: "invalid_session_transition" };
                await client.query(`update public.workout_sessions set status = 'abandoned'::public.workout_session_status, updated_at = now() where id = $1`, [sessionId]);
                return { ok: true };
            }
            if (nextStatus === "completed_partial") {
                if (cur !== "in_progress")
                    return { ok: false, error: "invalid_session_transition" };
                await client.query(`update public.workout_sessions set status = 'completed_partial'::public.workout_session_status, completed_at = now(), updated_at = now() where id = $1`, [sessionId]);
                return { ok: true };
            }
            if (nextStatus === "completed") {
                if (cur !== "in_progress")
                    return { ok: false, error: "invalid_session_transition" };
                const pending = await client.query(`select 1 from public.session_exercises where session_id = $1 and completed = false limit 1`, [sessionId]);
                if (pending.rowCount && pending.rowCount > 0) {
                    return { ok: false, error: "session_exercises_incomplete" };
                }
                await client.query(`update public.workout_sessions set status = 'completed'::public.workout_session_status, completed_at = now(), updated_at = now() where id = $1`, [sessionId]);
                return { ok: true };
            }
            return { ok: false, error: "invalid_session_transition" };
        });
        if (!out.ok) {
            switch (out.error) {
                case "session_not_found":
                    return res.status(404).json({ error: out.error });
                case "session_exercises_incomplete":
                    return res.status(400).json({ error: out.error });
                case "invalid_session_transition":
                    return res.status(409).json({ error: out.error });
            }
        }
        const payload = await withTx((client) => loadSessionPayloadTx(client, studentId, sessionId));
        if (!payload)
            return res.status(404).json({ error: "workout_session_not_found" });
        return res.json(payload);
    }
    catch {
        return res.status(500).json({ error: "internal_error" });
    }
});
/** Marca início efetivo do treino (atualiza `started_at`). */
router.post("/workouts/sessions/:session_id/start", async (req, res) => {
    const studentId = authedUserId(req);
    const sessionId = req.params.session_id;
    if (!z.string().uuid().safeParse(sessionId).success)
        return res.status(400).json({ error: "invalid_params" });
    try {
        const out = await withTx(async (client) => {
            const sQ = await client.query(`select status::text as status from public.workout_sessions where id = $1 and student_id = $2 for update`, [sessionId, studentId]);
            const st = sQ.rows[0]?.status;
            if (!st)
                return { ok: false, error: "session_not_found" };
            if (st !== "in_progress")
                return { ok: false, error: "session_not_startable" };
            await client.query(`update public.workout_sessions set started_at = now(), updated_at = now() where id = $1`, [sessionId]);
            return { ok: true };
        });
        if (!out.ok) {
            if (out.error === "session_not_found")
                return res.status(404).json({ error: out.error });
            return res.status(409).json({ error: out.error });
        }
        const payload = await withTx((client) => loadSessionPayloadTx(client, studentId, sessionId));
        if (!payload)
            return res.status(404).json({ error: "workout_session_not_found" });
        return res.json(payload);
    }
    catch {
        return res.status(500).json({ error: "internal_error" });
    }
});
/** Finaliza sessão + check-in opcional + resumo (calorias, volume, share DTO). Idempotente se já finalizada. */
router.post("/workouts/sessions/:session_id/finish", async (req, res) => {
    const studentId = authedUserId(req);
    const sessionId = req.params.session_id;
    if (!z.string().uuid().safeParse(sessionId).success)
        return res.status(400).json({ error: "invalid_params" });
    const parsed = finishSessionSchema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: "invalid_body", details: parsed.error.flatten() });
    const { early_finish, with_check_in } = parsed.data;
    try {
        const summaryMeta = await withTx(async (client) => {
            const sQ = await client.query(`
        select status::text as status, student_workout_id, scheduled_for_date
        from public.workout_sessions
        where id = $1 and student_id = $2
        for update
        `, [sessionId, studentId]);
            const row = sQ.rows[0];
            if (!row)
                return { ok: false, error: "session_not_found" };
            const terminal = row.status === "completed" || row.status === "completed_partial";
            if (!terminal) {
                if (row.status !== "in_progress")
                    return { ok: false, error: "session_not_finishable" };
                if (early_finish) {
                    await client.query(`update public.workout_sessions set status = 'completed_partial'::public.workout_session_status, completed_at = now(), updated_at = now() where id = $1`, [sessionId]);
                }
                else {
                    const pending = await client.query(`select 1 from public.session_exercises where session_id = $1 and completed = false limit 1`, [sessionId]);
                    if (pending.rowCount && pending.rowCount > 0) {
                        return { ok: false, error: "session_exercises_incomplete" };
                    }
                    await client.query(`update public.workout_sessions set status = 'completed'::public.workout_session_status, completed_at = now(), updated_at = now() where id = $1`, [sessionId]);
                }
            }
            if (with_check_in) {
                const d = formatDateOnly(row.scheduled_for_date) ?? (await studentLocalDateString(client, studentId));
                await insertStudentCheckIn(client, studentId, d, sessionId);
            }
            const exQ = await client.query(`
        select we.id, we.name_snapshot, we.muscle_group
        from public.session_exercises se
        join public.workout_exercises we on we.id = se.workout_exercise_id
        where se.session_id = $1
        `, [sessionId]);
            const exerciseMeta = exQ.rows.map((r) => ({
                workout_exercise_id: r.id,
                name_snapshot: r.name_snapshot,
                muscle_group: r.muscle_group,
            }));
            const summary = await buildWorkoutFinishSummary(client, studentId, sessionId, exerciseMeta);
            return { ok: true, summary };
        });
        if (!summaryMeta.ok) {
            switch (summaryMeta.error) {
                case "session_not_found":
                    return res.status(404).json({ error: summaryMeta.error });
                case "session_exercises_incomplete":
                    return res.status(400).json({ error: summaryMeta.error });
                case "session_not_finishable":
                    return res.status(409).json({ error: summaryMeta.error });
                default:
                    return res.status(500).json({ error: "internal_error" });
            }
        }
        const payload = await withTx((client) => loadSessionPayloadTx(client, studentId, sessionId));
        if (!payload)
            return res.status(404).json({ error: "workout_session_not_found" });
        return res.status(200).json({ ...payload, summary: summaryMeta.summary });
    }
    catch {
        return res.status(500).json({ error: "internal_error" });
    }
});
/** Substitui séries registradas de um exercício na sessão (apenas `in_progress`). */
router.put("/workouts/sessions/:session_id/exercises/:workout_exercise_id/sets", async (req, res) => {
    const studentId = authedUserId(req);
    const sessionId = req.params.session_id;
    const workoutExerciseId = req.params.workout_exercise_id;
    if (!z.string().uuid().safeParse(sessionId).success || !z.string().uuid().safeParse(workoutExerciseId).success) {
        return res.status(400).json({ error: "invalid_params" });
    }
    const parsed = putSessionExerciseSetsSchema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: "invalid_body", details: parsed.error.flatten() });
    try {
        const out = await withTx(async (client) => {
            const sQ = await client.query(`
        select ws.status::text as status
        from public.workout_sessions ws
        where ws.id = $1 and ws.student_id = $2
        for update
        `, [sessionId, studentId]);
            const st = sQ.rows[0]?.status;
            if (!st)
                return { ok: false, error: "session_not_found" };
            if (st !== "in_progress")
                return { ok: false, error: "session_not_editable" };
            const exQ = await client.query(`
        select se.id as sid
        from public.session_exercises se
        join public.workout_sessions ws on ws.id = se.session_id
        join public.student_workouts sw on sw.id = ws.student_workout_id
        join public.workout_exercises we on we.id = se.workout_exercise_id
        where se.session_id = $1 and se.workout_exercise_id = $2 and sw.student_id = $3 and we.workout_id = sw.workout_id
        `, [sessionId, workoutExerciseId, studentId]);
            if (!exQ.rowCount)
                return { ok: false, error: "session_exercise_not_found" };
            const idx = new Set();
            for (const s of parsed.data.sets) {
                if (idx.has(s.set_index))
                    return { ok: false, error: "duplicate_set_index" };
                idx.add(s.set_index);
            }
            await client.query(`delete from public.session_sets where session_id = $1 and workout_exercise_id = $2`, [
                sessionId,
                workoutExerciseId,
            ]);
            for (const s of parsed.data.sets) {
                await client.query(`
          insert into public.session_sets (id, session_id, workout_exercise_id, set_index, weight_kg, reps_done, rest_seconds_actual)
          values ($1, $2, $3, $4, $5, $6, $7)
          `, [
                    uuid(),
                    sessionId,
                    workoutExerciseId,
                    s.set_index,
                    s.weight_kg ?? null,
                    s.reps_done ?? null,
                    s.rest_seconds_actual ?? null,
                ]);
            }
            return { ok: true };
        });
        if (!out.ok) {
            if (out.error === "session_not_found")
                return res.status(404).json({ error: out.error });
            if (out.error === "session_not_editable")
                return res.status(409).json({ error: out.error });
            if (out.error === "duplicate_set_index")
                return res.status(400).json({ error: out.error });
            return res.status(404).json({ error: out.error });
        }
        const payload = await withTx((client) => loadSessionPayloadTx(client, studentId, sessionId));
        if (!payload)
            return res.status(404).json({ error: "workout_session_not_found" });
        return res.json(payload);
    }
    catch {
        return res.status(500).json({ error: "internal_error" });
    }
});
router.post("/check-ins", async (req, res) => {
    const studentId = authedUserId(req);
    const parsed = postCheckInSchema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: "invalid_body", details: parsed.error.flatten() });
    try {
        const result = await withTx(async (client) => {
            const d = parsed.data.check_in_date?.slice(0, 10) ?? (await studentLocalDateString(client, studentId));
            const inserted = await insertStudentCheckIn(client, studentId, d, parsed.data.workout_session_id ?? null);
            return { check_in_date: d, created: inserted };
        });
        return res.status(201).json(result);
    }
    catch {
        return res.status(500).json({ error: "internal_error" });
    }
});
router.get("/workouts", async (req, res) => {
    const studentId = authedUserId(req);
    const isActiveQ = req.query.is_active;
    const isActive = typeof isActiveQ === "string" ? (isActiveQ === "true" ? true : isActiveQ === "false" ? false : null) : null;
    if (isActiveQ !== undefined && isActive === null) {
        return res.status(400).json({ error: "invalid_query", detail: "is_active must be true or false" });
    }
    try {
        const assignments = await withTx(async (client) => {
            let sql = `
        select
          sw.id,
          sw.student_id,
          sw.workout_id,
          sw.weekdays,
          sw.start_date,
          sw.end_date,
          sw.display_order,
          sw.is_active,
          sw.created_at,
          w.name as workout_name,
          w.notes as workout_notes,
          coalesce(wec.cnt, 0)::int as exercise_count,
          lcd.scheduled_for_date as last_completed_date
        from public.student_workouts sw
        join public.workouts w on w.id = sw.workout_id
        left join (
          select we.workout_id, count(*)::int as cnt
          from public.workout_exercises we
          group by we.workout_id
        ) wec on wec.workout_id = sw.workout_id
        left join (
          select ws.student_workout_id, min(ws.scheduled_for_date) as scheduled_for_date
          from public.workout_sessions ws
          inner join (
            select student_workout_id, max(completed_at) as mx
            from public.workout_sessions
            where status::text in ('completed', 'completed_partial')
            group by student_workout_id
          ) t on t.student_workout_id = ws.student_workout_id and ws.completed_at = t.mx
          where ws.status::text in ('completed', 'completed_partial')
          group by ws.student_workout_id
        ) lcd on lcd.student_workout_id = sw.id
        where sw.student_id = $1
      `;
            const params = [studentId];
            if (isActive !== null) {
                sql += ` and sw.is_active = $2`;
                params.push(isActive);
            }
            sql += ` order by sw.display_order asc, sw.created_at desc limit 500`;
            const q = await client.query(sql, params);
            return q.rows;
        });
        const items = assignments.map((r) => ({
            id: r.id,
            student_id: r.student_id,
            workout_id: r.workout_id,
            weekdays: r.weekdays,
            start_date: formatDateOnly(r.start_date),
            end_date: r.end_date != null ? formatDateOnly(r.end_date) : null,
            display_order: r.display_order,
            is_active: r.is_active,
            created_at: toIso(r.created_at),
            workout_name: r.workout_name,
            workout_notes: r.workout_notes,
            exercise_count: r.exercise_count,
            last_completed_date: r.last_completed_date != null ? formatDateOnly(r.last_completed_date) : null,
        }));
        return res.json({ student_workouts: items });
    }
    catch {
        return res.status(500).json({ error: "internal_error" });
    }
});
router.get("/workouts/:student_workout_id", async (req, res) => {
    const studentId = authedUserId(req);
    const swId = req.params.student_workout_id;
    if (!z.string().uuid().safeParse(swId).success)
        return res.status(400).json({ error: "invalid_params" });
    try {
        const payload = await withTx(async (client) => {
            const swQ = await client.query(`
        select
          sw.id, sw.workout_id, sw.weekdays, sw.start_date, sw.end_date, sw.display_order, sw.is_active, sw.created_at,
          w.name as workout_name, w.notes as workout_notes
        from public.student_workouts sw
        join public.workouts w on w.id = sw.workout_id
        where sw.id = $1 and sw.student_id = $2
        `, [swId, studentId]);
            const sw = swQ.rows[0];
            if (!sw)
                return null;
            const exQ = await client.query(`
        select id, position, wger_exercise_id, name_snapshot, sets, reps, rest_seconds, notes, muscle_group
        from public.workout_exercises
        where workout_id = $1
        order by position asc
        `, [sw.workout_id]);
            const sessions = await client.query(`
        select id, scheduled_for_date, status::text, started_at, completed_at
        from public.workout_sessions
        where student_workout_id = $1
        order by scheduled_for_date desc
        limit 30
        `, [swId]);
            return {
                assignment: {
                    id: sw.id,
                    workout_id: sw.workout_id,
                    weekdays: sw.weekdays,
                    start_date: formatDateOnly(sw.start_date),
                    end_date: sw.end_date != null ? formatDateOnly(sw.end_date) : null,
                    display_order: sw.display_order,
                    is_active: sw.is_active,
                    created_at: toIso(sw.created_at),
                },
                workout: {
                    id: sw.workout_id,
                    name: sw.workout_name,
                    notes: sw.workout_notes,
                    exercises: exQ.rows.map((e) => ({
                        id: e.id,
                        position: e.position,
                        wger_exercise_id: e.wger_exercise_id,
                        name_snapshot: e.name_snapshot,
                        sets: e.sets,
                        reps: e.reps,
                        rest_seconds: e.rest_seconds,
                        notes: e.notes,
                        muscle_group: e.muscle_group,
                    })),
                },
                recent_sessions: sessions.rows.map((s) => ({
                    id: s.id,
                    scheduled_for_date: formatDateOnly(s.scheduled_for_date),
                    status: s.status,
                    started_at: toIso(s.started_at),
                    completed_at: s.completed_at ? toIso(s.completed_at) : null,
                })),
            };
        });
        if (!payload)
            return res.status(404).json({ error: "student_workout_not_found" });
        return res.json(payload);
    }
    catch {
        return res.status(500).json({ error: "internal_error" });
    }
});
router.post("/workouts/:student_workout_id/sessions", async (req, res) => {
    const studentId = authedUserId(req);
    const swId = req.params.student_workout_id;
    if (!z.string().uuid().safeParse(swId).success)
        return res.status(400).json({ error: "invalid_params" });
    const parsed = createSessionSchema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: "invalid_body", details: parsed.error.flatten() });
    const scheduledFor = parsed.data.scheduled_for_date;
    const dow = isoWeekdayFromDateOnly(scheduledFor);
    if (!Number.isFinite(dow))
        return res.status(400).json({ error: "invalid_scheduled_date" });
    try {
        const payload = await withTx(async (client) => {
            const swQ = await client.query(`select id, workout_id, weekdays, is_active from public.student_workouts where id = $1 and student_id = $2 for update`, [swId, studentId]);
            const sw = swQ.rows[0];
            if (!sw)
                return { ok: false, error: "student_workout_not_found" };
            if (!sw.is_active)
                return { ok: false, error: "student_workout_inactive" };
            const scheduleHint = {
                scheduled_weekday: dow,
                planned_weekdays: [...sw.weekdays],
                matches_planned_weekdays: sw.weekdays.includes(dow),
            };
            const existing = await client.query(`select id from public.workout_sessions where student_workout_id = $1 and scheduled_for_date = $2::date`, [swId, scheduledFor]);
            let sessionId = existing.rows[0]?.id;
            if (!sessionId) {
                const sid = uuid();
                await client.query(`
          insert into public.workout_sessions (id, student_id, student_workout_id, scheduled_for_date, status)
          values ($1, $2, $3, $4::date, 'in_progress'::public.workout_session_status)
          `, [sid, studentId, swId, scheduledFor]);
                sessionId = sid;
                const we = await client.query(`select id from public.workout_exercises where workout_id = $1 order by position asc`, [sw.workout_id]);
                for (const row of we.rows) {
                    await client.query(`
            insert into public.session_exercises (id, session_id, workout_exercise_id, completed)
            values ($1, $2, $3, false)
            `, [uuid(), sessionId, row.id]);
                }
            }
            await ensureSessionExercises(client, sessionId, sw.workout_id);
            const body = await loadSessionPayloadTx(client, studentId, sessionId);
            return { ok: true, body: { ...body, schedule_hint: scheduleHint } };
        });
        if (!payload.ok) {
            switch (payload.error) {
                case "student_workout_not_found":
                    return res.status(404).json({ error: payload.error });
                case "student_workout_inactive":
                    return res.status(400).json({ error: payload.error });
            }
        }
        return res.status(200).json(payload.body);
    }
    catch (e) {
        const msg = String(e?.message ?? "");
        if (msg.includes("workout_sessions_unique_day") || msg.includes("unique constraint")) {
            const retry = await withTx(async (client) => {
                const existing = await client.query(`select id from public.workout_sessions where student_workout_id = $1 and scheduled_for_date = $2::date`, [swId, scheduledFor]);
                const sessionId = existing.rows[0]?.id;
                if (!sessionId)
                    throw e;
                const swQ = await client.query(`select workout_id, weekdays from public.student_workouts where id = $1 and student_id = $2`, [swId, studentId]);
                const wid = swQ.rows[0]?.workout_id;
                const wdays = swQ.rows[0]?.weekdays ?? [];
                if (!wid)
                    return null;
                await ensureSessionExercises(client, sessionId, wid);
                const body = await loadSessionPayloadTx(client, studentId, sessionId);
                const hint = {
                    scheduled_weekday: dow,
                    planned_weekdays: [...wdays],
                    matches_planned_weekdays: wdays.includes(dow),
                };
                return { ...body, schedule_hint: hint };
            });
            if (retry)
                return res.status(200).json(retry);
        }
        return res.status(500).json({ error: "internal_error" });
    }
});
async function ensureSessionExercises(client, sessionId, workoutId) {
    const we = await client.query(`select id from public.workout_exercises where workout_id = $1 order by position asc`, [workoutId]);
    for (const row of we.rows) {
        await client.query(`
      insert into public.session_exercises (id, session_id, workout_exercise_id, completed)
      values ($1, $2, $3, false)
      on conflict (session_id, workout_exercise_id) do nothing
      `, [uuid(), sessionId, row.id]);
    }
}
async function loadSessionPayload(studentId, sessionId) {
    return withTx((client) => loadSessionPayloadTx(client, studentId, sessionId));
}
async function loadSessionPayloadTx(client, studentId, sessionId) {
    const sQ = await client.query(`
    select id, student_workout_id, scheduled_for_date, status::text, started_at, completed_at
    from public.workout_sessions
    where id = $1 and student_id = $2
    `, [sessionId, studentId]);
    const s = sQ.rows[0];
    if (!s)
        return null;
    const exQ = await client.query(`
    select
      se.workout_exercise_id,
      se.completed,
      se.completed_at,
      we.position,
      we.wger_exercise_id,
      we.name_snapshot,
      we.sets,
      we.reps,
      we.rest_seconds,
      we.notes,
      we.muscle_group
    from public.session_exercises se
    join public.workout_exercises we on we.id = se.workout_exercise_id
    where se.session_id = $1
    order by we.position asc
    `, [sessionId]);
    const setsQ = await client.query(`
    select workout_exercise_id::text as workout_exercise_id, set_index, weight_kg, reps_done, rest_seconds_actual
    from public.session_sets
    where session_id = $1
    order by workout_exercise_id, set_index
    `, [sessionId]);
    const setsByExercise = new Map();
    for (const row of setsQ.rows) {
        const w = row.weight_kg == null ? null : Number(row.weight_kg);
        const list = setsByExercise.get(row.workout_exercise_id) ?? [];
        list.push({
            set_index: row.set_index,
            weight_kg: w != null && Number.isFinite(w) ? w : null,
            reps_done: row.reps_done,
            rest_seconds_actual: row.rest_seconds_actual,
        });
        setsByExercise.set(row.workout_exercise_id, list);
    }
    return {
        session: {
            id: s.id,
            student_workout_id: s.student_workout_id,
            scheduled_for_date: formatDateOnly(s.scheduled_for_date),
            status: s.status,
            started_at: toIso(s.started_at),
            completed_at: s.completed_at ? toIso(s.completed_at) : null,
        },
        exercises: exQ.rows.map((e) => ({
            workout_exercise_id: e.workout_exercise_id,
            completed: e.completed,
            completed_at: e.completed_at ? toIso(e.completed_at) : null,
            position: e.position,
            wger_exercise_id: e.wger_exercise_id,
            name_snapshot: e.name_snapshot,
            sets: e.sets,
            reps: e.reps,
            rest_seconds: e.rest_seconds,
            notes: e.notes,
            muscle_group: e.muscle_group,
            sets_logged: setsByExercise.get(e.workout_exercise_id) ?? [],
        })),
    };
}
async function studentLocalDateString(client, studentId) {
    const q = await client.query(`
    select (timezone(coalesce(p.timezone, 'UTC'), now()))::date::text as d
    from public.profiles p
    where p.id = $1
    `, [studentId]);
    return q.rows[0]?.d ?? new Date().toISOString().slice(0, 10);
}
async function insertStudentCheckIn(client, studentId, checkInDate, workoutSessionId) {
    const insId = uuid();
    const r = await client.query(`
    insert into public.check_ins (id, student_id, check_in_date, source, workout_session_id)
    values ($1, $2, $3::date, 'app', $4)
    on conflict (student_id, check_in_date) do nothing
    returning id
    `, [insId, studentId, checkInDate, workoutSessionId]);
    return (r.rows?.length ?? 0) > 0;
}
function toIso(v) {
    const d = v instanceof Date ? v : new Date(v);
    return d.toISOString();
}
function formatDateOnly(v) {
    if (v == null)
        return null;
    if (v instanceof Date)
        return v.toISOString().slice(0, 10);
    if (typeof v === "string")
        return v.slice(0, 10);
    const d = new Date(v);
    return Number.isFinite(d.getTime()) ? d.toISOString().slice(0, 10) : null;
}
export default router;
