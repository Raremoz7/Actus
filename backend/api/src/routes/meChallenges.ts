import { Router } from "express";
import { z } from "zod";
import { authedUserId } from "../middleware/requireAuth.js";
import { withTx } from "../db.js";
import { sendInternalError } from "../schemaCompat.js";
import { loadChallengeById, buildRankingRows, type ChallengeRow } from "../services/challengeStats.js";

const router = Router();

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

router.get("/challenges", async (req, res) => {
  const studentId = authedUserId(req);
  try {
    const rows = await withTx(async (client) => {
      const q = await client.query<{
        id: string;
        owner_professional_id: string;
        name: string;
        starts_on: unknown;
        ends_on: unknown;
        visibility: string;
        status: string;
        created_at: Date;
        updated_at: Date;
        participant_status: string;
      }>(
        `
        select
          c.id,
          c.owner_professional_id,
          c.name,
          c.starts_on,
          c.ends_on,
          c.visibility::text,
          c.status::text,
          c.created_at,
          c.updated_at,
          cp.status::text as participant_status
        from public.challenge_participants cp
        join public.challenges c on c.id = cp.challenge_id
        where cp.student_id = $1
          and cp.status in ('invited', 'active')
          and c.status in ('draft', 'active')
        order by c.created_at desc
        limit 200
        `,
        [studentId],
      );
      return q.rows.map((r) => ({
        challenge: challengeToJson({
          id: r.id,
          owner_professional_id: r.owner_professional_id,
          name: r.name,
          starts_on: r.starts_on instanceof Date ? r.starts_on.toISOString().slice(0, 10) : String(r.starts_on),
          ends_on: r.ends_on instanceof Date ? r.ends_on.toISOString().slice(0, 10) : String(r.ends_on),
          visibility: r.visibility as ChallengeRow["visibility"],
          status: r.status as ChallengeRow["status"],
          created_at: r.created_at,
          updated_at: r.updated_at,
        }),
        participant_status: r.participant_status,
      }));
    });
    return res.json({ challenges: rows });
  } catch (e: unknown) {
    return sendInternalError(res, e);
  }
});

router.post("/challenges/:challenge_id/accept", async (req, res) => {
  const studentId = authedUserId(req);
  const challengeId = req.params.challenge_id;
  if (!z.string().uuid().safeParse(challengeId).success) {
    return res.status(400).json({ error: "invalid_challenge_id" });
  }
  try {
    const payload = await withTx(async (client) => {
      const c = await loadChallengeById(client, challengeId);
      if (!c) return { ok: false as const, error: "not_found" as const };
      if (c.status === "ended") return { ok: false as const, error: "challenge_ended" as const };
      const pq = await client.query<{ status: string }>(
        `select status::text from public.challenge_participants where challenge_id = $1 and student_id = $2`,
        [challengeId, studentId],
      );
      const st = pq.rows[0]?.status;
      if (st !== "invited") return { ok: false as const, error: "not_invited" as const };
      await client.query(
        `
        update public.challenge_participants
        set status = 'active', responded_at = now()
        where challenge_id = $1 and student_id = $2
        `,
        [challengeId, studentId],
      );
      return { ok: true as const };
    });
    if (!payload.ok) {
      if (payload.error === "not_found") return res.status(404).json({ error: payload.error });
      if (payload.error === "challenge_ended") return res.status(409).json({ error: payload.error });
      if (payload.error === "not_invited") return res.status(409).json({ error: payload.error });
      return res.status(400).json({ error: "unknown" });
    }
    return res.json({ ok: true });
  } catch (e: unknown) {
    return sendInternalError(res, e);
  }
});

router.post("/challenges/:challenge_id/decline", async (req, res) => {
  const studentId = authedUserId(req);
  const challengeId = req.params.challenge_id;
  if (!z.string().uuid().safeParse(challengeId).success) {
    return res.status(400).json({ error: "invalid_challenge_id" });
  }
  try {
    const payload = await withTx(async (client) => {
      const c = await loadChallengeById(client, challengeId);
      if (!c) return { ok: false as const, error: "not_found" as const };
      const pq = await client.query<{ status: string }>(
        `select status::text from public.challenge_participants where challenge_id = $1 and student_id = $2`,
        [challengeId, studentId],
      );
      const st = pq.rows[0]?.status;
      if (st !== "invited") return { ok: false as const, error: "not_invited" as const };
      await client.query(
        `
        update public.challenge_participants
        set status = 'declined', responded_at = now()
        where challenge_id = $1 and student_id = $2
        `,
        [challengeId, studentId],
      );
      return { ok: true as const };
    });
    if (!payload.ok) {
      if (payload.error === "not_found") return res.status(404).json({ error: payload.error });
      if (payload.error === "not_invited") return res.status(409).json({ error: payload.error });
      return res.status(400).json({ error: "unknown" });
    }
    return res.json({ ok: true });
  } catch (e: unknown) {
    return sendInternalError(res, e);
  }
});

router.get("/challenges/:challenge_id/ranking", async (req, res) => {
  const studentId = authedUserId(req);
  const challengeId = req.params.challenge_id;
  if (!z.string().uuid().safeParse(challengeId).success) {
    return res.status(400).json({ error: "invalid_challenge_id" });
  }
  try {
    const payload = await withTx(async (client) => {
      const c = await loadChallengeById(client, challengeId);
      if (!c) return { ok: false as const, error: "not_found" as const };
      if (c.visibility === "private_ranking") {
        return { ok: false as const, error: "ranking_private" as const };
      }
      const pq = await client.query<{ status: string }>(
        `select status::text from public.challenge_participants where challenge_id = $1 and student_id = $2`,
        [challengeId, studentId],
      );
      if (pq.rows[0]?.status !== "active") {
        return { ok: false as const, error: "forbidden_not_participant" as const };
      }
      const ranking = await buildRankingRows(client, c, true);
      return { ok: true as const, visibility: c.visibility, ranking };
    });
    if (!payload.ok) {
      if (payload.error === "not_found") return res.status(404).json({ error: payload.error });
      if (payload.error === "ranking_private") return res.status(403).json({ error: payload.error });
      if (payload.error === "forbidden_not_participant") return res.status(403).json({ error: payload.error });
      return res.status(400).json({ error: "unknown" });
    }
    return res.json({ visibility: payload.visibility, ranking: payload.ranking });
  } catch (e: unknown) {
    return sendInternalError(res, e);
  }
});

export default router;
