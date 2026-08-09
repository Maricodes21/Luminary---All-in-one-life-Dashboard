import type { FoodSearchResult, MealSource, NutritionValues } from './types';

export function normalizeGatewayResults(value: unknown): FoodSearchResult[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item): FoodSearchResult[] => {
    if (!item || typeof item !== 'object') return [];
    const row = item as Record<string, unknown>;
    const providerId = text(row.providerId);
    const name = text(row.name);
    const serving =
      row.serving && typeof row.serving === 'object'
        ? (row.serving as Record<string, unknown>)
        : null;
    const calories = serving ? nonnegativeNumber(serving.calories) : null;
    if (!providerId || !name || !serving || calories == null) return [];

    const nutrition: NutritionValues = {
      calories,
      proteinG: nullableNonnegativeNumber(serving.proteinG),
      carbsG: nullableNonnegativeNumber(serving.carbsG),
      fatG: nullableNonnegativeNumber(serving.fatG),
    };
    const label = text(serving.label);
    const quantity = positiveNumber(serving.quantity) ?? 1;
    const unit = text(serving.unit) ?? 'serving';
    const source = sourceFor(String(row.provider ?? 'curated'));

    return [
      {
        id: providerId,
        name,
        source,
        providerId,
        confidence: nonnegativeNumber(row.confidence),
        brand: text(row.brand),
        imageUri: text(row.imageUrl),
        sourceUrls: Array.isArray(row.sourceUrls)
          ? row.sourceUrls.map(text).filter((url): url is string => Boolean(url))
          : text(row.sourceUrl)
            ? [text(row.sourceUrl)!]
            : undefined,
        retrievedAt: text(row.retrievedAt),
        verificationStatus:
          row.verificationStatus === 'verified' || row.verificationStatus === 'sourced_unverified'
            ? row.verificationStatus
            : undefined,
        countryRelevance: text(row.countryRelevance),
        nutrition,
        servings: [
          {
            id: `${providerId}:${label ?? unit}`,
            label,
            quantity,
            unit,
            providerId,
            nutrition,
          },
        ],
      },
    ];
  });
}

export function sourceFor(provider: string): MealSource {
  const normalized = provider.trim().toLocaleLowerCase('en').replaceAll(' ', '_');
  if (normalized === 'usda' || normalized === 'usda_fooddata_central') return 'usda';
  if (normalized === 'open_food_facts') return 'open_food_facts';
  if (normalized === 'community') return 'community';
  if (normalized === 'commercial') return 'commercial';
  if (normalized === 'grounded_web') return 'grounded_web';
  return 'curated';
}

function text(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function nonnegativeNumber(value: unknown): number | null {
  if (value == null || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function nullableNonnegativeNumber(value: unknown): number | null {
  return nonnegativeNumber(value);
}

function positiveNumber(value: unknown): number | null {
  const parsed = nonnegativeNumber(value);
  return parsed != null && parsed > 0 ? parsed : null;
}
