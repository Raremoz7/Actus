export function addDaysIso(dateStr, deltaDays) {
    const [y, m, d] = dateStr.split("-").map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d));
    dt.setUTCDate(dt.getUTCDate() + deltaDays);
    return dt.toISOString().slice(0, 10);
}
function minDate(a, b) {
    return a <= b ? a : b;
}
function formatDateOnly(d) {
    if (d instanceof Date)
        return d.toISOString().slice(0, 10);
    return String(d ?? "").slice(0, 10);
}
export async function fetchStudentLocalToday(client, studentId) {
    const tzQ = await client.query(`select coalesce(timezone, 'UTC') as timezone from public.profiles where id = $1`, [studentId]);
    if (!tzQ.rows[0])
        return null;
    const timezone = tzQ.rows[0].timezone ?? "UTC";
    const todayR = await client.query(`select (timezone($1::text, now()))::date as d`, [timezone]);
    const today = formatDateOnly(todayR.rows[0]?.d);
    if (!today)
        return null;
    return { today, timezone };
}
export async function fetchActivityDatesInRange(client, studentId, rangeStart, rangeEnd) {
    const q = await client.query(`select * from public.activity_dates_for_student($1::uuid)`, [studentId]);
    return q.rows
        .map((r) => formatDateOnly(r.d ?? Object.values(r)[0]))
        .filter((d) => Boolean(d) && d >= rangeStart && d <= rangeEnd)
        .sort();
}
export function computeChallengeMetrics(activityDatesSorted, starts_on, ends_on, today) {
    const rangeEnd = minDate(ends_on, today);
    if (rangeEnd < starts_on) {
        return {
            active_days: 0,
            streak_current_in_challenge: 0,
            streak_best_in_challenge: 0,
            last_activity_date: null,
        };
    }
    const unique = [...new Set(activityDatesSorted.filter((d) => d >= starts_on && d <= rangeEnd))].sort();
    const set = new Set(unique);
    const active_days = unique.length;
    const last_activity_date = unique.length ? unique[unique.length - 1] : null;
    let anchor = rangeEnd;
    while (anchor >= starts_on && !set.has(anchor)) {
        anchor = addDaysIso(anchor, -1);
    }
    let streak_current_in_challenge = 0;
    if (anchor >= starts_on) {
        let d = anchor;
        while (d >= starts_on && set.has(d)) {
            streak_current_in_challenge++;
            d = addDaysIso(d, -1);
        }
    }
    let streak_best_in_challenge = 0;
    let run = 0;
    let prev = null;
    for (const d of unique) {
        if (prev === null || addDaysIso(prev, 1) === d) {
            run++;
        }
        else {
            run = 1;
        }
        if (run > streak_best_in_challenge)
            streak_best_in_challenge = run;
        prev = d;
    }
    return { active_days, streak_current_in_challenge, streak_best_in_challenge, last_activity_date };
}
function rowDates(c) {
    return {
        ...c,
        starts_on: formatDateOnly(c.starts_on),
        ends_on: formatDateOnly(c.ends_on),
    };
}
export async function loadChallengeForOwner(client, challengeId, ownerId) {
    const q = await client.query(`
    select id, owner_professional_id, name, starts_on, ends_on, visibility::text, status::text, created_at, updated_at
    from public.challenges
    where id = $1 and owner_professional_id = $2
    `, [challengeId, ownerId]);
    const r = q.rows[0];
    return r ? rowDates(r) : null;
}
export async function loadChallengeById(client, challengeId) {
    const q = await client.query(`
    select id, owner_professional_id, name, starts_on, ends_on, visibility::text, status::text, created_at, updated_at
    from public.challenges
    where id = $1
    `, [challengeId]);
    const r = q.rows[0];
    return r ? rowDates(r) : null;
}
export async function buildRankingRows(client, challenge, includeDisplayName) {
    const scoringEnabled = challenge.status === "active";
    const pq = await client.query(`
    select cp.student_id, pr.display_name
    from public.challenge_participants cp
    join public.profiles pr on pr.id = cp.student_id
    where cp.challenge_id = $1 and cp.status = 'active'
    `, [challenge.id]);
    const rows = [];
    for (const p of pq.rows) {
        const local = await fetchStudentLocalToday(client, p.student_id);
        const today = local?.today ?? challenge.ends_on;
        let metrics = {
            active_days: 0,
            streak_current_in_challenge: 0,
            streak_best_in_challenge: 0,
            last_activity_date: null,
        };
        if (scoringEnabled) {
            const dates = await fetchActivityDatesInRange(client, p.student_id, challenge.starts_on, challenge.ends_on);
            metrics = computeChallengeMetrics(dates, challenge.starts_on, challenge.ends_on, today);
        }
        rows.push({
            position: 0,
            student_id: p.student_id,
            display_name: includeDisplayName ? p.display_name : null,
            active_days: metrics.active_days,
            streak_current_in_challenge: metrics.streak_current_in_challenge,
            streak_best_in_challenge: metrics.streak_best_in_challenge,
            last_activity_date: metrics.last_activity_date,
        });
    }
    rows.sort((a, b) => {
        if (b.streak_current_in_challenge !== a.streak_current_in_challenge) {
            return b.streak_current_in_challenge - a.streak_current_in_challenge;
        }
        if (b.active_days !== a.active_days)
            return b.active_days - a.active_days;
        return a.student_id.localeCompare(b.student_id);
    });
    rows.forEach((r, i) => {
        r.position = i + 1;
    });
    return rows;
}
