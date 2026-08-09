const INGREDIENT_ALIASES = new Map(
  Object.entries({
    'baby carrot': 'carrot',
    'baby carrots': 'carrot',
    carrots: 'carrot',
    'bell peppers': 'bell pepper',
    capsicum: 'bell pepper',
    'caesar salad': 'salad',
    'cherry tomato': 'tomato',
    'cherry tomatoes': 'tomato',
    cucumbers: 'cucumber',
    'egg white': 'egg',
    'egg whites': 'egg',
    eggs: 'egg',
    'scrambled egg': 'egg',
    'scrambled eggs': 'egg',
    'hash brown': 'potato',
    'hash browns': 'potato',
    'roasted potato': 'potato',
    'roasted potatoes': 'potato',
    potatoes: 'potato',
    yam: 'sweet potato',
    yams: 'sweet potato',
    'leafy green': 'greens',
    'leafy greens': 'greens',
    'mixed green': 'greens',
    'mixed greens': 'greens',
    'salad green': 'greens',
    'salad greens': 'greens',
    almonds: 'almond',
    nuts: 'almond',
    'brussels sprout': 'brussels sprouts',
    grapes: 'grape',
    olives: 'olive',
    onions: 'onion',
    berries: 'berry',
    blueberries: 'berry',
    raspberries: 'berry',
    'mixed berries': 'berry',
    blackberries: 'berry',
    strawberries: 'strawberry',
    'mandarin orange': 'orange',
    'mandarin oranges': 'orange',
    oranges: 'orange',
    'chicken apple sausage': 'sausage',
    sausages: 'sausage',
    'parmesan cheese': 'parmesan',
    tomatoes: 'tomato',
  }),
);

function normalizeIngredient(value) {
  const normalized = String(value)
    .normalize('NFKD')
    .toLowerCase()
    .replace(/\([^)]*\)/g, ' ')
    .replace(/\b(raw|cooked|fresh|grilled|sliced|diced|chopped)\b/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
  return INGREDIENT_ALIASES.get(normalized) ?? normalized;
}

function parseIngredientResponse(content) {
  if (typeof content !== 'string') return null;
  let candidate = content
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '');
  const firstBrace = candidate.indexOf('{');
  const lastBrace = candidate.lastIndexOf('}');
  if (firstBrace >= 0 && lastBrace > firstBrace)
    candidate = candidate.slice(firstBrace, lastBrace + 1);

  try {
    const value = JSON.parse(candidate);
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
    if (Object.keys(value).length !== 1 || !Array.isArray(value.ingredients)) return null;
    const ingredients = value.ingredients
      .filter((item) => typeof item === 'string')
      .map((item) => item.trim())
      .filter((item) => item.length >= 2 && item.length <= 80);
    if (
      ingredients.length < 1 ||
      ingredients.length > 12 ||
      ingredients.length !== value.ingredients.length
    ) {
      return null;
    }
    return [...new Set(ingredients)];
  } catch {
    return null;
  }
}

function percentile(values, percentage) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.max(0, Math.ceil(sorted.length * percentage) - 1)];
}

function round(value) {
  return Number(value.toFixed(4));
}

function evaluateModel({ model, usageTier, samples }) {
  let truePositives = 0;
  let falsePositives = 0;
  let falseNegatives = 0;

  const evaluatedSamples = samples.map((sample) => {
    const expected = new Set(sample.expected.map(normalizeIngredient).filter(Boolean));
    const predicted = new Set((sample.predicted ?? []).map(normalizeIngredient).filter(Boolean));
    const matched = [...predicted].filter((item) => expected.has(item));
    const unexpected = [...predicted].filter((item) => !expected.has(item));
    const missed = [...expected].filter((item) => !predicted.has(item));
    truePositives += matched.length;
    falsePositives += unexpected.length;
    falseNegatives += missed.length;
    return { ...sample, matched, unexpected, missed };
  });

  const precision =
    truePositives + falsePositives ? truePositives / (truePositives + falsePositives) : 0;
  const recall =
    truePositives + falseNegatives ? truePositives / (truePositives + falseNegatives) : 0;
  const f1 = precision + recall ? (2 * precision * recall) / (precision + recall) : 0;
  const qualityEvaluated = samples.some((sample) => sample.succeeded);
  const latencies = samples
    .filter((sample) => sample.succeeded && Number.isFinite(sample.latencyMs))
    .map((sample) => sample.latencyMs);

  return {
    model,
    usageTier,
    sampleCount: samples.length,
    truePositives,
    falsePositives,
    falseNegatives,
    qualityEvaluated,
    precision: qualityEvaluated ? round(precision) : null,
    recall: qualityEvaluated ? round(recall) : null,
    f1: qualityEvaluated ? round(f1) : null,
    schemaValidity: round(samples.filter((sample) => sample.schemaValid).length / samples.length),
    successRate: round(samples.filter((sample) => sample.succeeded).length / samples.length),
    latencyMs: {
      p50: percentile(latencies, 0.5),
      p95: percentile(latencies, 0.95),
    },
    samples: evaluatedSamples,
  };
}

function promotionDecision(baseline, challenger) {
  if (!challenger.qualityEvaluated && challenger.successRate === 0) {
    return { promote: false, reasons: ['challenger_unavailable'] };
  }
  const reasons = [];
  if (challenger.f1 + 1e-9 < baseline.f1 + 0.1) reasons.push('f1_gain_below_10_points');
  if (challenger.schemaValidity < baseline.schemaValidity)
    reasons.push('schema_validity_regressed');
  if (challenger.successRate < baseline.successRate) reasons.push('success_rate_regressed');
  const usageRank = { low: 0, medium: 1, high: 2 };
  if ((usageRank[challenger.usageTier] ?? Infinity) > (usageRank[baseline.usageTier] ?? Infinity)) {
    reasons.push('usage_tier_worse');
  }
  return { promote: reasons.length === 0, reasons };
}

module.exports = {
  evaluateModel,
  normalizeIngredient,
  parseIngredientResponse,
  promotionDecision,
};
