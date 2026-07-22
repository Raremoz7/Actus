// [ACTUS — academia] Cálculo de comissão em TypeScript (e não em função SQL) por testabilidade:
// os testes rodam em pg-mem, que não cobre bem plpgsql/índices parciais. Aqui ficam funções puras
// sobre dados já buscados; o desacoplamento do financeiro é honrado em `baseCentsFor` (billing
// substitui manual sem mudar schema nem contrato).

export type CommissionRuleType = "percent" | "fixed_per_student" | "fixed_monthly";

export type CommissionRuleInput = {
  instructor_user_id: string | null; // null = regra default da academia
  rule_type: CommissionRuleType;
  percent: number | null;
  amount_cents: number | null;
  effective_from: string; // YYYY-MM-DD
  effective_to: string | null; // YYYY-MM-DD | null
  active: boolean;
};

export type RevenueEntryInput = {
  instructor_user_id: string;
  amount_cents: number;
  source: "manual" | "billing";
};

export type InstructorInput = {
  user_id: string;
  display_name: string | null;
  student_count: number;
};

export type PayoutInput = {
  instructor_user_id: string;
  status: "pending" | "paid";
};

export type CommissionReportRow = {
  instructor_user_id: string;
  display_name: string | null;
  student_count: number;
  base_cents: number;
  rule_type: CommissionRuleType | null;
  commission_cents: number;
  status: "pending" | "paid";
};

/** Regra vigente no período: específica do instrutor tem prioridade sobre a default da academia. */
export function pickRule(
  rules: CommissionRuleInput[],
  instructorId: string,
  periodStart: string,
  periodEnd: string,
): CommissionRuleInput | null {
  const vigent = rules.filter(
    (r) => r.active && r.effective_from <= periodEnd && (r.effective_to == null || r.effective_to >= periodStart),
  );
  const byRecency = (a: CommissionRuleInput, b: CommissionRuleInput) => b.effective_from.localeCompare(a.effective_from);
  const specific = vigent.filter((r) => r.instructor_user_id === instructorId).sort(byRecency)[0];
  if (specific) return specific;
  return vigent.filter((r) => r.instructor_user_id == null).sort(byRecency)[0] ?? null;
}

/** Base de receita do instrutor no período. billing substitui manual quando existir (desacoplamento). */
export function baseCentsFor(entries: RevenueEntryInput[], instructorId: string): number {
  const mine = entries.filter((e) => e.instructor_user_id === instructorId);
  const billing = mine.filter((e) => e.source === "billing");
  const used = billing.length > 0 ? billing : mine.filter((e) => e.source === "manual");
  return used.reduce((sum, e) => sum + e.amount_cents, 0);
}

export function commissionForRule(rule: CommissionRuleInput | null, baseCents: number, studentCount: number): number {
  if (!rule) return 0;
  if (rule.rule_type === "percent") return Math.round((baseCents * (rule.percent ?? 0)) / 100);
  if (rule.rule_type === "fixed_per_student") return (rule.amount_cents ?? 0) * studentCount;
  if (rule.rule_type === "fixed_monthly") return rule.amount_cents ?? 0;
  return 0;
}

export function buildCommissionReport(params: {
  instructors: InstructorInput[];
  rules: CommissionRuleInput[];
  entries: RevenueEntryInput[];
  payouts: PayoutInput[];
  periodStart: string;
  periodEnd: string;
}): CommissionReportRow[] {
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
export function monthBounds(period: string): { start: string; end: string; monthStart: string } {
  const [y, m] = period.split("-").map((s) => Number(s));
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const mm = String(m).padStart(2, "0");
  return { start: `${y}-${mm}-01`, end: `${y}-${mm}-${String(last).padStart(2, "0")}`, monthStart: `${y}-${mm}-01` };
}
