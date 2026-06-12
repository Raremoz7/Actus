import { Router } from "express";
import { z } from "zod";
import { withTx } from "../db.js";

const router = Router();

const listQuerySchema = z.object({
  q:            z.string().max(100).optional(),
  category:     z.string().max(60).optional(),
  equipment:    z.string().max(60).optional(),
  level:        z.string().max(30).optional(),
  muscle:       z.string().max(60).optional(),
  machine_type: z.string().max(80).optional(),
  limit:        z.coerce.number().int().min(1).max(200).default(60),
  offset:       z.coerce.number().int().min(0).default(0),
});

router.get("/", async (req, res) => {
  const parsed = listQuerySchema.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: "invalid_params" });

  const { q, category, equipment, level, muscle, machine_type, limit, offset } = parsed.data;

  try {
    const out = await withTx(async (client) => {
      const conditions: string[] = [];
      const vals: unknown[] = [];
      let i = 1;

      if (q && q.trim()) {
        conditions.push(`(name_pt ILIKE $${i} OR name_en ILIKE $${i})`);
        vals.push(`%${q.trim()}%`);
        i++;
      }
      if (category) { conditions.push(`category = $${i++}`); vals.push(category); }
      if (equipment) { conditions.push(`equipment = $${i++}`); vals.push(equipment); }
      if (level) { conditions.push(`level = $${i++}`); vals.push(level); }
      if (muscle) { conditions.push(`$${i++} = ANY(primary_muscles)`); vals.push(muscle); }
      if (machine_type) { conditions.push(`machine_type = $${i++}`); vals.push(machine_type); }

      const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

      const countQ = await client.query<{ total: string }>(
        `SELECT count(*)::text AS total FROM public.exercises ${where}`,
        vals,
      );
      const total = Number(countQ.rows[0]?.total ?? 0);

      vals.push(limit, offset);
      const dataQ = await client.query(
        `SELECT id, name_pt, name_en, category, equipment, level, mechanic, force,
                primary_muscles, secondary_muscles, image_0_url, image_1_url, machine_type
         FROM public.exercises
         ${where}
         ORDER BY name_pt
         LIMIT $${i++} OFFSET $${i++}`,
        vals,
      );

      return { total, exercises: dataQ.rows };
    });

    return res.json(out);
  } catch {
    return res.status(500).json({ error: "internal_error" });
  }
});

router.get("/:id", async (req, res) => {
  const id = req.params.id;
  try {
    const out = await withTx(async (client) => {
      const q = await client.query(
        `SELECT id, name_pt, name_en, category, equipment, level, mechanic, force,
                primary_muscles, secondary_muscles, instructions_pt, image_0_url, image_1_url,
                machine_type
         FROM public.exercises WHERE id = $1`,
        [id],
      );
      return q.rows[0] ?? null;
    });
    if (!out) return res.status(404).json({ error: "not_found" });
    return res.json(out);
  } catch {
    return res.status(500).json({ error: "internal_error" });
  }
});

export default router;
