import { Router } from "express";
import { z } from "zod";
import { withTx } from "../db.js";
import { uuid } from "../crypto.js";
import { authedUserId } from "../middleware/requireAuth.js";
import { scopedAcademyId } from "../middleware/requireAcademyManager.js";

// [ACTUS — academia] Painel do gestor (requireAuth + requireAcademyManager).
// O escopo (academy_id) vem resolvido do middleware via scopedAcademyId(req). Toda query carrega
// `academy_id = <escopo>` — a isolação por academia é predicado de query (RLS off, Opção A).
// Alunos são agregados pela view academy_students (instrutores ativos × vínculos personal->aluno).

const router = Router();

/** Data UTC (YYYY-MM-DD) deslocada por `days` — usada para janelas de atividade no agregado. */
function utcDateMinus(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

function toDateOnly(v: unknown): string {
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  return String(v).slice(0, 10);
}

// GET /academy/dashboard — KPIs agregados + ranking de instrutores.
// (Comissões "a pagar" são compostas no front a partir de GET /academy/commissions/report.)
router.get("/dashboard", async (req, res) => {
  const academyId = scopedAcademyId(req);
  const since7 = utcDateMinus(7);
  const since30 = utcDateMinus(30);

  try {
    const out = await withTx(async (client) => {
      const instructors = await client.query<{ user_id: string; display_name: string | null }>(
        `select am.user_id, p.display_name
         from public.academy_members am
         join public.profiles p on p.id = am.user_id
         where am.academy_id = $1 and am.role = 'instructor' and am.status = 'active'`,
        [academyId],
      );

      const students = await client.query<{ student_id: string; instructor_user_id: string }>(
        `select student_id, instructor_user_id from public.academy_students where academy_id = $1`,
        [academyId],
      );

      const checkins = await client.query<{ student_id: string; check_in_date: unknown }>(
        `select c.student_id, c.check_in_date
         from public.check_ins c
         join public.academy_students s on s.student_id = c.student_id and s.academy_id = $1
         where c.check_in_date >= $2::date`,
        [academyId, since30],
      );

      const checkinRows = checkins.rows.map((r) => ({ student_id: r.student_id, date: toDateOnly(r.check_in_date) }));
      const studentsByInstructor = new Map<string, Set<string>>();
      for (const s of students.rows) {
        if (!studentsByInstructor.has(s.instructor_user_id)) studentsByInstructor.set(s.instructor_user_id, new Set());
        studentsByInstructor.get(s.instructor_user_id)!.add(s.student_id);
      }
      const active7 = new Set(checkinRows.filter((c) => c.date >= since7).map((c) => c.student_id));

      const ranking = instructors.rows
        .map((ins) => {
          const studentIds = studentsByInstructor.get(ins.user_id) ?? new Set<string>();
          const checkins30 = checkinRows.filter((c) => studentIds.has(c.student_id)).length;
          const active = [...studentIds].filter((id) => active7.has(id)).length;
          return {
            instructor_user_id: ins.user_id,
            display_name: ins.display_name,
            student_count: studentIds.size,
            active_students_7d: active,
            check_ins_30d: checkins30,
          };
        })
        .sort((a, b) => b.student_count - a.student_count);

      const totalStudents = new Set(students.rows.map((s) => s.student_id)).size;
      const activeStudents7d = active7.size;
      const checkIns30d = checkinRows.length;
      const instructorCount = instructors.rows.length;
      const adherence7dPct = totalStudents > 0 ? Math.round((activeStudents7d / totalStudents) * 100) : null;

      return {
        kpis: {
          total_students: totalStudents,
          active_students_7d: activeStudents7d,
          check_ins_30d: checkIns30d,
          instructors: instructorCount,
          adherence_7d_pct: adherence7dPct,
        },
        instructor_ranking: ranking,
      };
    });
    return res.json(out);
  } catch {
    return res.status(500).json({ error: "internal_error" });
  }
});

// GET /academy/members — equipe (gestores + instrutores) com contagem de alunos por instrutor.
router.get("/members", async (req, res) => {
  const academyId = scopedAcademyId(req);
  const status = z.enum(["active", "revoked", "invited", "all"]).catch("active").parse(req.query.status);

  try {
    const out = await withTx(async (client) => {
      const params: unknown[] = [academyId];
      let statusClause = "";
      if (status !== "all") {
        params.push(status);
        statusClause = ` and am.status = $${params.length}`;
      }
      const q = await client.query<{
        member_id: string;
        user_id: string;
        role: string;
        status: string;
        display_name: string | null;
        email: string;
        student_count: string | number;
      }>(
        `select am.id as member_id, am.user_id, am.role, am.status, p.display_name, au.email,
                (select count(distinct s.student_id) from public.academy_students s
                   where s.academy_id = am.academy_id and s.instructor_user_id = am.user_id) as student_count
         from public.academy_members am
         join public.profiles p on p.id = am.user_id
         join public.app_users au on au.id = am.user_id
         where am.academy_id = $1${statusClause}
         order by am.role asc, p.display_name asc`,
        params,
      );
      return {
        members: q.rows.map((r) => ({
          id: r.member_id,
          user_id: r.user_id,
          role: r.role,
          status: r.status,
          display_name: r.display_name,
          email: r.email,
          student_count: Number(r.student_count),
        })),
      };
    });
    return res.json(out);
  } catch {
    return res.status(500).json({ error: "internal_error" });
  }
});

const addInstructorSchema = z.object({ email: z.string().email().max(320) });

// POST /academy/members/instructors — vincula um personal existente (por email) como instrutor.
router.post("/members/instructors", async (req, res) => {
  const academyId = scopedAcademyId(req);
  const actorId = authedUserId(req);
  const parsed = addInstructorSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "invalid_body", details: parsed.error.flatten() });
  const { email } = parsed.data;

  try {
    const out = await withTx(async (client) => {
      const u = await client.query<{ id: string; tipo: string }>(
        `select au.id, p.tipo::text as tipo
         from public.app_users au
         join public.profiles p on p.id = au.id
         where au.email = $1`,
        [email],
      );
      const user = u.rows[0];
      if (!user) return { ok: false as const, error: "personal_not_found" as const, status: 404 };
      if (user.tipo !== "personal") return { ok: false as const, error: "not_a_personal" as const, status: 400 };

      await client.query(
        `insert into public.academy_members (id, academy_id, user_id, role, status, invited_by, joined_at)
         values ($1, $2, $3, 'instructor', 'active', $4, now())
         on conflict (academy_id, user_id)
         do update set role = 'instructor', status = 'active', joined_at = now(), updated_at = now()`,
        [uuid(), academyId, user.id, actorId],
      );
      return { ok: true as const, user_id: user.id };
    });
    if (!out.ok) return res.status(out.status).json({ error: out.error });
    return res.status(201).json({ user_id: out.user_id, academy_id: academyId, role: "instructor" });
  } catch (e: any) {
    const msg = String(e?.message ?? "");
    if (msg.includes("academy_members_one_active_instructor_idx")) {
      return res.status(409).json({ error: "already_instructor_elsewhere" });
    }
    return res.status(500).json({ error: "internal_error" });
  }
});

const patchMemberSchema = z.object({ status: z.enum(["active", "revoked"]) });

// PATCH /academy/members/:user_id — ativa/revoga um membro (instrutor) da academia.
router.patch("/members/:user_id", async (req, res) => {
  const academyId = scopedAcademyId(req);
  const userId = req.params.user_id;
  if (!z.string().uuid().safeParse(userId).success) return res.status(400).json({ error: "invalid_params" });
  const parsed = patchMemberSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "invalid_body", details: parsed.error.flatten() });
  const { status } = parsed.data;

  try {
    const out = await withTx(async (client) => {
      const r = await client.query(
        `update public.academy_members set status = $1, updated_at = now()
         where academy_id = $2 and user_id = $3 and role = 'instructor'`,
        [status, academyId, userId],
      );
      return { changed: r.rowCount ?? 0 };
    });
    if (!out.changed) return res.status(404).json({ error: "member_not_found" });
    return res.json({ user_id: userId, status });
  } catch (e: any) {
    const msg = String(e?.message ?? "");
    if (msg.includes("academy_members_one_active_instructor_idx")) {
      return res.status(409).json({ error: "already_instructor_elsewhere" });
    }
    return res.status(500).json({ error: "internal_error" });
  }
});

// DELETE /academy/members/:user_id — revoga o instrutor (preserva histórico de comissão).
router.delete("/members/:user_id", async (req, res) => {
  const academyId = scopedAcademyId(req);
  const userId = req.params.user_id;
  if (!z.string().uuid().safeParse(userId).success) return res.status(400).json({ error: "invalid_params" });

  try {
    const out = await withTx(async (client) => {
      const r = await client.query(
        `update public.academy_members set status = 'revoked', updated_at = now()
         where academy_id = $1 and user_id = $2 and role = 'instructor'`,
        [academyId, userId],
      );
      return { changed: r.rowCount ?? 0 };
    });
    if (!out.changed) return res.status(404).json({ error: "member_not_found" });
    return res.json({ user_id: userId, status: "revoked" });
  } catch {
    return res.status(500).json({ error: "internal_error" });
  }
});

// GET /academy/students — alunos agregados da academia (via instrutores), com instrutor responsável.
router.get("/students", async (req, res) => {
  const academyId = scopedAcademyId(req);
  const instructorId = z.string().uuid().optional().catch(undefined).parse(req.query.instructor_id);

  try {
    const out = await withTx(async (client) => {
      const params: unknown[] = [academyId];
      let instructorClause = "";
      if (instructorId) {
        params.push(instructorId);
        instructorClause = ` and s.instructor_user_id = $${params.length}`;
      }
      const q = await client.query<{
        student_id: string;
        display_name: string | null;
        email: string;
        instructor_user_id: string;
        instructor_name: string | null;
      }>(
        `select s.student_id, sp.display_name, sau.email,
                s.instructor_user_id, ip.display_name as instructor_name
         from public.academy_students s
         join public.profiles sp on sp.id = s.student_id
         join public.app_users sau on sau.id = s.student_id
         join public.profiles ip on ip.id = s.instructor_user_id
         where s.academy_id = $1${instructorClause}
         order by sp.display_name asc
         limit 2000`,
        params,
      );

      // Último check-in por aluno calculado em TS (evita subquery correlacionada no pg-mem).
      const ci = await client.query<{ student_id: string; check_in_date: unknown }>(
        `select c.student_id, c.check_in_date
         from public.check_ins c
         join public.academy_students s on s.student_id = c.student_id and s.academy_id = $1`,
        [academyId],
      );
      const lastByStudent = new Map<string, string>();
      for (const r of ci.rows) {
        const d = toDateOnly(r.check_in_date);
        const prev = lastByStudent.get(r.student_id);
        if (!prev || d > prev) lastByStudent.set(r.student_id, d);
      }

      return {
        students: q.rows.map((r) => ({
          id: r.student_id,
          display_name: r.display_name,
          email: r.email,
          instructor_user_id: r.instructor_user_id,
          instructor_name: r.instructor_name,
          last_check_in: lastByStudent.get(r.student_id) ?? null,
        })),
      };
    });
    return res.json(out);
  } catch {
    return res.status(500).json({ error: "internal_error" });
  }
});

export default router;
