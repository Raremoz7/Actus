// [ACTUS — academia] Cálculo de comissão em TypeScript (e não em função SQL) por testabilidade:
// os testes rodam em pg-mem, que não cobre bem plpgsql/índices parciais. Aqui ficam funções puras
// sobre dados já buscados; o desacoplamento do financeiro é honrado em `baseCentsFor` (billing
// substitui manual sem mudar schema nem contrato).
/** Regra vigente no período: específica do instrutor tem prioridade sobre a default da academia. */
export function pickRule(rules, instructorId, periodStart, periodEnd) {
    const vigent = rules.filter((r) => r.active && r.effective_from <= periodEnd && (r.effective_to == null || r.effective_to >= periodStart));
    const byRecency = (a, b) => b.effective_from.localeCompare(a.effective_from);
    const specific = vigent.filter((r) => r.instructor_user_id === instructorId).sort(byRecency)[0];
    if (specific)
        return specific;
    return vigent.filter((r) => r.instructor_user_id == null).sort(byRecency)[0] ?? null;
}
/** Base de receita do instrutor no período. billing substitui manual quando existir (desacoplamento). */
export function baseCentsFor(entries, instructorId) {
    const mine = entries.filter((e) => e.instructor_user_id === instructorId);
    const billing = mine.filter((e) => e.source === "billing");
    const used = billing.length > 0 ? billing : mine.filter((e) => e.source === "manual");
    return used.reduce((sum, e) => sum + e.amount_cents, 0);
}
export function commissionForRule(rule, baseCents, studentCount) {
    if (!rule)
        return 0;
    if (rule.rule_type === "percent")
        return Math.round((baseCents * (rule.percent ?? 0)) / 100);
    if (rule.rule_type === "fixed_per_student")
        return (rule.amount_cents ?? 0) * studentCount;
    if (rule.rule_type === "fixed_monthly")
        return rule.amount_cents ?? 0;
    return 0;
}
export function buildCommissionReport(params) {
    const { instructors, rules, entries, payouts, periodStart, periodEnd } = params;
    return instructors.map((ins) => {
        const base = baseCentsFor(entries, ins.user_id);
        const rule = pickRule(rules, ins.user_id, periodStart, periodEnd);
        const commission = commissionForRule(rule, base, ins.student_count);
        const payout = payouts.find((p) => p.instructor_user_id === ins.user_id);
        return {
            instructor_user_id: ins.user_id,
            display_name: ins.display_name,
            student_count: ins.student_count,
            base_cents: base,
            rule_type: rule?.rule_type ?? null,
            commission_cents: commission,
            status: payout?.status ?? "pending",
        };
    });
}
/** Primeiro e último dia (YYYY-MM-DD) do mês de competência "YYYY-MM". */
export function monthBounds(period) {
    const [y, m] = period.split("-").map((s) => Number(s));
    const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
    const mm = String(m).padStart(2, "0");
    return { start: `${y}-${mm}-01`, end: `${y}-${mm}-${String(last).padStart(2, "0")}`, monthStart: `${y}-${mm}-01` };
}
