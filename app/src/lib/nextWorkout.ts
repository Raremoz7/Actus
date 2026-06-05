import type { StudentWorkout, Weekday } from '@/types/workouts';

export type NextWorkout = {
  next: StudentWorkout | null;
  isToday: boolean;
  rest: StudentWorkout[];
};

// Elege o próximo treino entre os atribuídos, dado o weekday local (1=seg..7=dom).
// Hoje tem prioridade; senão o de menor distância à frente (circular); desempate por display_order.
export function pickNextWorkout(items: StudentWorkout[], todayWeekday: Weekday): NextWorkout {
  const active = items
    .filter((i) => i.is_active)
    .slice()
    .sort((a, b) => a.display_order - b.display_order);

  if (active.length === 0) return { next: null, isToday: false, rest: [] };

  const today = active.find((i) => i.weekdays.includes(todayWeekday));
  if (today) {
    return { next: today, isToday: true, rest: active.filter((i) => i !== today) };
  }

  for (let d = 1; d <= 7; d += 1) {
    const wd = (((todayWeekday - 1 + d) % 7) + 1) as Weekday;
    const found = active.find((i) => i.weekdays.includes(wd));
    if (found) return { next: found, isToday: false, rest: active.filter((i) => i !== found) };
  }

  return { next: null, isToday: false, rest: active };
}
