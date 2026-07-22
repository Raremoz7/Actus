import { Router } from "express";
import { z } from "zod";
import { authedUserId } from "../middleware/requireAuth.js";
import { withTx } from "../db.js";
import { sendInternalError } from "../schemaCompat.js";
import {
  loadChallengeForOwner,
  buildRankingRows,
  type ChallengeRow,
} from "../services/challengeStats.js";

const router = Router();

const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const postChallengeBody = z.object({
  name: z.string().min(1),
  starts_on: dateOnly,
  ends_on: dateOnly,
  visibility: z.enum(["private_ranking", "public_among_participants"]).optional(),
  status: z.enum(["draft", "active"]).optional(),
});

const patchChallengeBody = z
  .object({
    name: z.string().min(1).optional(),
    starts_on: dateOnly.optional(),
    ends_on: dateOnly.optional(),
    visibility: z.enum(["private_ranking", "public_among_participants"]).optional(),
    status: z.enum(["draft", "active", "ended"]).optional(),
  })
  .strict();

const postParticipantsBody = z.object({
  student_ids: z.array(z.string().uuid()).min(1).max(100),
});

function challengeToJson(c: ChallengeRow) {
  return {
    id: c.id,
    owner_professional_id: c.owner_professional_id,
    name: c.name,
    starts_on: c.starts_on,
    ends_on: c.ends_on,
    visibility: c.visibility,
    status: c.status,
    created_at: c.created_at instanceof Date ? c.created_at.toISOString() : String(c.created_at),
    updated_at: c.updated_at instanceof Date ? c.updated_at.toISOString() : String(c.updated_at),
  };
}

function formatChallengeDate(d: unknown): string {
  if (d instanceof Date) return d.toISOString().slice(0, 10);
  return String(d ?? "").slice(0, 10);
}

async function validatePersonalStudents(
  client: import("pg").PoolClient,
  professionalId: string,
  studentIds: string[],
): Promise<string[]> {
  const invalid: string[] = [];
  for (const sid of studentIds) {
    const q = await client.query(
      `
      select 1
      from public.student_professional_links spl
      join public.profiles p on p.id = spl.student_id
      where spl.professional_id = $1
        and spl.student_id = $2
        and spl.status = 'active'
        and spl.professional_role = 'personal'
        and p.tipo = 'aluno'
      limit 1
      `,
      [professionalId, sid],
    );
    if (!q.rows.length) invalid.push(sid);
  }
  return invalid;
}

router.get("/", async (req, res) => {
  const ownerId = authedUserId(req);
  try {
    const out = await withTx(async (client) => {
      const q = await client.query<ChallengeRow>(
        `
        select id, owner_professional_id, name, starts_on, ends_on, visibility::text, status::text, created_at, updated_at
        from public.challenges
        where owner_professional_id = $1
        order by created_at desc
        limit 200
        `,
        [ownerId],
      );
      return q.rows.map((r) =>
        challengeToJson({
          ...r,
          starts_on: formatChallengeDate(r.starts_on),
          ends_on: formatChallengeDate(r.ends_on),
          visibility: r.visibility as ChallengeRow["visibility"],
          status: r.status as ChallengeRow["status"],
        }),
      );
    });
    return res.json({ challenges: out });
  } catch (e: unknown) {
    return sendInternalError(res, e);
  }
});

router.post("/", async (req, res) => {
  const ownerId = authedUserId(req);
  const parsed = postChallengeBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "invalid_body" });
  const b = parsed.data;
  if (b.ends_on < b.starts_on) return res.status(400).json({ error: "invalid_date_range" });
  try {
    const row = await withTx(async (client) => {
      const q = await client.query<ChallengeRow>(
        `
        insert into public.challenges (owner_professional_id, name, starts_on, ends_on, visibility, status)
        values ($1, $2, $3::date, $4::date, coalesce($5::challenge_visibility, 'public_among_participants'), coalesce($6::challenge_status, 'draft'))
        returning id, owner_professional_id, name, starts_on, ends_on, visibility::text, status::text, created_at, updated_at
        `,
        [ownerId, b.name.trim(), b.starts_on, b.ends_on, b.visibility ?? null, b.status ?? null],
      );
      const r = q.rows[0]!;
      return {
        ...r,
        starts_on: formatChallengeDate(r.starts_on),
        ends_on: formatChallengeDate(r.ends_on),
        visibility: r.visibility as ChallengeRow["visibility"],
        status: r.status as ChallengeRow["status"],
      };
    });
    return res.status(201).json({ challenge: challengeToJson(row) });
  } catch (e: unknown) {
    return sendInternalError(res, e);
  }
});

router.get("/:challenge_id", async (req, res) => {
  const ownerId = authedUserId(req);
  const challengeId = req.params.challenge_id;
  if (!z.string().uuid().safeParse(challengeId).success) {
    return res.status(400).json({ error: "invalid_challenge_id" });
  }
  try {
    const payload = await withTx(async (client) => {
      const challenge = await loadChallengeForOwner(client, challengeId, ownerId);
      if (!challenge) return { ok: false as const, error: "not_found" as const };
      const pq = await client.query<{
        student_id: string;
        status: string;
        invited_at: Date;
        responded_at: Date | null;
        display_name: string | null;
      }>(
        `
        select cp.student_id, cp.status::text, cp.invited_at, cp.responded_at, pr.display_name
        from public.challenge_participants cp
        join public.profiles pr on pr.id = cp.student_id
        where cp.challenge_id = $1
        order by cp.invited_at asc
        `,
        [challengeId],
      );
      const participants = pq.rows.map((r) => ({
        student_id: r.student_id,
        status: r.status,
        display_name: r.display_name,
        invited_at: r.invited_at instanceof Date ? r.invited_at.toISOString() : String(r.invited_at),
        responded_at: r.responded_at ? (r.responded_at instanceof Date ? r.responded_at.toISOString() : String(r.responded_at)) : null,
      }));
      return { ok: true as const, challenge: challengeToJson(challenge), participants };
    });
    if (!payload.ok) return res.status(404).json({ error: payload.error });
    return res.json({ challenge: payload.challenge, participants: payload.participants });
  } catch (e: unknown) {
    return sendInternalError(res, e);
  }
});

router.patch("/:challenge_id", async (req, res) => {
  const ownerId = authedUserId(req);
  const challengeId = req.params.challenge_id;
  if (!z.string().uuid().safeParse(challengeId).success) {
    return res.status(400).json({ error: "invalid_challenge_id" });
  }
  const parsed = patchChallengeBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "invalid_body" });
  const b = parsed.data;
  if (Object.keys(b).length === 0) return res.status(400).json({ error: "empty_patch" });
  try {
    const payload = await withTx(async (client) => {
      const cur = await loadChallengeForOwner(client, challengeId, ownerId);
      if (!cur) return { ok: false as const, error: "not_found" as const };
      const starts_on = b.starts_on ?? cur.starts_on;
      const ends_on = b.ends_on ?? cur.ends_on;
      if (ends_on < starts_on) return { ok: false as const, error: "invalid_date_range" as const };
      const q = await client.query<ChallengeRow>(
        `
        update public.challenges
        set
          name = coalesce($3, name),
          starts_on = coalesce($4::date, starts_on),
          ends_on = coalesce($5::date, ends_on),
          visibility = coalesce($6::challenge_visibility, visibility),
          status = coalesce($7::challenge_status, status)
        where id = $1 and owner_professional_id = $2
        returning id, owner_professional_id, name, starts_on, ends_on, visibility::text, status::text, created_at, updated_at
        `,
        [
          challengeId,
          ownerId,
          b.name?.trim() ?? null,
          b.starts_on ?? null,
          b.ends_on ?? null,
          b.visibility ?? null,
          b.status ?? null,
        ],
      );
      const r = q.rows[0]!;
      return {
        ok: true as const,
        challenge: challengeToJson({
          ...r,
          starts_on: formatChallengeDate(r.starts_on),
          ends_on: formatChallengeDate(r.ends_on),
          visibility: r.visibility as ChallengeRow["visibility"],
          status: r.status as ChallengeRow["status"],
        }),
      };
    });
    if (!payload.ok) {
      if (payload.error === "not_found") return res.status(404).json({ error: payload.error });
      return res.status(400).json({ error: payload.error });
    }
    return res.json({ challenge: payload.challenge });
  } catch (e: unknown) {
    return sendInternalError(res, e);
  }
});

router.post("/:challenge_id/participants", async (req, res) => {
  const ownerId = authedUserId(req);
  const challengeId = req.params.challenge_id;
  if (!z.string().uuid().safeParse(challengeId).success) {
    return res.status(400).json({ error: "invalid_challenge_id" });
  }
  const parsed = postParticipantsBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "invalid_body" });
  const ids = [...new Set(parsed.data.student_ids)];
  try {
    const payload = await withTx(async (client) => {
      const challenge = await loadChallengeForOwner(client, challengeId, ownerId);
      if (!challenge) return { ok: false as const, error: "not_found" as const };
      if (challenge.status === "ended") return { ok: false as const, error: "challenge_ended" as const };
      const invalid = await validatePersonalStudents(client, ownerId, ids);
      if (invalid.length > 0) {
        return { ok: false as const, error: "invalid_students" as const, invalid };
      }
      let invited = 0;
      for (const sid of ids) {
        const ex = await client.query<{ status: string }>(
          `select status::text from public.challenge_participants where challenge_id = $1 and student_id = $2`,
          [challengeId, sid],
        );
        const st = ex.rows[0]?.status;
        if (st === "active" || st === "invited") continue;
        if (st === "declined") {
          await client.query(
            `
            update public.challenge_participants
            set status = 'invited', invited_at = now(), responded_at = null
            where challenge_id = $1 and student_id = $2
            `,
            [challengeId, sid],
          );
          invited++;
          continue;
        }
        await client.query(
          `
          insert into public.challenge_participants (challenge_id, student_id, status)
          values ($1, $2, 'invited')
          `,
          [challengeId, sid],
        );
        invited++;
      }
      return { ok: true as const, invited_count: invited };
    });
    if (!payload.ok) {
      if (payload.error === "not_found") return res.status(404).json({ error: payload.error });
      if (payload.error === "challenge_ended") return res.status(409).json({ error: payload.error });
      if (payload.error === "invalid_students") {
        return res.status(400).json({ error: payload.error, invalid_student_ids: payload.invalid });
      }
      return res.status(400).json({ error: "unknown" });
    }
    return res.status(200).json({ invited_count: payload.invited_count });
  } catch (e: unknown) {
    return sendInternalError(res, e);
  }
});

router.get("/:challenge_id/ranking", async (req, res) => {
  const ownerId = authedUserId(req);
  const challengeId = req.params.challenge_id;
  if (!z.string().uuid().safeParse(challengeId).success) {
    return res.status(400).json({ error: "invalid_challenge_id" });
  }
  try {
    const payload = await withTx(async (client) => {
      const challenge = await loadChallengeForOwner(client, challengeId, ownerId);
      if (!challenge) return { ok: false as const, error: "not_found" as const };
      const ranking = await buildRankingRows(client, challenge, true);
      return { ok: true as const, visibility: challenge.visibility, ranking };
    });
    if (!payload.ok) return res.status(404).json({ error: payload.error });
    return res.json({ visibility: payload.visibility, ranking: payload.ranking });
  } catch (e: unknown) {
    return sendInternalError(res, e);
  }
});

router.get("/:challenge_id/report", async (req, res) => {
  const ownerId = authedUserId(req);
  const challengeId = req.params.challenge_id;
  if (!z.string().uuid().safeParse(challengeId).success) {
    return res.status(400).json({ error: "invalid_challenge_id" });
  }
  try {
    const payload = await withTx(async (client) => {
      const challenge = await loadChallengeForOwner(client, challengeId, ownerId);
      if (!challenge) return { ok: false as const, error: "not_found" as const };
      const counts = await client.query<{ st: string; n: string }>(
        `
        select status::text as st, count(*)::text as n
        from public.challenge_participants
        where challenge_id = $1
        group by status
        `,
        [challengeId],
      );
      const invited_count = Number(counts.rows.find((x) => x.st === "invited")?.n ?? 0);
      const active_count = Number(counts.rows.find((x) => x.st === "active")?.n ?? 0);
      const declined_count = Number(counts.rows.find((x) => x.st === "declined")?.n ?? 0);
      const ranking = await buildRankingRows(client, challenge, true);
      const sumDays = ranking.reduce((s, r) => s + r.active_days, 0);
      const average_active_days = active_count > 0 ? sumDays / active_count : 0;
      const challengeDaySpan =
        challenge.ends_on >= challenge.starts_on
          ? Math.max(
              1,
              Math.round(
                (new Date(challenge.ends_on + "T12:00:00Z").getTime() - new Date(challenge.starts_on + "T12:00:00Z").getTime()) /
                  (86400 * 1000),
              ) + 1,
            )
          : 1;
      const average_adherence_ratio = active_count > 0 ? sumDays / (active_count * challengeDaySpan) : 0;
      const participants = ranking.map((r) => {
        const streak_broken =
          challenge.status === "active" &&
          r.active_days > 0 &&
          r.streak_current_in_challenge === 0 &&
          r.last_activity_date != null;
        return {
          student_id: r.student_id,
          display_name: r.display_name,
          active_days: r.active_days,
          streak_current_in_challenge: r.streak_current_in_challenge,
          last_activity_date: r.last_activity_date,
          streak_broken_hint: streak_broken,
        };
      });
      return {
        ok: true as const,
        challenge_id: challenge.id,
        invited_count,
        active_count,
        declined_count,
        average_active_days,
        average_adherence_ratio,
        challenge_day_span: challengeDaySpan,
        participants,
      };
    });
    if (!payload.ok) return res.status(404).json({ error: payload.error });
    return res.json(payload);
  } catch (e: unknown) {
    return sendInternalError(res, e);
  }
});

export default router;
