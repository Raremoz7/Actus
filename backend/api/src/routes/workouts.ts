import { Router } from "express";
import { z } from "zod";
import { withTx } from "../db.js";
import { authedUserId } from "../middleware/requireAuth.js";
import { uuid } from "../crypto.js";

const router = Router();

const exerciseSchema = z.object({
  position: z.number().int().min(1),
  wger_exercise_id: z.number().int().min(1),
  name_snapshot: z.string().min(1).max(200),
  sets: z.number().int().min(1).max(50).default(3),
  reps: z.number().int().min(1).max(500).default(10),
  rest_seconds: z.number().int().min(0).max(3600).default(60),
  notes: z.string().max(2000).optional(),
  muscle_group: z.string().min(1).max(80).optional().nullable(),
});

const createWorkoutSchema = z.object({
  name: z.string().min(1).max(200),
  notes: z.string().max(5000).optional(),
  exercises: z.array(exerciseSchema).min(1).max(200),
});

const patchWorkoutSchema = z
  .object({
    name: z.string().min(1).max(200).optional(),
    notes: z.string().max(5000).optional().nullable(),
    exercises: z.array(exerciseSchema).min(1).max(200).optional(),
  })
  .refine((o) => o.name !== undefined || o.notes !== undefined || o.exercises !== undefined, {
    message: "empty_patch",
  });

router.get("/", async (req, res) => {
  const personalId = authedUserId(req);
  try {
    const out = await withTx(async (client) => {
      const meQ = await client.query<{ tipo: string }>(`select tipo::text as tipo from public.profiles where id = $1`, [personalId]);
      if (meQ.rows[0]?.tipo !== "personal") return { ok: false as const, error: "only_personal" as const };

      const q = await client.query<{ id: string; name: string; notes: string | null; created_at: any; exercise_count: string }>(
        `
        select w.id, w.name, w.notes, w.created_at, count(we.id)::text as exercise_count
        from public.workouts w
        left join public.workout_exercises we on we.workout_id = w.id
        where w.owner_personal_id = $1
        group by w.id, w.name, w.notes, w.created_at
        order by w.created_at desc
        limit 500
        `,
        [personalId],
      );

      const workouts = q.rows.map((r) => ({
        id: r.id,
        name: r.name,
        notes: r.notes,
        created_at: (r.created_at instanceof Date ? r.created_at : new Date(r.created_at)).toISOString(),
        exercise_count: Number(r.exercise_count),
      }));

      return { ok: true as const, workouts };
    });
    if (!out.ok) return res.status(403).json({ error: out.error });
    return res.json({ workouts: out.workouts });
  } catch {
    return res.status(500).json({ error: "internal_error" });
  }
});

router.get("/:workout_id", async (req, res) => {
  const personalId = authedUserId(req);
  const workoutId = req.params.workout_id;
  if (!z.string().uuid().safeParse(workoutId).success) return res.status(400).json({ error: "invalid_params" });

  try {
    const out = await withTx(async (client) => {
      const meQ = await client.query<{ tipo: string }>(`select tipo::text as tipo from public.profiles where id = $1`, [personalId]);
      if (meQ.rows[0]?.tipo !== "personal") return { ok: false as const, error: "only_personal" as const };

      const wQ = await client.query<{ id: string; name: string; notes: string | null; created_at: any }>(
        `select id, name, notes, created_at from public.workouts where id = $1 and owner_personal_id = $2`,
        [workoutId, personalId],
      );
      const w = wQ.rows[0];
      if (!w) return { ok: false as const, error: "not_found" as const };

      const exQ = await client.query<{
        id: string;
        position: number;
        wger_exercise_id: number;
        name_snapshot: string;
        sets: number;
        reps: number;
        rest_seconds: number;
        notes: string | null;
        muscle_group: string | null;
      }>(
        `
        select id, position, wger_exercise_id, name_snapshot, sets, reps, rest_seconds, notes, muscle_group
        from public.workout_exercises
        where workout_id = $1
        order by position asc
        `,
        [workoutId],
      );

      return {
        ok: true as const,
        workout: {
          id: w.id,
          name: w.name,
          notes: w.notes,
          created_at: (w.created_at instanceof Date ? w.created_at : new Date(w.created_at)).toISOString(),
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
      };
    });
    if (!out.ok) {
      if (out.error === "only_personal") return res.status(403).json({ error: out.error });
      return res.status(404).json({ error: "workout_not_found" });
    }
    return res.json(out.workout);
  } catch {
    return res.status(500).json({ error: "internal_error" });
  }
});

router.post("/", async (req, res) => {
  const personalId = authedUserId(req);
  const parsed = createWorkoutSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "invalid_body", details: parsed.error.flatten() });

  const { name, notes, exercises } = parsed.data;

  try {
    const out = await withTx(async (client) => {
      const meQ = await client.query<{ tipo: "personal" | "nutricionista" | "aluno" | "actus_admin" | "actus_suporte" }>(
        `select tipo from public.profiles where id = $1`,
        [personalId],
      );
      const tipo = meQ.rows[0]?.tipo ?? null;
      if (tipo !== "personal") return { ok: false as const, error: "only_personal" as const };

      const workoutId = uuid();
      const w = await client.query<{ id: string }>(
        `
        insert into public.workouts (id, owner_personal_id, name, notes)
        values ($1, $2, $3, $4)
        returning id
        `,
        [workoutId, personalId, name, notes ?? null],
      );
      const insertedWorkoutId = w.rows[0]?.id;
      if (!insertedWorkoutId) throw new Error("failed_to_create_workout");

      const positions = new Set<number>();
      for (const ex of exercises) {
        if (positions.has(ex.position)) return { ok: false as const, error: "duplicate_exercise_position" as const };
        positions.add(ex.position);
      }

      for (const ex of exercises) {
        await client.query(
          `
          insert into public.workout_exercises
            (id, workout_id, position, wger_exercise_id, name_snapshot, sets, reps, rest_seconds, notes, muscle_group)
          values
            ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          `,
          [
            uuid(),
            insertedWorkoutId,
            ex.position,
            ex.wger_exercise_id,
            ex.name_snapshot,
            ex.sets,
            ex.reps,
            ex.rest_seconds,
            ex.notes ?? null,
            ex.muscle_group ?? null,
          ],
        );
      }

      return { ok: true as const, workout_id: insertedWorkoutId };
    });

    if (!out.ok) return res.status(403).json({ error: out.error });
    return res.status(201).json(out);
  } catch {
    return res.status(500).json({ error: "internal_error" });
  }
});

router.patch("/:workout_id", async (req, res) => {
  const personalId = authedUserId(req);
  const workoutId = req.params.workout_id;
  if (!z.string().uuid().safeParse(workoutId).success) return res.status(400).json({ error: "invalid_params" });

  const parsed = patchWorkoutSchema.safeParse(req.body);
  if (!parsed.success) {
    if (parsed.error.flatten().formErrors.length) {
      return res.status(400).json({ error: "invalid_body", details: parsed.error.flatten() });
    }
    return res.status(400).json({ error: "invalid_body", details: parsed.error.flatten() });
  }

  const { name, notes, exercises } = parsed.data;

  try {
    const out = await withTx(async (client) => {
      const meQ = await client.query<{ tipo: string }>(`select tipo::text as tipo from public.profiles where id = $1`, [personalId]);
      if (meQ.rows[0]?.tipo !== "personal") return { ok: false as const, error: "only_personal" as const };

      const own = await client.query(`select 1 from public.workouts where id = $1 and owner_personal_id = $2`, [workoutId, personalId]);
      if (!own.rowCount) return { ok: false as const, error: "not_found" as const };

      if (name !== undefined || notes !== undefined) {
        const sets: string[] = [];
        const vals: unknown[] = [];
        let i = 1;
        if (name !== undefined) {
          sets.push(`name = $${i++}`);
          vals.push(name);
        }
        if (notes !== undefined) {
          sets.push(`notes = $${i++}`);
          vals.push(notes);
        }
        vals.push(workoutId);
        await client.query(`update public.workouts set ${sets.join(", ")}, updated_at = now() where id = $${i}`, vals);
      }

      if (exercises) {
        const positions = new Set<number>();
        for (const ex of exercises) {
          if (positions.has(ex.position)) return { ok: false as const, error: "duplicate_exercise_position" as const };
          positions.add(ex.position);
        }
        await client.query(`delete from public.workout_exercises where workout_id = $1`, [workoutId]);
        for (const ex of exercises) {
          await client.query(
            `
            insert into public.workout_exercises
              (id, workout_id, position, wger_exercise_id, name_snapshot, sets, reps, rest_seconds, notes, muscle_group)
            values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            `,
            [
              uuid(),
              workoutId,
              ex.position,
              ex.wger_exercise_id,
              ex.name_snapshot,
              ex.sets,
              ex.reps,
              ex.rest_seconds,
              ex.notes ?? null,
              ex.muscle_group ?? null,
            ],
          );
        }
      }

      return { ok: true as const };
    });

    if (!out.ok) {
      if (out.error === "only_personal") return res.status(403).json({ error: out.error });
      if (out.error === "duplicate_exercise_position") return res.status(400).json({ error: out.error });
      return res.status(404).json({ error: "workout_not_found" });
    }

    const detail = await withTx(async (client) => {
      const wQ = await client.query<{ id: string; name: string; notes: string | null; created_at: any }>(
        `select id, name, notes, created_at from public.workouts where id = $1`,
        [workoutId],
      );
      const w = wQ.rows[0]!;
      const exQ = await client.query(
        `select id, position, wger_exercise_id, name_snapshot, sets, reps, rest_seconds, notes, muscle_group from public.workout_exercises where workout_id = $1 order by position`,
        [workoutId],
      );
      return {
        id: w.id,
        name: w.name,
        notes: w.notes,
        created_at: (w.created_at instanceof Date ? w.created_at : new Date(w.created_at)).toISOString(),
        exercises: exQ.rows,
      };
    });
    return res.json(detail);
  } catch {
    return res.status(500).json({ error: "internal_error" });
  }
});

export default router;
