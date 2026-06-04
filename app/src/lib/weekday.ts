import type { Weekday } from '@/types/workouts';

// Letra PT do dia (ISO-8601: 1=segunda .. 7=domingo). Seg/Sex/Sáb compartilham "S".
const LETTERS: Record<Weekday, string> = {
  1: 'S',
  2: 'T',
  3: 'Q',
  4: 'Q',
  5: 'S',
  6: 'S',
  7: 'D',
};

export function weekdayLetter(weekday: Weekday): string {
  return LETTERS[weekday]!;
}
