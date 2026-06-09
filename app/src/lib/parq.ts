// src/lib/parq.ts
// Lógica pura do Par-Q: derivações e datas. Datas SEMPRE por componentes locais
// (formatDateLocal) — nunca toISOString (bug de fuso UTC-3).
import { formatDateLocal } from '@/lib/format';
import { ParqSubmissionSchema, type ParqAnswer, type ParqSubmission } from '@/types/parq';

export type ParqStatus = 'not_started' | 'clear' | 'attention' | 'expired';

export function deriveAnyYes(answers: ParqAnswer[]): boolean {
  return answers.some((a) => a.value === true);
}

// answeredAt + 12 meses, mantendo dia/mês (year + 1). O Date normaliza 29/02 → 01/03.
export function computeValidUntil(answeredAt: Date): string {
  const next = new Date(
    answeredAt.getFullYear() + 1,
    answeredAt.getMonth(),
    answeredAt.getDate(),
  );
  return formatDateLocal(next);
}

export function buildSubmission(
  studentId: string,
  answers: ParqAnswer[],
  today: Date,
): ParqSubmission {
  return ParqSubmissionSchema.parse({
    student_id: studentId,
    answers,
    any_yes: deriveAnyYes(answers),
    answered_at: formatDateLocal(today),
    valid_until: computeValidUntil(today),
  });
}

export function parqStatus(sub: ParqSubmission | null, today: Date): ParqStatus {
  if (!sub) return 'not_started';
  // Comparação lexicográfica de YYYY-MM-DD equivale à comparação cronológica.
  if (sub.valid_until < formatDateLocal(today)) return 'expired';
  return sub.any_yes ? 'attention' : 'clear';
}

// O aluno precisa (re)responder quando nunca respondeu ou o Par-Q expirou.
export function isParqPending(status: ParqStatus): boolean {
  return status === 'not_started' || status === 'expired';
}
