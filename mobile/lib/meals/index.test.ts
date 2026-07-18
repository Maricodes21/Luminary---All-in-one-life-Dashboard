import assert from 'node:assert/strict';
import test from 'node:test';

import {
  calculateMealTotals,
  calculateRemaining,
  foodSearchResultSchema,
  interpretedFoodQuerySchema,
  localDateKey,
  mealWindowFor,
  parseRecipe,
} from './index';

test('localDateKey uses the local calendar date near Johannesburg midnight instead of UTC', () => {
  const nearMidnight = new Date(2026, 6, 13, 0, 30, 0);

  assert.equal(localDateKey(nearMidnight), '2026-07-13');
  assert.equal(nearMidnight.toISOString().slice(0, 10), '2026-07-12');
});

test('mealWindowFor covers every meal boundary', () => {
  const cases = [
    { time: new Date(2026, 6, 13, 4, 59), expected: 'snack' },
    { time: new Date(2026, 6, 13, 5, 0), expected: 'breakfast' },
    { time: new Date(2026, 6, 13, 10, 59), expected: 'breakfast' },
    { time: new Date(2026, 6, 13, 11, 0), expected: 'lunch' },
    { time: new Date(2026, 6, 13, 15, 59), expected: 'lunch' },
    { time: new Date(2026, 6, 13, 16, 0), expected: 'dinner' },
    { time: new Date(2026, 6, 13, 21, 59), expected: 'dinner' },
    { time: new Date(2026, 6, 13, 22, 0), expected: 'snack' },
  ] as const;

  for (const { time, expected } of cases) {
    assert.equal(mealWindowFor(time), expected);
  }
});

test('calculateMealTotals flags incomplete macros without fabricating nutrition values', () => {
  const totals = calculateMealTotals([
    {
      id: 'meal_1',
      name: 'Oats',
      localDate: '2026-07-13',
      consumedAt: '2026-07-13T07:30:00+02:00',
      timezone: 'Africa/Johannesburg',
      mealType: 'breakfast',
      servingQuantity: 1,
      servingUnit: 'bowl',
      nutrition: { calories: 300, proteinG: null, carbsG: 30, fatG: null },
      source: 'manual',
    },
    {
      id: 'meal_2',
      name: 'Chicken wrap',
      localDate: '2026-07-13',
      consumedAt: '2026-07-13T13:00:00+02:00',
      timezone: 'Africa/Johannesburg',
      mealType: 'lunch',
      servingQuantity: 1,
      servingUnit: 'wrap',
      nutrition: { calories: 250, proteinG: 20, carbsG: null, fatG: 10 },
      source: 'curated',
    },
  ]);

  assert.deepEqual(totals, {
    calories: 550,
    proteinG: 20,
    carbsG: 30,
    fatG: 10,
    macrosComplete: false,
  });
});

test('calculateRemaining preserves negative calorie remainders', () => {
  const remaining = calculateRemaining(
    {
      localDate: '2026-07-13',
      calories: 400,
      proteinG: 90,
      carbsG: 120,
      fatG: 50,
      calculatedAt: '2026-07-13T06:00:00+02:00',
    },
    {
      calories: 550,
      proteinG: 20,
      carbsG: 30,
      fatG: 10,
      macrosComplete: false,
    },
  );

  assert.deepEqual(remaining, {
    calories: -150,
    proteinG: 70,
    carbsG: 90,
    fatG: 40,
  });
});

test('parseRecipe defaults missing arrays to safe empty arrays', () => {
  const parsed = parseRecipe({
    id: 'recipe_1',
    name: 'Overnight oats',
    source: 'curated',
    servings: 1,
  });

  assert.equal(parsed.success, true);
  if (!parsed.success) {
    throw new Error('Expected recipe parse to succeed');
  }

  assert.deepEqual(parsed.data.ingredients, []);
  assert.deepEqual(parsed.data.steps, []);
  assert.deepEqual(parsed.data.substitutions, []);
  assert.deepEqual(parsed.data.dietaryTags, []);
});

test('parseRecipe returns a failure result instead of throwing for malformed payloads', () => {
  assert.doesNotThrow(() => {
    const parsed = parseRecipe({
      id: 'broken_recipe',
      name: 42,
      source: 'curated',
      servings: 'two',
    });

    assert.equal(parsed.success, false);
  });
});

test('food search results reject AI nutrition without a provider record id', () => {
  const parsed = foodSearchResultSchema.safeParse({
    id: 'food_1',
    name: 'Vision-detected yogurt',
    source: 'ai_vision',
    nutrition: {
      calories: 120,
      proteinG: 8,
      carbsG: 12,
      fatG: 3,
    },
    servings: [],
  });

  assert.equal(parsed.success, false);
});

test('food search results reject negative nutrition values', () => {
  const parsed = foodSearchResultSchema.safeParse({
    id: 'bad_result',
    name: 'Impossible meal',
    source: 'usda',
    providerId: 'usda:bad',
    servings: [],
    nutrition: { calories: -1, proteinG: null, carbsG: null, fatG: null },
  });

  assert.equal(parsed.success, false);
});

test('interpreted food queries reject AI nutrition without a provider record id', () => {
  const parsed = interpretedFoodQuerySchema.safeParse({
    rawQuery: 'a bowl of yogurt with berries',
    normalizedQuery: 'yogurt berries bowl',
    source: 'ai_vision',
    confidence: 0.92,
    nutrition: {
      calories: 180,
      proteinG: 10,
      carbsG: 22,
      fatG: 5,
    },
  });

  assert.equal(parsed.success, false);
});
