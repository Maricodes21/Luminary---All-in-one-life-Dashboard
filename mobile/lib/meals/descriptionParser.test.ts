import assert from 'node:assert/strict';
import test from 'node:test';
import { parseMealDescription } from './descriptionParser';

test('meal descriptions become editable measured parts', () => {
  assert.deepEqual(parseMealDescription('150 g chicken, one cup rice and 80 grams broccoli'), [
    { name: 'chicken', quantity: '150', unit: 'g' },
    { name: 'rice', quantity: '1', unit: 'cup' },
    { name: 'broccoli', quantity: '80', unit: 'g' },
  ]);
});
