import { Router } from "express";
import { z } from "zod";
import { authedUserId } from "../middleware/requireAuth.js";
import { withTx } from "../db.js";
import { sendInternalError } from "../schemaCompat.js";
import { isoWeekdayFromDateOnly } from "./meStudentProgram.js";
import { effectiveStreak } from "../services/streakService.js";
const router = Router();
const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
function addDaysIso(dateStr, deltaDays) {
    const [y, m, d] = dateStr.split("-").map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d));
    dt.setUTCDate(dt.getUTCDate() + deltaDays);
    return dt.toISOString().slice(0, 10);
}
/** Semana corrente (segunda) no fuso do aluno, via Postgres. */
async function resolveWeekMonday(client, studentId, weekStartParam) {
    const tzQ = await client.query(`select coalesce(timezone, 'UTC') as timezone from public.profiles where id = $1`, [studentId]);
    if (!tzQ.rows[0])
        return null;
    const timezone = tzQ.rows[0].timezone ?? "UTC";
    const todayR = await client.query(`select (timezone($1::text, now()))::date as d`, [timezone]);
    const rawD = todayR.rows[0]?.d;
    const today = rawD instanceof Date ? rawD.toISOString().slice(0, 10) : String(rawD ?? "").slice(0, 10);
    if (weekStartParam != null) {
        return { week_monday: weekStartParam, today, timezone };
    }
    const r = await client.query(`
    with loc as (
      select (timezone(coalesce(p.timezone, 'UTC'), now()))::date as local_d
      from public.profiles p
      where p.id = $1
    )
    select (local_d - ((extract(isodow from local_d))::int - 1))::date as week_monday
    from loc
    `, [studentId]);
    const rawM = r.rows[0]?.week_monday;
    const week_monday = rawM instanceof Date ? rawM.toISOString().slice(0, 10) : String(rawM ?? "").slice(0, 10);
    if (!week_monday)
        return null;
    return { week_monday, today, timezone };
}
router.get("/gamification/weekly-overview", async (req, res) => {
    const studentId = authedUserId(req);
    const wsRaw = req.query.week_start;
    const weekStartParam = typeof wsRaw === "string" ? wsRaw : undefined;
    if (weekStartParam !== undefined && !dateOnly.safeParse(weekStartParam).success) {
        return res.status(400).json({ error: "invalid_query", detail: "week_start must be YYYY-MM-DD" });
    }
    if (weekStartParam !== undefined && isoWeekdayFromDateOnly(weekStartParam) !== 1) {
        return res.status(400).json({ error: "week_start_not_monday", detail: "week_start must be a Monday (ISO weekday 1)" });
    }
    try {
        const payload = await withTx(async (client) => {
            const resolved = await resolveWeekMonday(client, studentId, weekStartParam);
            if (!resolved) {
                return { ok: false, error: "profile_not_found" };
            }
            const weekEnd = addDaysIso(resolved.week_monday, 6);
            const streakQ = await client.query(`select streak_current, streak_best, last_activity_at from public.profiles where id = $1`, [studentId]);
            const streakRow = streakQ.rows[0];
            const eff = effectiveStreak(streakRow?.streak_current ?? 0, streakRow?.last_activity_at ?? null, new Date());
            const streak_current = eff.streak_current;
            const streak_best = streakRow?.streak_best ?? 0;
            const is_broken = eff.is_broken;
            const last_activity_at = streakRow?.last_activity_at
                ? new Date(streakRow.last_activity_at).toISOString()
                : null;
            const days = [];
            for (let i = 0; i < 7; i++) {
                const cal = addDaysIso(resolved.week_monday, i);
                const ci = await client.query(`select 1 from public.check_ins c where c.student_id = $1 and c.check_in_date = $2::date limit 1`, [studentId, cal]);
                const ws = await client.query(`
          select 1 from public.workout_sessions ws
          where ws.student_id = $1
            and ws.scheduled_for_date = $2::date
            and ws.status::text in ('completed', 'completed_partial')
          limit 1
          `, [studentId, cal]);
                const has_check_in = (ci.rowCount ?? 0) > 0;
                const has_workout = (ws.rowCount ?? 0) > 0;
                const completed = has_check_in || has_workout;
                const sources = [];
                if (has_check_in)
                    sources.push("check_in");
                if (has_workout)
                    sources.push("workout");
                days.push({
                    weekday: isoWeekdayFromDateOnly(cal),
                    date: cal,
                    completed,
                    sources,
                });
            }
            return {
                ok: true,
                body: {
                    week_start: resolved.week_monday,
                    week_end: weekEnd,
                    today_date: resolved.today,
                    today_weekday: isoWeekdayFromDateOnly(resolved.today),
                    timezone: resolved.timezone,
                    streak_current,
                    streak_best,
                    is_broken,
                    last_activity_at,
                    days,
                },
            };
        });
        if (!payload.ok) {
            return res.status(404).json({ error: payload.error });
        }
        return res.json(payload.body);
    }
    catch (e) {
        return sendInternalError(res, e);
    }
});
export default router;
