import type { PoolClient } from "pg";

const DAY_MS = 24 * 60 * 60 * 1000;

export interface StreakRow {
  streak_current: number;
  last_activity_at: Date | null;
  last_credit_date: string | null;
}

export interface StreakEvent {
  at: Date;
  localDate: string; // YYYY-MM-DD no fuso do aluno
}

export interface StreakState {
  streak_current: number;
  last_activity_at: Date;
  last_credit_date: string;
}

/** Lógica pura do streak rolling-24h com debounce de crédito por dia local. */
export function nextStreakState(prev: StreakRow, ev: StreakEvent): StreakState {
  const L = prev.last_activity_at;
  if (L == null) {
    return { streak_current: 1, last_activity_at: ev.at, last_credit_date: ev.localDate };
  }
  const gap = ev.at.getTime() - L.getTime();
  if (gap > DAY_MS) {
    return { streak_current: 1, last_activity_at: ev.at, last_credit_date: ev.localDate };
  }
  if (ev.localDate !== prev.last_credit_date) {
    return {
      streak_current: prev.streak_current + 1,
      last_activity_at: ev.at,
      last_credit_date: ev.localDate,
    };
  }
  return {
    streak_current: prev.streak_current,
    last_activity_at: ev.at,
    last_credit_date: prev.last_credit_date,
  };
}

/** Valor efetivo na leitura: quebra se passou de 24h sem atividade. */
export function effectiveStreak(
  stored: number,
  lastActivityAt: Date | null,
  now: Date,
): { streak_current: number; is_broken: boolean } {
  if (lastActivityAt == null) return { streak_current: 0, is_broken: false };
  const broken = now.getTime() - lastActivityAt.getTime() > DAY_MS;
  return broken ? { streak_current: 0, is_broken: true } : { streak_current: stored, is_broken: false };
}

/** Recalcula e persiste o streak do aluno na transação dada. Retorna o novo estado. */
export async function recomputeStreak(
  client: PoolClient,
  studentId: string,
  ev: StreakEvent,
): Promise<StreakState> {
  const q = await client.query<StreakRow>(
    `select streak_current, last_activity_at, last_credit_date
       from public.profiles where id = $1`,
    [studentId],
  );
  const prev = q.rows[0] ?? { streak_current: 0, last_activity_at: null, last_credit_date: null };
  const next = nextStreakState(prev, ev);
  await client.query(
    `update public.profiles
        set streak_current = $2,
            streak_best = case when $2 > streak_best then $2 else streak_best end,
            last_activity_at = $3,
            last_credit_date = $4,
            last_activity_date = $4::date,
            updated_at = now()
      where id = $1`,
    [studentId, next.streak_current, next.last_activity_at, next.last_credit_date],
  );
  return next;
}
