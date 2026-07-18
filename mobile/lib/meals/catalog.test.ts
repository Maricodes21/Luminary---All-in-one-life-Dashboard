import assert from 'node:assert/strict';
import test from 'node:test';

import { getRecipeById, recipeCatalog } from './catalog';

const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack'] as const;

test('catalog contains at least 12 recipes for every meal type', () => {
  for (const mealType of mealTypes) {
    const recipes = recipeCatalog.filter((recipe) => recipe.mealType === mealType);

    assert.ok(recipes.length >= 12, `${mealType} has only ${recipes.length} recipes`);
  }

  assert.ok(recipeCatalog.length >= 48);
});

test('catalog recipe IDs are stable and unique', () => {
  const ids = recipeCatalog.map((recipe) => recipe.id);

  assert.equal(new Set(ids).size, ids.length);
  for (const id of ids) {
    assert.match(id, /^recipe_[a-z0-9]+(?:_[a-z0-9]+)*$/);
  }
});

test('every recipe has complete and credible per-serving nutrition', () => {
  for (const recipe of recipeCatalog) {
    const { calories, proteinG, carbsG, fatG } = recipe.nutrition;

    assert.ok(Number.isFinite(calories) && calories >= 100 && calories <= 900, recipe.id);
    assert.ok(Number.isFinite(proteinG) && proteinG > 0 && proteinG <= 80, recipe.id);
    assert.ok(Number.isFinite(carbsG) && carbsG > 0 && carbsG <= 140, recipe.id);
    assert.ok(Number.isFinite(fatG) && fatG > 0 && fatG <= 60, recipe.id);

    const caloriesFromMacros = proteinG * 4 + carbsG * 4 + fatG * 9;
    const differenceRatio = Math.abs(caloriesFromMacros - calories) / calories;
    assert.ok(differenceRatio <= 0.15, `${recipe.id} nutrition differs by ${differenceRatio}`);
  }
});

test('every recipe has quantified ingredients covered by detailed timed steps', () => {
  for (const recipe of recipeCatalog) {
    assert.ok(recipe.ingredients.length >= 4, `${recipe.id} needs more ingredients`);
    assert.ok(recipe.steps.length >= 4, `${recipe.id} needs more steps`);
    assert.ok(recipe.prepMinutes > 0, `${recipe.id} needs prep time`);
    assert.ok(recipe.cookMinutes >= 0, `${recipe.id} has invalid cook time`);
    assert.ok(recipe.dietaryTags.length > 0, `${recipe.id} needs dietary tags`);

    const ingredientIds = new Set(recipe.ingredients.map((ingredient) => ingredient.id));
    const coveredIngredientIds = new Set(recipe.steps.flatMap((step) => step.ingredientIds));

    for (const ingredient of recipe.ingredients) {
      assert.ok(ingredient.name.trim().length > 0, `${recipe.id} has an unnamed ingredient`);
      assert.ok(ingredient.quantity > 0, `${recipe.id}/${ingredient.id} needs a quantity`);
      assert.ok(ingredient.unit.trim().length > 0, `${recipe.id}/${ingredient.id} needs a unit`);
      assert.ok(coveredIngredientIds.has(ingredient.id), `${recipe.id}/${ingredient.id} is not used`);
    }

    for (const step of recipe.steps) {
      assert.ok(step.text.trim().length >= 24, `${recipe.id}/${step.id} needs more detail`);
      assert.ok(step.durationMinutes > 0, `${recipe.id}/${step.id} needs a duration`);
      assert.ok(step.cue.trim().length >= 8, `${recipe.id}/${step.id} needs a cooking cue`);
      for (const ingredientId of step.ingredientIds) {
        assert.ok(ingredientIds.has(ingredientId), `${recipe.id}/${step.id} has an unknown ingredient`);
      }
    }
  }
});

test('catalog uses variable instruction counts', () => {
  const stepCounts = new Set(recipeCatalog.map((recipe) => recipe.steps.length));

  assert.ok(stepCounts.size >= 3, `only found step counts: ${[...stepCounts].join(', ')}`);
});

test('getRecipeById returns the matching recipe and undefined for unknown IDs', () => {
  const expected = recipeCatalog[17];

  assert.ok(expected);
  assert.equal(getRecipeById(expected.id), expected);
  assert.equal(getRecipeById('recipe_not_in_catalog'), undefined);
});

test('every plan-ready recipe has an exact image URL or a deliberate absent state', () => {
  for (const recipe of recipeCatalog) {
    assert.equal(recipe.planReady, true, recipe.id);

    if (recipe.image.kind === 'exact') {
      assert.equal(recipe.imageUri, recipe.image.uri, recipe.id);
      assert.match(recipe.image.uri, /^https:\/\//, recipe.id);
      assert.ok(recipe.image.alt.trim().length > 0, recipe.id);
    } else {
      assert.equal(recipe.imageUri, undefined, recipe.id);
      assert.ok(recipe.image.reason.trim().length >= 16, recipe.id);
    }
  }
});
