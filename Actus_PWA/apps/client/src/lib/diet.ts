import type { Meal } from '@/types/diets';

export type DietTotals = { kcal: number; protein: number; carbs: number; fat: number };

// Soma os macros presentes nas refeições (campos opcionais → 0 quando ausentes).
export function dietTotals(meals: Meal[]): DietTotals {
  return meals.reduce<DietTotals>(
    (acc, m) => ({
      kcal: acc.kcal + (m.kcal ?? 0),
      protein: acc.protein + (m.protein ?? 0),
      carbs: acc.carbs + (m.carbs ?? 0),
      fat: acc.fat + (m.fat ?? 0),
    }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0 },
  );
}

// Há algum macro informado em alguma refeição? (controla exibir a faixa de total.)
export function hasAnyMacro(meals: Meal[]): boolean {
  return meals.some(
    (m) => m.kcal != null || m.protein != null || m.carbs != null || m.fat != null,
  );
}
