import type { DailyNutritionTarget, MealLogRecord, MealTotals, RemainingNutrition } from './types';

export function calculateMealTotals(meals: readonly MealLogRecord[]): MealTotals {
  let calories = 0;
  let proteinG = 0;
  let carbsG = 0;
  let fatG = 0;
  let macrosComplete = true;

  for (const meal of meals) {
    calories += meal.nutrition.calories;
    proteinG += valueOrZero(meal.nutrition.proteinG);
    carbsG += valueOrZero(meal.nutrition.carbsG);
    fatG += valueOrZero(meal.nutrition.fatG);

    if (meal.nutrition.proteinG == null || meal.nutrition.carbsG == null || meal.nutrition.fatG == null) {
      macrosComplete = false;
    }
  }

  return {
    calories,
    proteinG,
    carbsG,
    fatG,
    macrosComplete,
  };
}

export function calculateRemaining(target: DailyNutritionTarget, totals: Pick<MealTotals, 'calories' | 'proteinG' | 'carbsG' | 'fatG'>): RemainingNutrition {
  return {
    calories: target.calories - totals.calories,
    proteinG: target.proteinG - totals.proteinG,
    carbsG: target.carbsG - totals.carbsG,
    fatG: target.fatG - totals.fatG,
  };
}

function valueOrZero(value: number | null): number {
  return value ?? 0;
}
