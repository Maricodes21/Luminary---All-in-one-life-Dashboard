import assert from 'node:assert/strict';
import test from 'node:test';
import { buildShoppingList } from './shoppingList';
import type { MealPlan } from './types';

test('shopping list consolidates matching ingredient quantities', () => {
  const plan: MealPlan = {
    id: 'p',
    weekOf: '2026-08-10',
    title: 'Week',
    createdAt: '',
    entries: ['a', 'b'].map((id) => ({
      id,
      localDate: '2026-08-10',
      mealType: 'dinner',
      name: id,
      source: 'curated',
      servingQuantity: 1,
      servingUnit: 'serving',
      recipeSnapshot: {
        id,
        name: id,
        source: 'curated',
        servings: 1,
        ingredients: [{ id: `${id}-rice`, name: 'Cooked rice', quantity: 100, unit: 'g' }],
        steps: [],
        substitutions: [],
        dietaryTags: [],
      },
    })),
  };
  const list = buildShoppingList(plan);
  assert.equal(list.length, 1);
  assert.equal(list[0]?.quantity, 200);
  assert.equal(list[0]?.mealCount, 2);
});
