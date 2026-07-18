import assert from 'node:assert/strict';
import test from 'node:test';

import { parseOptionalNonnegative, parseRequiredNumber } from './formNumbers';

test('optional nutrition values stay nullable and reject invalid or negative input', () => {
  assert.deepEqual(parseOptionalNonnegative(''), { valid: true, value: null });
  assert.deepEqual(parseOptionalNonnegative('0'), { valid: true, value: 0 });
  assert.deepEqual(parseOptionalNonnegative('12.5'), { valid: true, value: 12.5 });
  assert.equal(parseOptionalNonnegative('-1').valid, false);
  assert.equal(parseOptionalNonnegative('not a number').valid, false);
});

test('required numbers enforce finite bounds', () => {
  assert.deepEqual(parseRequiredNumber('66', 20, 500), { valid: true, value: 66 });
  assert.equal(parseRequiredNumber('NaN', 20, 500).valid, false);
  assert.equal(parseRequiredNumber('501', 20, 500).valid, false);
});
