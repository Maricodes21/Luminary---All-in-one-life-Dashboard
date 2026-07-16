import assert from 'node:assert/strict';
import test from 'node:test';

import { recipeCatalog } from './catalog';
import { cachedRecipeImageUri, recipeImageCategory } from './recipeImages';

test('every catalog recipe resolves to a cached HTTPS image', () => {
  for (const recipe of recipeCatalog) {
    assert.match(cachedRecipeImageUri(recipe.name), /^https:\/\/images\.unsplash\.com\//, recipe.name);
  }
});

test('cached lookup separates visibly different meal categories', () => {
  assert.equal(recipeImageCategory('Berry Overnight Oats'), 'breakfast-bowl');
  assert.equal(recipeImageCategory('Lemon Herb Chicken and Potatoes'), 'chicken');
  assert.equal(recipeImageCategory('Tuna Cucumber Boats'), 'fish');
  assert.notEqual(cachedRecipeImageUri('Berry Overnight Oats'), cachedRecipeImageUri('Lemon Herb Chicken and Potatoes'));
  assert.notEqual(cachedRecipeImageUri('Tuna Cucumber Boats'), cachedRecipeImageUri('Lemon Herb Chicken and Potatoes'));
});
