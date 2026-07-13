import type { FoodSearchResult } from './types.ts';

const PROVIDER_WEIGHT: Record<string, number> = {
  usda: 30,
  open_food_facts: 20,
  commercial: 0,
};

function normalized(value: string): string {
  return value.trim().toLocaleLowerCase('en').replace(/\s+/g, ' ');
}

function nutritionCompleteness(result: FoodSearchResult): number {
  const values = [
    result.serving.calories,
    result.serving.proteinG,
    result.serving.carbsG,
    result.serving.fatG,
  ];
  return values.filter((value) => typeof value === 'number' && Number.isFinite(value)).length * 4;
}

function queryScore(result: FoodSearchResult, query: string): number {
  const name = normalized(result.name);
  const term = normalized(query);
  if (!term) return 0;
  if (name === term) return 1_000;
  if (name.startsWith(`${term} `)) return 600;
  if (name.includes(term)) return 400;

  const tokens = new Set(term.split(' '));
  const matches = name.split(' ').filter((token) => tokens.has(token)).length;
  return Math.round((matches / tokens.size) * 200);
}

export function rankFoodResults(
  results: readonly FoodSearchResult[],
  query: string,
  preferredProviderIds: ReadonlySet<string> = new Set(),
): FoodSearchResult[] {
  const unique = new Map<string, FoodSearchResult>();
  for (const result of results) {
    if (!unique.has(result.providerId)) unique.set(result.providerId, result);
  }

  return [...unique.values()].sort((left, right) => {
    const leftScore =
      queryScore(left, query) +
      (PROVIDER_WEIGHT[left.provider] ?? 10) +
      nutritionCompleteness(left) +
      (preferredProviderIds.has(left.providerId) ? 50 : 0);
    const rightScore =
      queryScore(right, query) +
      (PROVIDER_WEIGHT[right.provider] ?? 10) +
      nutritionCompleteness(right) +
      (preferredProviderIds.has(right.providerId) ? 50 : 0);

    if (leftScore !== rightScore) return rightScore - leftScore;
    return left.providerId.localeCompare(right.providerId, 'en');
  });
}
