import { Router } from "express";
import { z } from "zod";
import { withTx } from "../db.js";
import { authedUserId } from "../middleware/requireAuth.js";

const router = Router();

const exerciseSchema = z.object({
  position:        z.number().int().min(1),
  exercise_id:     z.string().min(1).max(200).optional().nullable(),
  wger_exercise_id: z.number().int().min(1).optional().nullable(),
  name_snapshot:   z.string().min(1).max(200),
  sets:            z.number().int().min(1).max(50).default(3),
  reps:            z.number().int().min(1).max(500).default(10),
  rest_seconds:    z.number().int().min(0).max(3600).default(60),
  notes:           z.string().max(2000).optional().nullable(),
  muscle_group:    z.string().max(80).optional().nullable(),
}).refine((d) => d.exercise_id != null || d.wger_exercise_id != null, {
  message: "exercise_id or wger_exercise_id is required",
});

const createSchema = z.object({
  name:      z.string().min(1).max(200),
  notes:     z.string().max(5000).optional(),
  exercises: z.array(exerciseSchema).min(1).max(200),
});

const patchSchema = z.object({
  name:      z.string().min(1).max(200).optional(),
  notes:     z.string().max(5000).nullable().optional(),
  exercises: z.array(exerciseSchema).min(1).max(200).optional(),
}).refine((o) => o.name !== undefined || o.notes !== undefined || o.exercises !== undefined, {
  message: "empty_patch",
});

async function requireAdmin(req: Parameters<typeof authedUserId>[0], res: { status: (n: number) => { json: (o: unknown) => unknown } }) {
  const userId = authedUserId(req);
  const tipo = await withTx(async (c) => {
    const q = await c.query<{ tipo: string }>(`SELECT tipo::text AS tipo FROM public.profiles WHERE id = $1`, [userId]);
    return q.rows[0]?.tipo ?? null;
  });
  if (tipo !== "actus_admin" && tipo !== "actus_suporte") {
    res.status(403).json({ error: "forbidden_not_admin" });
    return null;
  }
  return userId;
}

// GET /workout-templates — todos os autenticados
router.get("/", async (req, res) => {
  try {
    const rows = await withTx(async (c) => {
      const q = await c.query<{ id: string; name: string; notes: string | null; created_at: string; exercise_count: string }>(
        `SELECT t.id, t.name, t.notes, t.created_at, count(e.id)::text AS exercise_count
         FROM public.workout_templates t
         LEFT JOIN public.workout_template_exercises e ON e.template_id = t.id
         GROUP BY t.id, t.name, t.notes, t.created_at
         ORDER BY t.created_at DESC
         LIMIT 500`,
      );
      return q.rows;
    });
    return res.json({ templates: rows.map((r) => ({ ...r, exercise_count: Number(r.exercise_count) })) });
  } catch {
    return res.status(500).json({ error: "internal_error" });
  }
});

// GET /workout-templates/:id
router.get("/:id", async (req, res) => {
  try {
    const out = await withTx(async (c) => {
      const t = await c.query(`SELECT id, name, notes, created_at FROM public.workout_templates WHERE id = $1`, [req.params.id]);
      if (!t.rows[0]) return null;
      const e = await c.query(
        `SELECT id, position, exercise_id, wger_exercise_id, name_snapshot, sets, reps, rest_seconds, notes, muscle_group
         FROM public.workout_template_exercises
         WHERE template_id = $1
         ORDER BY position`,
        [req.params.id],
      );
      return { ...t.rows[0], exercises: e.rows };
    });
    if (!out) return res.status(404).json({ error: "not_found" });
    return res.json(out);
  } catch {
    return res.status(500).json({ error: "internal_error" });
  }
});

// POST /workout-templates — só admin
router.post("/", async (req, res) => {
  const adminId = await requireAdmin(req, res);
  if (!adminId) return;

  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "invalid_body" });

  const { name, notes, exercises } = parsed.data;
  try {
    const templateId = await withTx(async (c) => {
      const t = await c.query<{ id: string }>(
        `INSERT INTO public.workout_templates (name, notes, created_by) VALUES ($1, $2, $3) RETURNING id`,
        [name, notes ?? null, adminId],
      );
      const id = t.rows[0]!.id;
      await Promise.all(
        exercises.map((ex) =>
          c.query(
            `INSERT INTO public.workout_template_exercises
               (template_id, position, exercise_id, wger_exercise_id, name_snapshot, sets, reps, rest_seconds, notes, muscle_group)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
            [id, ex.position, ex.exercise_id ?? null, ex.wger_exercise_id ?? null, ex.name_snapshot, ex.sets, ex.reps, ex.rest_seconds, ex.notes ?? null, ex.muscle_group ?? null],
          ),
        ),
      );
      return id;
    });
    return res.status(201).json({ ok: true, template_id: templateId });
  } catch {
    return res.status(500).json({ error: "internal_error" });
  }
});

// PATCH /workout-templates/:id — só admin
router.patch("/:id", async (req, res) => {
  const adminId = await requireAdmin(req, res);
  if (!adminId) return;

  const parsed = patchSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "invalid_body" });

  const { name, notes, exercises } = parsed.data;
  try {
    const out = await withTx(async (c) => {
      const exists = await c.query(`SELECT id FROM public.workout_templates WHERE id = $1`, [req.params.id]);
      if (!exists.rows[0]) return null;

      if (name !== undefined) await c.query(`UPDATE public.workout_templates SET name = $1 WHERE id = $2`, [name, req.params.id]);
      if (notes !== undefined) await c.query(`UPDATE public.workout_templates SET notes = $1 WHERE id = $2`, [notes, req.params.id]);

      if (exercises !== undefined) {
        await c.query(`DELETE FROM public.workout_template_exercises WHERE template_id = $1`, [req.params.id]);
        await Promise.all(
          exercises.map((ex) =>
            c.query(
              `INSERT INTO public.workout_template_exercises
                 (template_id, position, exercise_id, wger_exercise_id, name_snapshot, sets, reps, rest_seconds, notes, muscle_group)
               VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
              [req.params.id, ex.position, ex.exercise_id ?? null, ex.wger_exercise_id ?? null, ex.name_snapshot, ex.sets, ex.reps, ex.rest_seconds, ex.notes ?? null, ex.muscle_group ?? null],
            ),
          ),
        );
      }

      const t = await c.query(`SELECT id, name, notes, created_at FROM public.workout_templates WHERE id = $1`, [req.params.id]);
      const e = await c.query(
        `SELECT id, position, exercise_id, wger_exercise_id, name_snapshot, sets, reps, rest_seconds, notes, muscle_group
         FROM public.workout_template_exercises WHERE template_id = $1 ORDER BY position`,
        [req.params.id],
      );
      return { ...t.rows[0], exercises: e.rows };
    });

    if (!out) return res.status(404).json({ error: "not_found" });
    return res.json(out);
  } catch {
    return res.status(500).json({ error: "internal_error" });
  }
});

// DELETE /workout-templates/:id — só admin
router.delete("/:id", async (req, res) => {
  const adminId = await requireAdmin(req, res);
  if (!adminId) return;

  try {
    await withTx(async (c) => {
      await c.query(`DELETE FROM public.workout_templates WHERE id = $1`, [req.params.id]);
    });
    return res.json({ ok: true });
  } catch {
    return res.status(500).json({ error: "internal_error" });
  }
});

// POST /workout-templates/:id/copy — personal copia template para sua biblioteca
router.post("/:id/copy", async (req, res) => {
  const userId = authedUserId(req);
  try {
    const workoutId = await withTx(async (c) => {
      const meQ = await c.query<{ tipo: string }>(`SELECT tipo::text AS tipo FROM public.profiles WHERE id = $1`, [userId]);
      if (meQ.rows[0]?.tipo !== "personal") return null;

      const tmpl = await c.query(
        `SELECT id, name, notes FROM public.workout_templates WHERE id = $1`,
        [req.params.id],
      );
      if (!tmpl.rows[0]) return undefined;

      const exs = await c.query(
        `SELECT position, exercise_id, wger_exercise_id, name_snapshot, sets, reps, rest_seconds, notes, muscle_group
         FROM public.workout_template_exercises WHERE template_id = $1 ORDER BY position`,
        [req.params.id],
      );

      const w = await c.query<{ id: string }>(
        `INSERT INTO public.workouts (name, notes, owner_personal_id) VALUES ($1, $2, $3) RETURNING id`,
        [tmpl.rows[0].name, tmpl.rows[0].notes, userId],
      );
      const wId = w.rows[0]!.id;

      await Promise.all(
        exs.rows.map((ex) =>
          c.query(
            `INSERT INTO public.workout_exercises
               (workout_id, position, exercise_id, wger_exercise_id, name_snapshot, sets, reps, rest_seconds, notes, muscle_group)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
            [wId, ex.position, ex.exercise_id, ex.wger_exercise_id, ex.name_snapshot, ex.sets, ex.reps, ex.rest_seconds, ex.notes, ex.muscle_group],
          ),
        ),
      );

      return wId;
    });

    if (workoutId === null) return res.status(403).json({ error: "forbidden_not_personal" });
    if (workoutId === undefined) return res.status(404).json({ error: "not_found" });
    return res.status(201).json({ ok: true, workout_id: workoutId });
  } catch {
    return res.status(500).json({ error: "internal_error" });
  }
});

export default router;
