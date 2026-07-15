import test from 'node:test';
import assert from 'node:assert/strict';
import { clampNumber, isFutureDate, stepNumber, suggestFromHistory, toLocalDateValue, uniqueChoices } from './assistedInputs';

test('number stepping respects bounds', () => {
  assert.equal(stepNumber(66, 0.5, 1, 20, 400), 66.5);
  assert.equal(stepNumber(20, 1, -1, 20, 400), 20);
  assert.equal(clampNumber(500, 20, 400), 400);
});

test('dates use local ISO values and reject future dates', () => {
  assert.equal(toLocalDateValue(new Date(2026, 6, 15)), '2026-07-15');
  assert.equal(isFutureDate('2026-07-16', '2026-07-15'), true);
});

test('choices and history suggestions are normalized', () => {
  assert.deepEqual(uniqueChoices([' Vegan ', 'vegan', 'Fish']), ['Vegan', 'Fish']);
  assert.deepEqual(suggestFromHistory('pi', ['Pick n Pay', 'Pizza Hut', 'Woolworths'], 4), ['Pick n Pay', 'Pizza Hut']);
});
