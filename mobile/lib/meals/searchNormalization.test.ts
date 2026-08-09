import assert from 'node:assert/strict';
import test from 'node:test';

import { normalizeGatewayResults } from './searchNormalization';

test('provider rows without verified calories are discarded instead of becoming zero', () => {
  const results = normalizeGatewayResults([
    { provider: 'USDA FoodData Central', providerId: 'usda:missing', name: 'Unknown oats', serving: { proteinG: 12 } },
  ]);

  assert.deepEqual(results, []);
});

test('valid zero-calorie and nullable-macro provider records remain searchable', () => {
  const results = normalizeGatewayResults([
    { provider: 'Open Food Facts', providerId: 'off:water', name: 'Sparkling water', serving: { calories: 0, quantity: 330, unit: 'ml' } },
  ]);

  assert.equal(results.length, 1);
  assert.equal(results[0]?.nutrition?.calories, 0);
  assert.equal(results[0]?.nutrition?.proteinG, null);
  assert.equal(results[0]?.source, 'open_food_facts');
});
