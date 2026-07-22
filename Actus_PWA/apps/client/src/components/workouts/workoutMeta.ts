// Helpers de exibição do grupo Treino — texto derivado das datas/exercícios.
// Cálculos puros, sobre 'YYYY-MM-DD' por COMPONENTES (nunca toISOString — bug de fuso UTC-3).
import { shortDateBr } from '@/lib/format';
import type { WorkoutExercise } from '@/types/workouts';

// Nº de dia ordinal estável a partir de 'YYYY-MM-DD'. Só para contar dias inteiros
// entre datas (Date.UTC isola do fuso da máquina; divisão+floor anula o horário).
function dayNumber(dateOnly: string): number {
  const [y, m, d] = dateOnly.split('-').map(Number);
  return Math.floor(Date.UTC(y!, m! - 1, d!) / 86_400_000);
}

function todayDayNumber(): number {
  const now = new Date();
  return Math.floor(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / 86_400_000);
}

// "Última vez" de um treino a partir de last_completed_date (date-only, local).
// null → "ainda não feito"; hoje → "feito hoje"; ontem → "ontem"; senão "há N dias".
export function lastCompletedLabel(lastCompletedDate: string | null): string {
  if (!lastCompletedDate) return 'Ainda não feito';
  const diff = todayDayNumber() - dayNumber(lastCompletedDate);
  if (diff <= 0) return 'Feito hoje';
  if (diff === 1) return 'Ontem';
  return `Há ${diff} dias`;
}

// Vigência do plano a partir de end_date (date-only). null → sem limite.
// Ex.: "2026-06-30" → "Plano até 30 jun".
export function planValidityLabel(endDate: string | null): string | null {
  if (!endDate) return null;
  return `Plano até ${shortDateBr(endDate)}`;
}

// Estimativa de duração na LISTA, onde só há exercise_count (sem séries/reps).
// ~6 min por exercício (séries + descanso + transição), arredondado a múltiplos de 5.
// 0 exercícios → 0 (chamador esconde o "~X min").
export function estMinutesFromCount(exerciseCount: number): number {
  if (exerciseCount <= 0) return 0;
  return Math.max(5, Math.round((exerciseCount * 6) / 5) * 5);
}

// Grupos musculares agregados (únicos, na ordem de aparição) a partir dos exercícios.
// Ex.: ["Peito", "Tríceps"] → "Peito · Tríceps".
export function aggregatedMuscleGroups(exercises: Pick<WorkoutExercise, 'muscle_group'>[]): string {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const e of exercises) {
    const g = e.muscle_group?.trim();
    if (g && !seen.has(g)) {
      seen.add(g);
      out.push(g);
    }
  }
  return out.join(' · ');
}
