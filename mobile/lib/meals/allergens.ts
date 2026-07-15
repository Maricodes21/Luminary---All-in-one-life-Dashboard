const ALLERGEN_FAMILIES: readonly (readonly string[])[] = [
  ['fish', 'salmon', 'tuna', 'cod', 'haddock', 'trout', 'anchovy', 'anchovies', 'sardine', 'sardines', 'mackerel', 'tilapia', 'halibut', 'swordfish'],
  ['shellfish', 'shrimp', 'prawn', 'prawns', 'crab', 'lobster', 'crayfish', 'crawfish', 'scallop', 'scallops', 'mussel', 'mussels', 'oyster', 'oysters', 'clam', 'clams'],
  ['peanut', 'peanuts', 'groundnut', 'groundnuts'],
  ['tree nut', 'tree nuts', 'nut', 'nuts', 'almond', 'almonds', 'walnut', 'walnuts', 'cashew', 'cashews', 'pistachio', 'pistachios', 'pecan', 'pecans', 'hazelnut', 'hazelnuts', 'macadamia', 'macadamias', 'brazil nut', 'brazil nuts', 'pine nut', 'pine nuts'],
  ['dairy', 'milk', 'butter', 'cheese', 'yogurt', 'yoghurt', 'cream', 'whey', 'casein', 'ghee', 'lactose'],
  ['egg', 'eggs', 'egg white', 'egg whites', 'egg yolk', 'egg yolks', 'mayonnaise'],
  ['soy', 'soya', 'soybean', 'soybeans', 'tofu', 'tempeh', 'edamame', 'miso'],
  ['wheat', 'gluten', 'wheat gluten', 'wheat flour', 'semolina', 'spelt', 'barley', 'rye', 'durum', 'couscous', 'bulgur'],
  ['sesame', 'sesame seed', 'sesame seeds', 'tahini', 'benne'],
];

function normalizePhrase(value: string): string {
  return value
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
    .join(' ');
}

export function expandAvoidedIngredients(values: string[]): string[] {
  const expanded = new Set<string>();

  for (const value of values) {
    const normalized = normalizePhrase(value);
    if (!normalized) continue;

    expanded.add(normalized);
    const family = ALLERGEN_FAMILIES.find((aliases) => aliases.includes(normalized));
    family?.forEach((alias) => expanded.add(alias));
  }

  return [...expanded];
}

export function ingredientMatchesAvoidance(name: string, values: string[]): boolean {
  const ingredientTokens = normalizePhrase(name).split(' ').filter(Boolean);

  return expandAvoidedIngredients(values).some((avoidance) => {
    const avoidanceTokens = avoidance.split(' ');
    if (avoidanceTokens.length > ingredientTokens.length) return false;

    return ingredientTokens.some((_, start) =>
      avoidanceTokens.every((token, offset) => ingredientTokens[start + offset] === token),
    );
  });
}
