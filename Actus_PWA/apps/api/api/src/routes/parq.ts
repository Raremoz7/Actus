// [ACTUS-NEW] Par-Q (questionário de prontidão) — B5.
// Três endpoints (ver backend/docs/CHANGES-actus.md e app/docs/backend-pendencias.md B5):
//   POST /students/:student_id/par-q                 — o aluno envia as próprias 7 respostas.
//   GET  /me/par-q                                   — o aluno lê o próprio status.
//   GET  /professional/students/:student_id/par-q    — profissional vinculado lê.
// Servidor carimba answered_at (current_date) e deriva valid_until (+12 meses) e any_yes.
// Tabela: public.par_q_responses (migration 20260610120000_par_q.sql).
import { Router } from "express";
import { z } from "zod";
import { withTx } from "../db.js";
import { authedUserId } from "../middleware/requireAuth.js";

const paramsSchema = z.object({ student_id: z.string().uuid() });

// Exatamente 7 respostas sim/não (question_id 1..7).
const bodySchema = z.object({
  answers: z
    .array(z.object({ question_id: z.number().int().min(1).max(7), value: z.boolean() }))
    .length(7),
});

// Datas date-only (cópia do helper de meStudentProgram.ts — paridade de resposta).
function formatDateOnly(v: any): string | null {
  if (v == null) return null;
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (typeof v === "string") return v.slice(0, 10);
  const d = new Date(v);
  return Number.isFinite(d.getTime()) ? d.toISOString().slice(0, 10) : null;
}

// Datas carimbadas em componentes LOCAIS (consistente com a regra de datas do app —
// nunca UTC). Para precisão por fuso do aluno, o dev pode trocar por studentLocalDateString.
function todayLocalDateStr(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function plusYearsLocal(dateStr: string, years: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const nd = new Date((y as number) + years, (m as number) - 1, d as number);
  const yy = nd.getFullYear();
  const mm = String(nd.getMonth() + 1).padStart(2, "0");
  const dd = String(nd.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

function mapRow(r: any) {
  return {
    student_id: r.student_id,
    answers: r.answers,
    any_yes: r.any_yes,
    answered_at: formatDateOnly(r.answered_at),
    valid_until: formatDateOnly(r.valid_until),
  };
}

const SELECT_COLS = `student_id, answers, any_yes, answered_at, valid_until`;

// POST /students/:student_id/par-q — só o próprio aluno envia o seu Par-Q.
export const studentParqRouter = Router({ mergeParams: true });
studentParqRouter.post("/", async (req, res) => {
  const requester = authedUserId(req);
  const p = paramsSchema.safeParse(req.params);
  if (!p.success) return res.status(400).json({ error: "invalid_params", details: p.error.flatten() });
  const studentId = p.data.student_id;

  const parsed = bodySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "invalid_body", details: parsed.error.flatten() });

  // O aluno só envia o próprio Par-Q (o student_id da rota deve ser ele mesmo).
  if (requester !== studentId) return res.status(403).json({ error: "forbidden" });

  const anyYes = parsed.data.answers.some((a) => a.value === true);
  const answeredAt = todayLocalDateStr();
  const validUntil = plusYearsLocal(answeredAt, 1); // PAR-Q expira em 12 meses.

  try {
    const out = await withTx(async (client) => {
      const meQ = await client.query<{ tipo: string }>(
        `select tipo::text as tipo from public.profiles where id = $1`,
        [requester],
      );
      if (meQ.rows[0]?.tipo !== "aluno") return { ok: false as const, error: "only_student" as const };

      const ins = await client.query(
        `
        insert into public.par_q_responses (student_id, answers, any_yes, answered_at, valid_until)
        values ($1, $2::jsonb, $3, $4::date, $5::date)
        on conflict (student_id) do update set
          answers = excluded.answers,
          any_yes = excluded.any_yes,
          answered_at = excluded.answered_at,
          valid_until = excluded.valid_until,
          updated_at = now()
        returning ${SELECT_COLS}
        `,
        [studentId, JSON.stringify(parsed.data.answers), anyYes, answeredAt, validUntil],
      );
      return { ok: true as const, row: ins.rows[0] };
    });

    if (!out.ok) return res.status(403).json({ error: out.error });
    return res.json({ ok: true, par_q: mapRow(out.row) });
  } catch {
    return res.status(500).json({ error: "internal_error" });
  }
});

// GET /me/par-q — o aluno lê o próprio status (mount com requireStudent).
export const meParqRouter = Router();
meParqRouter.get("/", async (req, res) => {
  const studentId = authedUserId(req);
  try {
    const row = await withTx(async (client) => {
      const q = await client.query(
        `select ${SELECT_COLS} from public.par_q_responses where student_id = $1`,
        [studentId],
      );
      return q.rows[0] ?? null;
    });
    return res.json({ par_q: row ? mapRow(row) : null });
  } catch {
    return res.status(500).json({ error: "internal_error" });
  }
});

// GET /professional/students/:student_id/par-q — profissional vinculado (personal OU nutri) lê.
export const professionalParqRouter = Router({ mergeParams: true });
professionalParqRouter.get("/", async (req, res) => {
  const professionalId = authedUserId(req);
  const p = paramsSchema.safeParse(req.params);
  if (!p.success) return res.status(400).json({ error: "invalid_params", details: p.error.flatten() });
  const studentId = p.data.student_id;

  try {
    const out = await withTx(async (client) => {
      const meQ = await client.query<{ tipo: string }>(
        `select tipo::text as tipo from public.profiles where id = $1`,
        [professionalId],
      );
      const tipo = meQ.rows[0]?.tipo ?? null;
      if (tipo !== "personal" && tipo !== "nutricionista") {
        return { ok: false as const, error: "not_professional" as const };
      }
      const linkQ = await client.query(
        `
        select 1 from public.student_professional_links
        where student_id = $1 and professional_id = $2 and status = 'active'
        limit 1
        `,
        [studentId, professionalId],
      );
      if (!linkQ.rowCount) return { ok: false as const, error: "student_not_linked" as const };

      const q = await client.query(
        `select ${SELECT_COLS} from public.par_q_responses where student_id = $1`,
        [studentId],
      );
      return { ok: true as const, row: q.rows[0] ?? null };
    });

    if (!out.ok) return res.status(403).json({ error: out.error });
    return res.json({ par_q: out.row ? mapRow(out.row) : null });
  } catch {
    return res.status(500).json({ error: "internal_error" });
  }
});

// [ACTUS-NEW] GET /professional/students/par-q — status do Par-Q de TODOS os alunos
// vinculados (uma chamada). Alimenta o selo "Atenção" na lista de alunos do app.
// Retorna só os alunos que JÁ responderam; o cliente deriva o status (e "não respondido").
export const professionalParqListRouter = Router();
professionalParqListRouter.get("/", async (req, res) => {
  const professionalId = authedUserId(req);
  try {
    const out = await withTx(async (client) => {
      const meQ = await client.query<{ tipo: string }>(
        `select tipo::text as tipo from public.profiles where id = $1`,
        [professionalId],
      );
      const tipo = meQ.rows[0]?.tipo ?? null;
      if (tipo !== "personal" && tipo !== "nutricionista") {
        return { ok: false as const, error: "not_professional" as const };
      }
      const q = await client.query(
        `
        select pr.${SELECT_COLS.split(", ").join(", pr.")}
        from public.par_q_responses pr
        join public.student_professional_links spl on spl.student_id = pr.student_id
        where spl.professional_id = $1 and spl.status = 'active'
        `,
        [professionalId],
      );
      return { ok: true as const, rows: q.rows };
    });
    if (!out.ok) return res.status(403).json({ error: out.error });
    return res.json({ par_q: out.rows.map(mapRow) });
  } catch {
    return res.status(500).json({ error: "internal_error" });
  }
});
