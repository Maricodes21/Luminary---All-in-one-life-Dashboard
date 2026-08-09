import type {
  FoodSearchProvider,
  FoodSearchQuery,
  FoodSearchResult,
  FoodServing,
} from './types.ts';

type FetchLike = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;

function finiteNumber(value: unknown): number | undefined {
  const number = typeof value === 'string' ? Number(value) : value;
  return typeof number === 'number' && Number.isFinite(number) ? number : undefined;
}

function compactServing(serving: FoodServing): FoodServing {
  return Object.fromEntries(
    Object.entries(serving).filter(([, value]) => value !== undefined),
  ) as FoodServing;
}

function parseServingLabel(value: unknown): Pick<FoodServing, 'label' | 'quantity' | 'unit'> {
  if (typeof value !== 'string' || !value.trim()) {
    return { label: '100 g', quantity: 100, unit: 'g' };
  }
  const match = value.trim().match(/^(\d+(?:\.\d+)?)\s*([a-zA-Z]+)$/);
  return {
    label: value.trim(),
    quantity: match ? Number(match[1]) : undefined,
    unit: match?.[2]?.toLocaleLowerCase('en'),
  };
}

function normalizeOpenFoodFactsProduct(value: unknown): FoodSearchResult | null {
  if (!value || typeof value !== 'object') return null;
  const product = value as Record<string, unknown>;
  const code = String(product.code ?? '').trim();
  const name = String(product.product_name ?? '').trim();
  if (!code || !name) return null;
  const nutriments =
    product.nutriments && typeof product.nutriments === 'object'
      ? (product.nutriments as Record<string, unknown>)
      : {};
  const hasServingNutrition = [
    nutriments['energy-kcal_serving'],
    nutriments.proteins_serving,
    nutriments.carbohydrates_serving,
    nutriments.fat_serving,
  ].some((item) => finiteNumber(item) !== undefined);
  const suffix = hasServingNutrition ? 'serving' : '100g';
  const servingLabel = hasServingNutrition
    ? parseServingLabel(product.serving_size)
    : { label: '100 g', quantity: 100, unit: 'g' };

  return {
    provider: 'open_food_facts',
    providerId: `open_food_facts:${code}`,
    name,
    brand: typeof product.brands === 'string' ? product.brands.trim() || undefined : undefined,
    barcode: code,
    imageUrl: typeof product.image_front_url === 'string' ? product.image_front_url : undefined,
    sourceUrl: `https://world.openfoodfacts.org/product/${encodeURIComponent(code)}`,
    serving: compactServing({
      ...servingLabel,
      calories: finiteNumber(nutriments[`energy-kcal_${suffix}`]),
      proteinG: finiteNumber(nutriments[`proteins_${suffix}`]),
      carbsG: finiteNumber(nutriments[`carbohydrates_${suffix}`]),
      fatG: finiteNumber(nutriments[`fat_${suffix}`]),
    }),
  };
}

export class OpenFoodFactsProvider implements FoodSearchProvider {
  readonly id = 'open_food_facts';
  readonly enabled = true;
  private readonly fetcher: FetchLike;

  constructor(options: { fetch?: FetchLike } = {}) {
    this.fetcher = options.fetch ?? fetch;
  }

  async search(input: FoodSearchQuery): Promise<FoodSearchResult[]> {
    const params = new URLSearchParams({
      action: 'process',
      search_terms: input.query,
      page_size: String(Math.min(Math.max(input.limit ?? 20, 1), 50)),
      json: '1',
      fields: 'code,product_name,brands,serving_size,image_front_url,nutriments',
    });
    const response = await this.fetcher(
      `https://world.openfoodfacts.org/cgi/search.pl?${params.toString()}`,
      { headers: { accept: 'application/json' } },
    );
    if (!response.ok) throw new Error(`open_food_facts_http_${response.status}`);
    const body = (await response.json()) as { products?: unknown[] };
    return (body.products ?? [])
      .map(normalizeOpenFoodFactsProduct)
      .filter((item): item is FoodSearchResult => item !== null);
  }

  async lookupBarcode(barcode: string): Promise<FoodSearchResult[]> {
    const response = await this.fetcher(
      `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json`,
      { headers: { accept: 'application/json' } },
    );
    if (response.status === 404) return [];
    if (!response.ok) throw new Error(`open_food_facts_http_${response.status}`);
    const body = (await response.json()) as { product?: unknown };
    const result = normalizeOpenFoodFactsProduct(body.product);
    return result ? [result] : [];
  }
}

function nutrientValue(
  food: Record<string, unknown>,
  names: string[],
  unitName?: string,
): number | undefined {
  const nutrients = Array.isArray(food.foodNutrients) ? food.foodNutrients : [];
  const match = nutrients.find((item) => {
    if (!item || typeof item !== 'object') return false;
    const nutrient = item as Record<string, unknown>;
    const nutrientName = nutrient.nutrientName;
    const nutrientUnit = nutrient.unitName;
    const nameMatches =
      typeof nutrientName === 'string' &&
      names.some((name) => nutrientName.toLocaleLowerCase('en') === name);
    const unitMatches =
      !unitName ||
      (typeof nutrientUnit === 'string' && nutrientUnit.toLocaleLowerCase('en') === unitName);
    return nameMatches && unitMatches;
  }) as Record<string, unknown> | undefined;
  return finiteNumber(match?.value);
}

function normalizeUsdaFood(value: unknown): FoodSearchResult | null {
  if (!value || typeof value !== 'object') return null;
  const food = value as Record<string, unknown>;
  const fdcId = finiteNumber(food.fdcId);
  const name = String(food.description ?? '').trim();
  if (fdcId === undefined || !name) return null;

  return {
    provider: 'usda',
    providerId: `usda:${fdcId}`,
    name,
    brand: typeof food.brandOwner === 'string' ? food.brandOwner.trim() || undefined : undefined,
    barcode: typeof food.gtinUpc === 'string' ? food.gtinUpc : undefined,
    sourceUrl: `https://fdc.nal.usda.gov/fdc-app.html#/food-details/${fdcId}/nutrients`,
    serving: compactServing({
      label: '100 g',
      quantity: 100,
      unit: 'g',
      calories: nutrientValue(food, ['energy'], 'kcal'),
      proteinG: nutrientValue(food, ['protein']),
      carbsG: nutrientValue(food, ['carbohydrate, by difference']),
      fatG: nutrientValue(food, ['total lipid (fat)']),
    }),
  };
}

export class UsdaFoodProvider implements FoodSearchProvider {
  readonly id = 'usda';
  readonly enabled: boolean;
  private readonly apiKey?: string;
  private readonly fetcher: FetchLike;

  constructor(options: { apiKey?: string; fetch?: FetchLike } = {}) {
    this.apiKey = options.apiKey?.trim() || undefined;
    this.enabled = Boolean(this.apiKey);
    this.fetcher = options.fetch ?? fetch;
  }

  async search(input: FoodSearchQuery): Promise<FoodSearchResult[]> {
    if (!this.enabled) return [];
    const params = new URLSearchParams({ api_key: this.apiKey as string });
    const response = await this.fetcher(
      `https://api.nal.usda.gov/fdc/v1/foods/search?${params.toString()}`,
      {
        method: 'POST',
        headers: { accept: 'application/json', 'content-type': 'application/json' },
        body: JSON.stringify({
          query: input.query,
          pageSize: Math.min(Math.max(input.limit ?? 20, 1), 50),
        }),
      },
    );
    if (!response.ok) throw new Error(`usda_http_${response.status}`);
    const body = (await response.json()) as { foods?: unknown[] };
    return (body.foods ?? [])
      .map(normalizeUsdaFood)
      .filter((item): item is FoodSearchResult => item !== null);
  }

  async lookupBarcode(): Promise<FoodSearchResult[]> {
    return [];
  }
}

export class DisabledCommercialFoodProvider implements FoodSearchProvider {
  readonly id = 'commercial';
  readonly enabled = false;

  constructor(_options: { fetch?: FetchLike } = {}) {}

  async search(): Promise<FoodSearchResult[]> {
    return [];
  }

  async lookupBarcode(): Promise<FoodSearchResult[]> {
    return [];
  }
}
