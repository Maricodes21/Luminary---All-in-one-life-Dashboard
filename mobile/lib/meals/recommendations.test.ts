import assert from 'node:assert/strict';
import test from 'node:test';

import { recipeCatalog } from './catalog';
import { buildCatalogPlan, recommendForNow } from './recommendations';
import type { DailyNutritionTarget, NutritionProfile } from './types';

const profile: NutritionProfile = {
  dateOfBirth: '1994-05-20', biologicalSex: 'female', activityLevel: 'moderate', goal: 'maintain',
  heightCm: 168, weightKg: 66, updatedAt: '2026-07-13T08:00:00.000Z',
  dietaryPreferences: [], foodAllergies: [], dislikedIngredients: [], maxPrepMinutes: 45,
};
const target: DailyNutritionTarget = { localDate: '2026-07-13', calories: 2100, proteinG: 120, carbsG: 245, fatG: 65, calculatedAt: '2026-07-13T00:00:00.000Z' };

test('recommendation respects the current meal window and remaining calories', () => {
  const result = recommendForNow({ recipes: recipeCatalog, profile, target, meals: [], now: new Date('2026-07-13T12:30:00+02:00') });
  assert.equal(result.primary?.mealType, 'lunch');
  assert.ok((result.primary?.nutrition.calories ?? Infinity) <= target.calories);
  assert.ok(result.candidates.every((recipe) => recipe.nutrition.calories <= target.calories));
});

test('overnight recommendation is snack-only and never exceeds remaining calories', () => {
  const result = recommendForNow({ recipes: recipeCatalog, profile, target: { ...target, calories: 300 }, meals: [], now: new Date('2026-07-13T23:30:00+02:00') });
  assert.equal(result.primary?.mealType, 'snack');
  assert.ok((result.primary?.nutrition.calories ?? Infinity) <= 300);
});

test('weekly catalog plan stays within daily targets and uses valid recipe IDs', () => {
  const plan = buildCatalogPlan({ recipes: recipeCatalog, profile, target, weekOf: '2026-07-13', options: { days: 7, mealTypes: ['breakfast', 'lunch', 'dinner'], includeSnack: true } });
  assert.equal(new Set(plan.entries.map((entry) => entry.localDate)).size, 7);
  for (const date of new Set(plan.entries.map((entry) => entry.localDate))) {
    const calories = plan.entries.filter((entry) => entry.localDate === date).reduce((sum, entry) => sum + (entry.nutrition?.calories ?? 0), 0);
    assert.ok(calories <= target.calories, `${date} exceeds target with ${calories}`);
  }
  assert.ok(plan.entries.every((entry) => recipeCatalog.some((recipe) => recipe.id === entry.recipeId)));
});

test('allergy and diet constraints remove invalid recipes before ranking', () => {
  const veganNutFree = { ...profile, dietaryPreferences: ['vegan'], foodAllergies: ['peanut', 'almond', 'walnut', 'cashew', 'pistachio'] };
  const plan = buildCatalogPlan({ recipes: recipeCatalog, profile: veganNutFree, target, weekOf: '2026-07-13', options: { days: 3, mealTypes: ['breakfast', 'lunch', 'dinner'], includeSnack: false } });
  for (const entry of plan.entries) {
    const recipe = recipeCatalog.find((item) => item.id === entry.recipeId);
    assert.ok(recipe?.dietaryTags.includes('vegan'));
    assert.ok(recipe?.ingredients.every((ingredient) => !veganNutFree.foodAllergies.some((allergen) => ingredient.name.toLowerCase().includes(allergen))));
  }
});
