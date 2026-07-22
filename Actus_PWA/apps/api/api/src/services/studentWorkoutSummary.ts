import type { PoolClient } from "pg";
import {
  REFERENCE_BODY_WEIGHT_KG,
  caloriesFromMet,
  pickMetForSession,
} from "../domain/workoutCalories.js";
import { isMissingDbObjectError } from "../schemaCompat.js";

export type SessionSetRow = {
  workout_exercise_id: string;
  set_index: number;
  weight_kg: string | number | null;
  reps_done: number | null;
  rest_seconds_actual: number | null;
};

export type WorkoutSharePayload = {
  /** Textos prontos para card / Share Sheet (mobile). */
  layout: "strava_style_v1";
  title: string;
  subtitle: string | null;
  duration_label: string;
  metrics: { label: string; value: string }[];
  /** Linhas de destaque (evolução, PR, volume); vazio se sem dados de carga. */
  highlights: string[];
  /** Omitir seção de evolução de cargas no layout (Cenário 4). */
  hide_load_evolution: boolean;
};

export type WorkoutFinishSummary = {
  duration_ms: number;
  duration_label: string;
  total_volume_kg: number;
  has_load_data: boolean;
  estimated_calories_kcal: number;
  calories_method: "met_with_body_weight" | "met_reference_weight";
  /** Evolução por exercício (max carga vs sessão anterior mesma atribuição). */
  load_evolution: {
    workout_exercise_id: string;
    exercise_name: string;
    muscle_group: string | null;
    current_max_kg: number;
    previous_max_kg: number | null;
    delta_kg: number | null;
  }[];
  branding: {
    professional_id: string;
    professional_display_name: string | null;
  } | null;
  share: WorkoutSharePayload;
};

function formatDuration(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) return "0m";
  const totalMin = Math.round(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h <= 0) return `${m}m`;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export async function loadBodyWeightKg(client: PoolClient, studentId: string): Promise<number | null> {
  try {
    const q = await client.query<{ w: string | null }>(
      `select body_weight_kg::text as w from public.user_basic_info where user_id = $1`,
      [studentId],
    );
    const raw = q.rows[0]?.w;
    if (raw == null) return null;
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : null;
  } catch (err) {
    if (isMissingDbObjectError(err)) return null;
    throw err;
  }
}

export async function loadPersonalBranding(client: PoolClient, studentId: string): Promise<{
  professional_id: string;
  professional_display_name: string | null;
} | null> {
  const q = await client.query<{ pid: string; dn: string | null }>(
    `
    select p.id as pid, p.display_name as dn
    from public.student_professional_links spl
    join public.profiles p on p.id = spl.professional_id
    where spl.student_id = $1
      and spl.professional_role = 'personal'
      and spl.status = 'active'
    order by spl.linked_at desc
    limit 1
    `,
    [studentId],
  );
  const r = q.rows[0];
  if (!r) return null;
  return { professional_id: r.pid, professional_display_name: r.dn };
}

async function loadSetsForSession(client: PoolClient, sessionId: string): Promise<SessionSetRow[]> {
  try {
    const q = await client.query<SessionSetRow>(
      `
      select workout_exercise_id::text as workout_exercise_id, set_index,
             weight_kg, reps_done, rest_seconds_actual
      from public.session_sets
      where session_id = $1
      order by workout_exercise_id, set_index
      `,
      [sessionId],
    );
    return q.rows;
  } catch (err) {
    if (isMissingDbObjectError(err)) return [];
    throw err;
  }
}

/** Última sessão concluída (ou parcial) da mesma atribuição, exceto a atual. */
async function loadPreviousSessionId(
  client: PoolClient,
  studentWorkoutId: string,
  excludeSessionId: string,
): Promise<string | null> {
  const q = await client.query<{ id: string }>(
    `
    select id
    from public.workout_sessions
    where student_workout_id = $1
      and id <> $2
      and status::text in ('completed', 'completed_partial')
    order by completed_at desc nulls last, scheduled_for_date desc
    limit 1
    `,
    [studentWorkoutId, excludeSessionId],
  );
  return q.rows[0]?.id ?? null;
}

function maxWeightPerExercise(rows: SessionSetRow[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const r of rows) {
    const w = r.weight_kg == null ? null : Number(r.weight_kg);
    if (w == null || !Number.isFinite(w)) continue;
    const cur = m.get(r.workout_exercise_id) ?? 0;
    if (w > cur) m.set(r.workout_exercise_id, w);
  }
  return m;
}

function totalVolumeKg(rows: SessionSetRow[]): number {
  let v = 0;
  for (const r of rows) {
    const w = r.weight_kg == null ? null : Number(r.weight_kg);
    const reps = r.reps_done ?? 0;
    if (w != null && Number.isFinite(w) && reps > 0) v += w * reps;
  }
  return Math.round(v);
}

export async function buildWorkoutFinishSummary(
  client: PoolClient,
  studentId: string,
  sessionId: string,
  exerciseMeta: {
    workout_exercise_id: string;
    name_snapshot: string;
    muscle_group: string | null;
  }[],
): Promise<WorkoutFinishSummary> {
  const sQ = await client.query<{ started_at: Date; completed_at: Date | null; student_workout_id: string }>(
    `
    select started_at, completed_at, student_workout_id
    from public.workout_sessions
    where id = $1 and student_id = $2
    `,
    [sessionId, studentId],
  );
  const srow = sQ.rows[0];
  const started = srow?.started_at ? new Date(srow.started_at).getTime() : Date.now();
  const completed = srow?.completed_at ? new Date(srow.completed_at).getTime() : Date.now();
  const durationMs = Math.max(0, completed - started);

  const sets = await loadSetsForSession(client, sessionId);
  const volume = totalVolumeKg(sets);
  const hasLoadData = sets.some((r) => {
    const w = r.weight_kg == null ? null : Number(r.weight_kg);
    return w != null && Number.isFinite(w) && w > 0;
  });

  const bodyW = await loadBodyWeightKg(client, studentId);
  const met = pickMetForSession(hasLoadData);
  let caloriesMethod: WorkoutFinishSummary["calories_method"];
  let weightUsed: number;
  if (bodyW != null) {
    weightUsed = bodyW;
    caloriesMethod = "met_with_body_weight";
  } else {
    weightUsed = REFERENCE_BODY_WEIGHT_KG;
    caloriesMethod = "met_reference_weight";
  }
  const kcal = caloriesFromMet(met, weightUsed, durationMs);

  const prevSid = srow?.student_workout_id
    ? await loadPreviousSessionId(client, srow.student_workout_id, sessionId)
    : null;
  const prevSets = prevSid ? await loadSetsForSession(client, prevSid) : [];
  const prevMax = maxWeightPerExercise(prevSets);
  const curMax = maxWeightPerExercise(sets);

  const metaById = new Map(exerciseMeta.map((e) => [e.workout_exercise_id, e]));
  const load_evolution: WorkoutFinishSummary["load_evolution"] = [];
  for (const [weId, cur] of curMax.entries()) {
    const meta = metaById.get(weId);
    const prev = prevMax.get(weId) ?? null;
    let delta: number | null = null;
    if (prev != null) delta = Math.round((cur - prev) * 10) / 10;
    load_evolution.push({
      workout_exercise_id: weId,
      exercise_name: meta?.name_snapshot ?? weId,
      muscle_group: meta?.muscle_group ?? null,
      current_max_kg: cur,
      previous_max_kg: prev,
      delta_kg: delta,
    });
  }
  load_evolution.sort((a, b) => a.exercise_name.localeCompare(b.exercise_name));

  const branding = await loadPersonalBranding(client, studentId);

  const hide_load_evolution = !hasLoadData;
  const highlights: string[] = [];
  if (hasLoadData && volume > 0) {
    highlights.push(`Volume total: ~${volume.toLocaleString("pt-BR")} kg`);
  }
  for (const row of load_evolution) {
    if (row.previous_max_kg != null && row.delta_kg != null && row.delta_kg > 0) {
      highlights.push(`Evolução: +${row.delta_kg} kg em ${row.exercise_name}`);
    } else if (row.previous_max_kg == null && row.current_max_kg > 0) {
      highlights.push(`Novo registro em ${row.exercise_name}: ${row.current_max_kg} kg`);
    }
  }

  const share: WorkoutSharePayload = {
    layout: "strava_style_v1",
    title: "Treino concluído",
    subtitle: branding?.professional_display_name
      ? `com ${branding.professional_display_name}`
      : null,
    duration_label: formatDuration(durationMs),
    metrics: [
      { label: "Duração", value: formatDuration(durationMs) },
      { label: "Calorias (est.)", value: `${kcal} kcal` },
    ],
    highlights: hide_load_evolution ? [] : highlights,
    hide_load_evolution,
  };

  if (!hide_load_evolution && volume > 0) {
    share.metrics.splice(1, 0, { label: "Volume", value: `~${volume.toLocaleString("pt-BR")} kg` });
  }

  return {
    duration_ms: durationMs,
    duration_label: formatDuration(durationMs),
    total_volume_kg: volume,
    has_load_data: hasLoadData,
    estimated_calories_kcal: kcal,
    calories_method: caloriesMethod,
    load_evolution,
    branding,
    share,
  };
}
