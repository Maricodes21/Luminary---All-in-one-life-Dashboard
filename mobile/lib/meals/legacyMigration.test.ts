import assert from 'node:assert/strict';
import test from 'node:test';

import { migrateLegacyMealsState } from './legacyMigration';

test('legacy production-store meals and plan days migrate into the active user model', () => {
  const migrated = migrateLegacyMealsState({
    state: {
      meals: [{
        id: 'legacy_meal', name: 'Morning oats', mealDate: '2026-07-13', mealType: 'breakfast',
        calories: 410, proteinG: 17, carbsG: 62, fatG: 10, prep: 'With berries', source: 'themealdb',
      }],
      mealPlan: [{
        id: 'legacy_day', day: 'Monday', prep: 'Prepare vegetables on Sunday',
        breakfast: {
          name: 'Breakfast burrito', calories: 520, proteinG: 28, carbsG: 55, fatG: 20,
          note: 'Serve warm', recipeId: 'legacy_burrito', imageUrl: 'https://example.com/unverified.jpg',
          ingredients: ['1 wrap', '2 eggs'], prepTimeMinutes: 20, difficulty: 'Easy', servings: 1,
          substitutions: ['Bean burrito'], prepSteps: ['Warm the wrap.', 'Cook the eggs.', 'Fill and roll.'],
        },
        lunch: null,
        dinner: null,
        snacks: [],
      }],
      syncQueue: [{ entity: 'meal_plan', action: 'create', payload: { weekOf: '2026-07-13' } }],
    },
  }, 'Africa/Johannesburg', new Date('2026-07-14T08:00:00.000Z'));

  assert.equal(migrated.meals[0]?.id, 'legacy_meal');
  assert.equal(migrated.meals[0]?.source, 'curated');
  assert.equal(migrated.meals[0]?.notes, 'With berries');
  assert.equal(migrated.plans[0]?.weekOf, '2026-07-13');
  assert.equal(migrated.plans[0]?.entries[0]?.recipeSnapshot?.steps.length, 3);
  assert.equal(migrated.plans[0]?.entries[0]?.imageUri, undefined);
});

test('legacy migration ignores malformed state without inventing records', () => {
  assert.deepEqual(migrateLegacyMealsState({ state: { meals: 'bad', mealPlan: 12 } }, 'UTC'), { meals: [], plans: [] });
  assert.deepEqual(migrateLegacyMealsState(null, 'UTC'), { meals: [], plans: [] });
});
