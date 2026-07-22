import { Router } from "express";
import { withTx } from "../db.js";
import { scopedAcademyId } from "../middleware/requireAcademyManager.js";

// [ACTUS — academia] Dashboard de rede (filiais/franquias). Só responde quando a academia
// autenticada tem network_role='network_hq'. Reaproveita a mesma agregação por academia de
// GET /academy/dashboard, rodada por unidade e somada — sem duplicar a lógica de KPI.

const router = Router();

type UnitRow = { id: string; name: string };

type Kpis = { total_students: number; instructors: number };

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

// Busca os KPIs de todas as unidades em UMA única transação (2 queries agregadas por
// academy_id, com `= ANY($1::uuid[])`), em vez de abrir uma transação por unidade
// (evita N+1 transações/conexões concorrentes sob Promise.all).
async function unitKpisByAcademy(academyIds: string[]): Promise<Map<string, Kpis>> {
  return withTx(async (client) => {
    const map = new Map<string, Kpis>();
    for (const id of academyIds) map.set(id, { total_students: 0, instructors: 0 });

    const [studentsRes, instructorsRes] = await Promise.all([
      client.query<{ academy_id: string; count: string }>(
        `select academy_id, count(distinct student_id) as count
         from public.academy_students
         where academy_id = ANY($1::uuid[])
         group by academy_id`,
        [academyIds],
      ),
      client.query<{ academy_id: string; count: string }>(
        `select academy_id, count(*) as count
         from public.academy_members
         where academy_id = ANY($1::uuid[]) and role = 'instructor' and status = 'active'
         group by academy_id`,
        [academyIds],
      ),
    ]);

    for (const row of studentsRes.rows) {
      const entry = map.get(row.academy_id);
      if (entry) entry.total_students = Number(row.count ?? 0);
    }
    for (const row of instructorsRes.rows) {
      const entry = map.get(row.academy_id);
      if (entry) entry.instructors = Number(row.count ?? 0);
    }

    return map;
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

    const kpisByAcademy = await unitKpisByAcademy(units.map((u) => u.id));

    const perUnit = units.map((u) => ({
      id: u.id,
      name: u.name,
      kpis: kpisByAcademy.get(u.id) ?? { total_students: 0, instructors: 0 },
    }));

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
