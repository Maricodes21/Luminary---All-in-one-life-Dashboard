type AllergenFamily = {
  key: 'fish' | 'shellfish' | 'peanut' | 'tree-nuts' | 'dairy' | 'egg' | 'soy' | 'wheat-gluten' | 'sesame';
  aliases: readonly string[];
};

const ALLERGEN_FAMILIES: readonly AllergenFamily[] = [
  { key: 'fish', aliases: ['fish', 'salmon', 'tuna', 'cod', 'haddock', 'trout', 'anchovy', 'anchovies', 'sardine', 'sardines', 'mackerel', 'tilapia', 'halibut', 'swordfish'] },
  { key: 'shellfish', aliases: ['shellfish', 'shrimp', 'prawn', 'prawns', 'crab', 'lobster', 'crayfish', 'crawfish', 'scallop', 'scallops', 'mussel', 'mussels', 'oyster', 'oysters', 'clam', 'clams'] },
  { key: 'peanut', aliases: ['peanut', 'peanuts', 'groundnut', 'groundnuts'] },
  { key: 'tree-nuts', aliases: ['tree nut', 'tree nuts', 'nut', 'nuts', 'almond', 'almonds', 'walnut', 'walnuts', 'cashew', 'cashews', 'pistachio', 'pistachios', 'pecan', 'pecans', 'hazelnut', 'hazelnuts', 'macadamia', 'macadamias', 'brazil nut', 'brazil nuts', 'pine nut', 'pine nuts'] },
  { key: 'dairy', aliases: ['dairy', 'milk', 'butter', 'buttermilk', 'cheese', 'yogurt', 'yoghurt', 'cream', 'whey', 'casein', 'ghee', 'lactose'] },
  { key: 'egg', aliases: ['egg', 'eggs', 'egg white', 'egg whites', 'egg yolk', 'egg yolks', 'mayonnaise'] },
  { key: 'soy', aliases: ['soy', 'soya', 'soybean', 'soybeans', 'tofu', 'tempeh', 'edamame', 'miso'] },
  { key: 'wheat-gluten', aliases: ['wheat', 'gluten', 'wheat gluten', 'wheat flour', 'semolina', 'spelt', 'barley', 'rye', 'durum', 'couscous', 'bulgur'] },
  { key: 'sesame', aliases: ['sesame', 'sesame seed', 'sesame seeds', 'tahini', 'benne'] },
];

const SAFE_DAIRY_COMPOUNDS = [
  'almond milk', 'cashew milk', 'coconut milk', 'hazelnut milk', 'hemp milk', 'macadamia milk', 'oat milk', 'pea milk', 'peanut milk', 'pistachio milk', 'rice milk', 'soy milk', 'soya milk',
  'almond butter', 'cashew butter', 'cocoa butter', 'cacao butter', 'coconut butter', 'hazelnut butter', 'peanut butter', 'pistachio butter', 'seed butter', 'sunflower butter', 'sunflower seed butter',
  'cashew cream', 'coconut cream', 'oat cream', 'soy cream', 'soya cream',
].map(tokenize);

function tokenize(value: string): string[] {
  return value.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
}

function normalizePhrase(value: string): string {
  return tokenize(value).join(' ');
}

function familyFor(value: string): AllergenFamily | undefined {
  return ALLERGEN_FAMILIES.find((family) => family.aliases.includes(value));
}

function phraseMatchStarts(tokens: string[], phrase: string[]): number[] {
  if (!phrase.length || phrase.length > tokens.length) return [];

  const starts: number[] = [];
  for (let start = 0; start <= tokens.length - phrase.length; start += 1) {
    if (phrase.every((token, offset) => tokens[start + offset] === token)) starts.push(start);
  }
  return starts;
}

function isSafeDairyCompound(tokens: string[], matchStart: number, matchLength: number): boolean {
  const matchEnd = matchStart + matchLength;
  return SAFE_DAIRY_COMPOUNDS.some((compound) =>
    phraseMatchStarts(tokens, compound).some((compoundStart) => {
      const compoundEnd = compoundStart + compound.length;
      return matchStart >= compoundStart && matchEnd <= compoundEnd;
    }),
  );
}

export function expandAvoidedIngredients(values: string[]): string[] {
  const expanded = new Set<string>();

  for (const value of values) {
    const normalized = normalizePhrase(value);
    if (!normalized) continue;

    expanded.add(normalized);
    familyFor(normalized)?.aliases.forEach((alias) => expanded.add(alias));
  }

  return [...expanded];
}

export function ingredientMatchesAvoidance(name: string, values: string[]): boolean {
  const ingredientTokens = tokenize(name);

  return values.some((value) => {
    const normalized = normalizePhrase(value);
    if (!normalized) return false;

    const family = familyFor(normalized);
    const avoidances = family?.aliases ?? [normalized];
    return avoidances.some((avoidance) => {
      const avoidanceTokens = tokenize(avoidance);
      return phraseMatchStarts(ingredientTokens, avoidanceTokens).some((start) =>
        family?.key !== 'dairy' || !isSafeDairyCompound(ingredientTokens, start, avoidanceTokens.length),
      );
    });
  });
}

export function ingredientMatchesCustomAvoidance(name: string, values: string[]): boolean {
  const ingredientTokens = tokenize(name);
  return values.some((value) => {
    const avoidanceTokens = tokenize(value);
    return phraseMatchStarts(ingredientTokens, avoidanceTokens).length > 0;
  });
}
