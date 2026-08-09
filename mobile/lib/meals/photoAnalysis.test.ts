import assert from 'node:assert/strict';
import test from 'node:test';

import {
  normalizeVisibleIngredients,
  parseMealPhotoAnalysis,
  unavailableMealPhotoAnalysis,
} from './photoAnalysis';

test('keeps only unique, editable visible ingredient names', () => {
  assert.deepEqual(normalizeVisibleIngredients([' tomato ', 'Tomato', 'brown rice', 42, '', 'x']), [
    'tomato',
    'brown rice',
  ]);
});

test('limits photo suggestions to twelve ingredients', () => {
  assert.equal(
    normalizeVisibleIngredients(Array.from({ length: 20 }, (_, index) => `ingredient ${index}`))
      .length,
    12,
  );
});

test('parses only the ingredient list and ignores nutrition-like extra fields', () => {
  assert.deepEqual(
    parseMealPhotoAnalysis({
      mode: 'ai',
      ingredients: ['tomato', 'cucumber'],
      calories: 900,
      nutrition: { protein: 50 },
    }),
    { status: 'ready', ingredients: ['tomato', 'cucumber'] },
  );
});

test('maps policy and provider recovery states without inventing ingredients', () => {
  assert.equal(
    parseMealPhotoAnalysis({ mode: 'deterministic', reason: 'ai_timeout' }).status,
    'timeout',
  );
  assert.equal(
    parseMealPhotoAnalysis({ mode: 'deterministic', reason: 'pilot_quota_exhausted' }).status,
    'quota',
  );
  assert.equal(
    parseMealPhotoAnalysis({ mode: 'deterministic', reason: 'paid_budget_blocked' }).status,
    'budget',
  );
  assert.equal(parseMealPhotoAnalysis({ mode: 'ai', ingredients: [] }).status, 'unavailable');
});

test('turns network timeouts into a recoverable timeout state', () => {
  assert.equal(unavailableMealPhotoAnalysis(new Error('request timeout')).status, 'timeout');
  assert.equal(unavailableMealPhotoAnalysis(new Error('offline')).status, 'unavailable');
});
