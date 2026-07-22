import { Router } from "express";
import { z } from "zod";
import { withTx } from "../db.js";
import { authedUserId } from "../middleware/requireAuth.js";

// [ACTUS — academia] Dashboard do personal (requireAuth + requirePersonal): agregados server-side
// que enriquecem a home do personal (evolução de aderência, alunos em risco). Cálculo em TS sobre
// dados crus (check_ins + vínculos) por robustez no pg-mem. Escopo: alunos do personal logado.

const router = Router();

function utcDateMinus(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}
function toDateOnly(v: unknown): string {
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  return String(v).slice(0, 10);
}

async function fetchActiveStudentIds(client: any, personalId: string): Promise<string[]> {
  const q = await client.query(
    `select spl.student_id
     from public.student_professional_links spl
     where spl.professional_id = $1 and spl.professional_role = 'personal' and spl.status = 'active'`,
    [personalId],
  );
  return q.rows.map((r: { student_id: string }) => r.student_id);
}

async function fetchCheckInsSince(
  client: any,
  personalId: string,
  since: string,
): Promise<{ student_id: string; date: string }[]> {
  const q = await client.query(
    `select c.student_id, c.check_in_date
     from public.check_ins c
     join public.student_professional_links spl
       on spl.student_id = c.student_id and spl.professional_id = $1
      and spl.professional_role = 'personal' and spl.status = 'active'
     where c.check_in_date >= $2::date`,
    [personalId, since],
  );
  return q.rows.map((r: { student_id: string; check_in_date: unknown }) => ({
    student_id: r.student_id,
    date: toDateOnly(r.check_in_date),
  }));
}

// GET /professional/dashboard/overview — KPIs base do personal.
router.get("/overview", async (req, res) => {
  const personalId = authedUserId(req);
  const since7 = utcDateMinus(7);
  const since30 = utcDateMinus(30);
  try {
    const out = await withTx(async (client) => {
      const studentIds = await fetchActiveStudentIds(client, personalId);
      const checkins = await fetchCheckInsSince(client, personalId, since30);
      const active30 = new Set(checkins.map((c) => c.student_id));
      const active7 = new Set(checkins.filter((c) => c.date >= since7).map((c) => c.student_id));
      const total = studentIds.length;
      return {
        total_students: total,
        active_students_7d: active7.size,
        active_students_30d: active30.size,
        check_ins_7d: checkins.filter((c) => c.date >= since7).length,
        retention_30d_pct: total > 0 ? Math.round((active30.size / total) * 100) : null,
      };
    });
    return res.json(out);
  } catch {
    return res.status(500).json({ error: "internal_error" });
  }
});

// GET /professional/dashboard/adherence?weeks=8 — série semanal de % de alunos ativos.
router.get("/adherence", async (req, res) => {
  const personalId = authedUserId(req);
  const weeks = z.coerce.number().int().min(1).max(26).catch(8).parse(req.query.weeks);
  const since = utcDateMinus(weeks * 7 - 1);
  try {
    const out = await withTx(async (client) => {
      const studentIds = await fetchActiveStudentIds(client, personalId);
      const total = studentIds.length;
      const checkins = await fetchCheckInsSince(client, personalId, since);

      const points: { week_start: string; active_pct: number | null; active_count: number }[] = [];
      for (let w = weeks - 1; w >= 0; w--) {
        const start = utcDateMinus(w * 7 + 6);
        const end = utcDateMinus(w * 7);
        const active = new Set(checkins.filter((c) => c.date >= start && c.date <= end).map((c) => c.student_id));
        points.push({
          week_start: start,
          active_count: active.size,
          active_pct: total > 0 ? Math.round((active.size / total) * 100) : null,
        });
      }
      return { weeks, total_students: total, points };
    });
    return res.json(out);
  } catch {
    return res.status(500).json({ error: "internal_error" });
  }
});

// GET /professional/dashboard/at-risk?days=7 — alunos sem atividade há mais de N dias.
router.get("/at-risk", async (req, res) => {
  const personalId = authedUserId(req);
  const days = z.coerce.number().int().min(1).max(90).catch(7).parse(req.query.days);
  const threshold = utcDateMinus(days);
  try {
    const out = await withTx(async (client) => {
      const q = await client.query<{
        student_id: string;
        display_name: string | null;
        email: string;
        last_check_in: unknown | null;
      }>(
        `select spl.student_id, p.display_name, au.email,
                (select max(c.check_in_date) from public.check_ins c where c.student_id = spl.student_id) as last_check_in
         from public.student_professional_links spl
         join public.profiles p on p.id = spl.student_id
         join public.app_users au on au.id = spl.student_id
         where spl.professional_id = $1 and spl.professional_role = 'personal' and spl.status = 'active'`,
        [personalId],
      );
      const atRisk = q.rows
        .map((r) => ({
          id: r.student_id,
          display_name: r.display_name,
          email: r.email,
          last_check_in: r.last_check_in == null ? null : toDateOnly(r.last_check_in),
        }))
        .filter((s) => s.last_check_in == null || s.last_check_in < threshold)
        .sort((a, b) => (a.last_check_in ?? "").localeCompare(b.last_check_in ?? ""));
      return { days, students: atRisk };
    });
    return res.json(out);
  } catch {
    return res.status(500).json({ error: "internal_error" });
  }
});

export default router;
