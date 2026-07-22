// [ACTUS — academia] Helpers de comissão no front: formatação BRL, parsing de input e rótulos.
// Valores trafegam em centavos (inteiros) com o backend; a UI converte na borda.

export function formatBRL(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

/** Converte texto digitado (ex: "1.234,56" ou "1234.56") em centavos inteiros. */
export function parseBRLToCents(input: string): number {
  const cleaned = input.trim().replace(/[^\d,.-]/g, '');
  if (!cleaned) return 0;
  // Se tem vírgula, assume formato BR (ponto = milhar, vírgula = decimal).
  const normalized = cleaned.includes(',')
    ? cleaned.replace(/\./g, '').replace(',', '.')
    : cleaned;
  const value = Number(normalized);
  return Number.isFinite(value) ? Math.round(value * 100) : 0;
}

export const ruleTypeLabel: Record<string, string> = {
  percent: 'Percentual',
  fixed_per_student: 'Fixo por aluno',
  fixed_monthly: 'Fixo mensal',
};

/** Competência atual no formato YYYY-MM (UTC-agnóstico o suficiente para uso administrativo). */
export function currentPeriod(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/** Rótulo legível de uma competência YYYY-MM (ex: "jun/2026"). */
export function formatPeriod(period: string): string {
  const [y, m] = period.split('-').map(Number);
  const months = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  return `${months[(m ?? 1) - 1]}/${y}`;
}
