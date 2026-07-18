const assert = require('node:assert/strict');
const test = require('node:test');

const {
  evaluateModel,
  normalizeIngredient,
  promotionDecision,
  parseIngredientResponse,
} = require('../benchmarks/meal-vision/scoring.cjs');

test('meal vision parser accepts only a JSON ingredient list', () => {
  assert.deepEqual(parseIngredientResponse('{"ingredients":["Tomatoes", " cucumber "]}'), [
    'Tomatoes',
    'cucumber',
  ]);
  assert.equal(parseIngredientResponse('{"foods":"tomato"}'), null);
  assert.equal(parseIngredientResponse('not json'), null);
});

test('meal vision scoring handles aliases and penalizes invented ingredients', () => {
  const result = evaluateModel({
    model: 'model-a',
    usageTier: 'medium',
    samples: [
      {
        id: 'one',
        expected: ['cherry tomatoes', 'bell pepper'],
        predicted: ['tomato', 'capsicum', 'cheese'],
        schemaValid: true,
        succeeded: true,
        latencyMs: 100,
      },
    ],
  });

  assert.equal(result.truePositives, 2);
  assert.equal(result.falsePositives, 1);
  assert.equal(result.falseNegatives, 0);
  assert.equal(result.schemaValidity, 1);
  assert.equal(result.successRate, 1);
  assert.equal(result.f1, 0.8);
});

test('meal vision scoring normalizes common plural produce labels', () => {
  assert.equal(normalizeIngredient('carrots'), 'carrot');
  assert.equal(normalizeIngredient('blueberries'), 'berry');
  assert.equal(normalizeIngredient('raspberries'), 'berry');
});

test('Qwen is promoted only with a ten point F1 gain and no reliability regression', () => {
  const baseline = {
    model: 'gemma',
    f1: 0.7,
    schemaValidity: 1,
    successRate: 1,
    usageTier: 'medium',
  };

  assert.deepEqual(promotionDecision(baseline, { ...baseline, model: 'qwen', f1: 0.81 }), {
    promote: true,
    reasons: [],
  });
  assert.equal(
    promotionDecision(baseline, { ...baseline, model: 'qwen', f1: 0.79 }).promote,
    false,
  );
  assert.equal(
    promotionDecision(baseline, {
      ...baseline,
      model: 'qwen',
      f1: 0.85,
      schemaValidity: 0.9,
    }).promote,
    false,
  );
  assert.deepEqual(
    promotionDecision(baseline, {
      ...baseline,
      model: 'qwen',
      f1: 0,
      schemaValidity: 0,
      successRate: 0,
    }),
    {
      promote: false,
      reasons: ['challenger_unavailable'],
    },
  );
});

test('an unavailable challenger is not assigned a quality score', () => {
  const result = evaluateModel({
    model: 'qwen',
    usageTier: 'medium',
    samples: [
      {
        id: 'one',
        expected: ['tomato'],
        predicted: [],
        schemaValid: false,
        succeeded: false,
        latencyMs: 100,
        error: 'ollama_subscription_required',
      },
    ],
  });

  assert.equal(result.qualityEvaluated, false);
  assert.equal(result.precision, null);
  assert.equal(result.recall, null);
  assert.equal(result.f1, null);
});
