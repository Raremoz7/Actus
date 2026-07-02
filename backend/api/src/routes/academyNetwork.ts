import { Router } from "express";
import { withTx } from "../db.js";
import { scopedAcademyId } from "../middleware/requireAcademyManager.js";

// [ACTUS — academia] Dashboard de rede (filiais/franquias). Só responde quando a academia
// autenticada tem network_role='network_hq'. Reaproveita a mesma agregação por academia de
// GET /academy/dashboard, rodada por unidade e somada — sem duplicar a lógica de KPI.

const router = Router();

type UnitRow = { id: string; name: string };

async function requireNetworkHq(academyId: string): Promise<UnitRow[] | null> {
  return withTx(async (client) => {
    const hq = await client.query<{ network_role: string }>(
      `select network_role from public.academies where id = $1`,
      [academyId],
    );
    if (hq.rows[0]?.network_role !== "network_hq") return null;

    const units = await client.query<UnitRow>(
      `select id, name from public.academies where parent_academy_id = $1 order by name asc`,
      [academyId],
    );
    return units.rows;
  });
}

async function unitKpis(academyId: string) {
  return withTx(async (client) => {
    const totalStudents = await client.query<{ count: string }>(
      `select count(distinct student_id) as count from public.academy_students where academy_id = $1`,
      [academyId],
    );
    const instructors = await client.query<{ count: string }>(
      `select count(*) as count from public.academy_members
       where academy_id = $1 and role = 'instructor' and status = 'active'`,
      [academyId],
    );
    return {
      total_students: Number(totalStudents.rows[0]?.count ?? 0),
      instructors: Number(instructors.rows[0]?.count ?? 0),
    };
  });
}

// GET /academy/network — lista as unidades da rede.
router.get("/", async (req, res) => {
  const academyId = scopedAcademyId(req);
  try {
    const units = await requireNetworkHq(academyId);
    if (!units) return res.status(403).json({ error: "forbidden_not_network_hq" });
    return res.json({ units });
  } catch {
    return res.status(500).json({ error: "internal_error" });
  }
});

// GET /academy/network/dashboard — KPIs consolidados + breakdown por unidade.
router.get("/dashboard", async (req, res) => {
  const academyId = scopedAcademyId(req);
  try {
    const units = await requireNetworkHq(academyId);
    if (!units) return res.status(403).json({ error: "forbidden_not_network_hq" });

    const perUnit = await Promise.all(
      units.map(async (u) => ({ id: u.id, name: u.name, kpis: await unitKpis(u.id) })),
    );

    const totals = perUnit.reduce(
      (acc, u) => ({
        total_students: acc.total_students + u.kpis.total_students,
        instructors: acc.instructors + u.kpis.instructors,
      }),
      { total_students: 0, instructors: 0 },
    );

    return res.json({ kpis: totals, units: perUnit });
  } catch {
    return res.status(500).json({ error: "internal_error" });
  }
});

export default router;
