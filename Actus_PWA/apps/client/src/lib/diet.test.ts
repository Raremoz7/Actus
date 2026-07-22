import { dietTotals, hasAnyMacro } from './diet';
import type { Meal } from '@/types/diets';

const meals: Meal[] = [
  { name: 'A', kcal: 450, protein: 30, carbs: 50, fat: 12 },
  { name: 'B', kcal: 600, protein: 45 },
  { name: 'C' },
];

describe('dietTotals', () => {
  it('soma só os macros presentes', () => {
    expect(dietTotals(meals)).toEqual({ kcal: 1050, protein: 75, carbs: 50, fat: 12 });
  });

  it('lista vazia → zeros', () => {
    expect(dietTotals([])).toEqual({ kcal: 0, protein: 0, carbs: 0, fat: 0 });
  });

  it('hasAnyMacro reflete presença de macro', () => {
    expect(hasAnyMacro([{ name: 'X' }])).toBe(false);
    expect(hasAnyMacro(meals)).toBe(true);
  });
});
