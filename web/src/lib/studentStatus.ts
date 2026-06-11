import type { CheckIn } from './schemas';

// REGRA CRÍTICA: comparação de dia SEMPRE com componentes LOCAIS do Date.
// NUNCA toISOString() — em UTC-3 o dia "vira" 3h antes e quebra "hoje"/"ontem".

/** 'YYYY-MM-DD' → Date local à meia-noite (sem fuso). */
export function parseLocalDate(dateOnly: string): Date {
  const [y, m, d] = dateOnly.split('-').map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
}

/** Date → 'YYYY-MM-DD' usando componentes locais. */
export function formatDateLocal(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Dias inteiros (calendário local) entre a data e hoje. 0 = hoje. */
export function daysSinceLocal(dateOnly: string, now = new Date()): number {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const then = parseLocalDate(dateOnly);
  return Math.round((today.getTime() - then.getTime()) / 86_400_000);
}

export type StudentStatusTone = 'active' | 'default' | 'warn';

export type StudentStatus = {
  label: string;
  tone: StudentStatusTone;
  /** Dias desde o último check-in; null se nunca registrou. */
  daysSince: number | null;
};

/** Deriva o status de atividade do aluno a partir dos check-ins (mais recentes primeiro ou não — ordena aqui). */
export function deriveStudentStatus(checkIns: Pick<CheckIn, 'check_in_date'>[] | undefined): StudentStatus {
  if (!checkIns || checkIns.length === 0) {
    return { label: 'Sem registro', tone: 'default', daysSince: null };
  }
  const latest = checkIns.reduce((a, b) => (b.check_in_date > a.check_in_date ? b : a));
  const days = daysSinceLocal(latest.check_in_date);
  if (days <= 0) return { label: 'Treinou hoje', tone: 'active', daysSince: 0 };
  if (days === 1) return { label: 'Ontem', tone: 'default', daysSince: 1 };
  return {
    label: `${days} dias inativo`,
    tone: days > 7 ? 'warn' : 'default',
    daysSince: days,
  };
}
