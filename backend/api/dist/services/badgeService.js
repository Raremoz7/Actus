/** Lógica pura: badges do catálogo cujo critério é satisfeito e ainda não conquistados. */
export function selectNewlyEarned(catalog, earned, m) {
    return catalog.filter((b) => {
        if (!b.active || earned.has(b.id))
            return false;
        switch (b.criteria_type) {
            case "workout_count":
                return m.total_workouts_completed >= (b.criteria_threshold ?? Infinity);
            case "streak":
                return m.streak_current >= (b.criteria_threshold ?? Infinity);
            case "personal_record":
                return m.had_pr;
            default:
                return false;
        }
    });
}
/**
 * Avalia e persiste badges recém-conquistados na transação dada.
 * Retorna os badges recém-inseridos (para overlay/push).
 */
export async function evaluateBadges(client, studentId, m, earnedAt) {
    const catQ = await client.query(`select id, name, description, criteria_type, criteria_threshold, asset_key, sort_order, active
       from public.badges where active = true order by sort_order`);
    const earnedQ = await client.query(`select badge_id from public.student_badges where student_id = $1`, [studentId]);
    const earned = new Set(earnedQ.rows.map((r) => r.badge_id));
    const candidates = selectNewlyEarned(catQ.rows, earned, m);
    const inserted = [];
    for (const b of candidates) {
        const res = await client.query(`insert into public.student_badges (student_id, badge_id, earned_at, seen_at)
       values ($1, $2, $3, null)
       on conflict (student_id, badge_id) do nothing`, [studentId, b.id, earnedAt]);
        if ((res.rowCount ?? 0) > 0)
            inserted.push(b);
    }
    return inserted;
}
