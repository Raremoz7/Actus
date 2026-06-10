import type { PoolClient } from "pg";
import { isMissingDbObjectError } from "./schemaCompat.js";

export type CheckInListItem = {
  id: string;
  check_in_date: string;
  source: string;
  created_at: string;
  workout_session_id: string | null;
};

function formatCheckInDate(v: unknown): string {
  if (v == null) return "";
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (typeof v === "string") return v.slice(0, 10);
  return String(v).slice(0, 10);
}

function toCreatedIso(v: unknown): string {
  if (v instanceof Date) return v.toISOString();
  const d = new Date(v as string);
  return d.toISOString();
}

/** Lista check-ins do aluno (mais recentes primeiro). */
export async function queryCheckInsForStudent(
  client: PoolClient,
  studentId: string,
  options: { from?: string; to?: string; limit: number },
): Promise<CheckInListItem[]> {
  const params: unknown[] = [studentId];
  let where = `where c.student_id = $1`;
  let p = 2;
  if (options.from) {
    where += ` and c.check_in_date >= $${p}::date`;
    params.push(options.from);
    p++;
  }
  if (options.to) {
    where += ` and c.check_in_date <= $${p}::date`;
    params.push(options.to);
    p++;
  }
  params.push(options.limit);
  const lim = `$${p}`;

  try {
    const q = await client.query<{
      id: string;
      check_in_date: unknown;
      source: string;
      created_at: Date;
      workout_session_id: string | null;
    }>(
      `
      select c.id, c.check_in_date, c.source, c.created_at,
             c.workout_session_id::text as workout_session_id
      from public.check_ins c
      ${where}
      order by c.check_in_date desc, c.created_at desc
      limit ${lim}
      `,
      params,
    );
    return q.rows.map((r) => ({
      id: r.id,
      check_in_date: formatCheckInDate(r.check_in_date),
      source: r.source,
      created_at: toCreatedIso(r.created_at),
      workout_session_id: r.workout_session_id,
    }));
  } catch (err) {
    if (!isMissingDbObjectError(err)) throw err;
    const q = await client.query<{
      id: string;
      check_in_date: unknown;
      source: string;
      created_at: Date;
    }>(
      `
      select c.id, c.check_in_date, c.source, c.created_at
      from public.check_ins c
      ${where}
      order by c.check_in_date desc, c.created_at desc
      limit ${lim}
      `,
      params,
    );
    return q.rows.map((r) => ({
      id: r.id,
      check_in_date: formatCheckInDate(r.check_in_date),
      source: r.source,
      created_at: toCreatedIso(r.created_at),
      workout_session_id: null,
    }));
  }
}
