import { formatDateLocal } from '@/lib/format';
import type { MealComment } from '@/types/meals';

// Refeição normalizada consumida pelo feed/card: unifica item do servidor e da fila.
export interface FeedMeal {
  key: string;            // id do servidor ou localId da fila
  id: string | null;      // id do servidor (null enquanto pendente)
  photoUri: string | null;
  eatenAt: string;        // ISO
  description: string | null;
  tags: string[];
  comments: MealComment[];
  sync: 'synced' | 'pending' | 'error';
}

export interface DayGroup {
  dateKey: string;   // YYYY-MM-DD local
  dayLabel: string;  // "Terça · 01 jul"
  meals: FeedMeal[];
}

const DIAS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

function dayLabelLocal(d: Date): string {
  return `${DIAS[d.getDay()]} · ${String(d.getDate()).padStart(2, '0')} ${MESES[d.getMonth()]}`;
}

// "Salvar" habilita com horário + (descrição não-vazia OU foto).
export function isMealInputValid(input: {
  eatenAt: string;
  description: string | null;
  photoUri: string | null;
}): boolean {
  if (!input.eatenAt) return false;
  const hasDesc = (input.description ?? '').trim().length > 0;
  const hasPhoto = (input.photoUri ?? '').length > 0;
  return hasDesc || hasPhoto;
}

// HH:MM em componentes LOCAIS do Date (nunca toISOString — regra de fuso do app).
export function mealTimeLabel(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

// Agrupa por dia LOCAL, dias mais recentes primeiro e refeições recentes primeiro no dia.
export function groupFeedByDay(meals: FeedMeal[]): DayGroup[] {
  const byDay = new Map<string, FeedMeal[]>();
  for (const m of meals) {
    const d = new Date(m.eatenAt);
    if (Number.isNaN(d.getTime())) continue;
    const key = formatDateLocal(d);
    const arr = byDay.get(key) ?? [];
    arr.push(m);
    byDay.set(key, arr);
  }
  return [...byDay.entries()]
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .map(([dateKey, list]) => ({
      dateKey,
      dayLabel: dayLabelLocal(new Date(list[0]!.eatenAt)),
      meals: list.sort(
        (a, b) => new Date(b.eatenAt).getTime() - new Date(a.eatenAt).getTime(),
      ),
    }));
}
