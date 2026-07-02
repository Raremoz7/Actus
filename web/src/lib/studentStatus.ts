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

export type WorkoutTemporalTone = 'active' | 'future' | 'done';
export type WorkoutTemporalStatus = { label: string; tone: WorkoutTemporalTone };

/** Status temporal de um treino atribuído, derivado de start/end ('YYYY-MM-DD' local).
 *  Futuro = ainda não começou; Concluído = o período já passou; senão Em andamento
 *  (inclui o caso sem período definido — atribuição em aberto). */
export function deriveWorkoutStatus(
  startDate: string | null,
  endDate: string | null,
  now = new Date(),
): WorkoutTemporalStatus {
  if (startDate && daysSinceLocal(startDate, now) < 0) return { label: 'Futuro', tone: 'future' };
  if (endDate && daysSinceLocal(endDate, now) > 0) return { label: 'Concluído', tone: 'done' };
  return { label: 'Em andamento', tone: 'active' };
}

/** Idade em anos a partir de 'YYYY-MM-DD' (componentes locais; null se inválido). */
export function ageFromBirthDate(birthDate: string | null): number | null {
  if (!birthDate) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(birthDate);
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const now = new Date();
  let age = now.getFullYear() - y;
  if (now.getMonth() + 1 < mo || (now.getMonth() + 1 === mo && now.getDate() < d)) age--;
  return age >= 0 && age < 150 ? age : null;
}
