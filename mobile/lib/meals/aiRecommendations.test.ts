import assert from 'node:assert/strict';
import test from 'node:test';

import { recipeCatalog } from './catalog';
import { resolveRankedRecipeIds } from './aiRecommendations';

test('AI recommendation ranking can only reorder supplied validated recipes', () => {
  const candidates = recipeCatalog.slice(0, 3);
  const ranked = resolveRankedRecipeIds(candidates, {
    result: {
      recipeIds: [candidates[2].id, 'invented:recipe', candidates[0].id, candidates[2].id],
      calories: 1,
    },
  });

  assert.deepEqual(ranked.map((recipe) => recipe.id), [candidates[2].id, candidates[0].id, candidates[1].id]);
});

test('malformed AI recommendation output preserves deterministic order', () => {
  const candidates = recipeCatalog.slice(0, 3);
  assert.deepEqual(resolveRankedRecipeIds(candidates, { anything: 42 }), candidates);
});
