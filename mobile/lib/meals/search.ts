import { getAllLibraryMeals } from '../contentLibrary';
import { supabase } from '../supabase';
import { foodSearchResultSchema } from './validation';
import { normalizeGatewayResults, sourceFor } from './searchNormalization';
import { parseMealPhotoAnalysis, unavailableMealPhotoAnalysis } from './photoAnalysis';
import type { FoodSearchResult, MealPhotoAnalysis } from './types';
import { compactAiConfigured, requestCompactFoodInterpretation } from '../ai/localGateway';

export async function searchFoods(query: string, locale = 'en-ZA'): Promise<FoodSearchResult[]> {
  const normalized = query.trim().toLowerCase();
  const local = localFoodResults(normalized);
  if (!normalized) return local.slice(0, 8);

  try {
    const first = await invokeFoodSearch(query.trim(), locale);
    let providerResults = first.results;
    if (
      !hasRelevantFoodResult(providerResults, query) &&
      first.mode !== 'ai' &&
      compactAiConfigured()
    ) {
      const interpreted = await requestCompactFoodInterpretation(query, locale);
      if (interpreted) {
        const retry = await invokeFoodSearch(interpreted, locale);
        providerResults = retry.results.map((result, index) =>
          index === 0 ? { ...result, aiAssisted: true, interpretedQuery: interpreted } : result,
        );
      }
    }
    return mergeResults(providerResults, local);
  } catch (error) {
    console.warn(
      '[meals] Live food search unavailable; showing verified local results',
      error instanceof Error ? error.message : error,
    );
    return local;
  }
}

async function invokeFoodSearch(query: string, locale: string) {
  const { data, error } = await supabase.functions.invoke('meals-api', {
    body: { action: 'search-foods', input: { query, locale } },
  });
  if (error) throw error;
  const responseData = data?.data ?? data ?? {};
  const parsed = foodSearchResultSchema
    .array()
    .safeParse(normalizeGatewayResults(responseData.results ?? []));
  if (!parsed.success) throw new Error('Food search returned an invalid result.');
  const mode = responseData.interpretation?.mode;
  const interpretedQuery = responseData.interpretation?.normalizedTerms?.[0];
  return {
    mode,
    results:
      mode === 'ai' && parsed.data[0]
        ? parsed.data.map((result, index) =>
            index === 0
              ? {
                  ...result,
                  aiAssisted: true,
                  interpretedQuery:
                    typeof interpretedQuery === 'string' ? interpretedQuery : undefined,
                }
              : result,
          )
        : parsed.data,
  };
}

export function hasRelevantFoodResult(results: ReadonlyArray<{ name: string }>, query: string) {
  const connectors = new Set(['a', 'an', 'and', 'for', 'of', 'on', 'the', 'with']);
  const terms = query
    .trim()
    .toLocaleLowerCase('en')
    .split(/[^\p{L}\p{N}]+/u)
    .filter((term) => term.length > 1 && !connectors.has(term));
  return Boolean(
    terms.length &&
    results.some((result) => {
      const name = result.name.toLocaleLowerCase('en');
      return terms.every((term) => name.includes(term));
    }),
  );
}

export async function lookupBarcode(barcode: string): Promise<FoodSearchResult | null> {
  try {
    const { data, error } = await supabase.functions.invoke('meals-api', {
      body: { action: 'lookup-barcode', input: { barcode, locale: 'en-ZA' } },
    });
    if (error) throw error;
    const parsed = foodSearchResultSchema
      .array()
      .safeParse(normalizeGatewayResults(data?.data?.results ?? data?.results ?? []));
    return parsed.success ? (parsed.data[0] ?? null) : null;
  } catch {
    return null;
  }
}

export async function analyzeMealPhoto(base64: string): Promise<MealPhotoAnalysis> {
  try {
    const { data, error } = await supabase.functions.invoke('meals-api', {
      body: {
        action: 'analyze-meal-photo',
        input: { imageBase64: base64, mimeType: 'image/jpeg', locale: 'en-ZA' },
      },
    });
    if (error) throw error;
    return parseMealPhotoAnalysis(data?.data ?? data);
  } catch (error) {
    console.warn(
      '[meals] Photo ingredient suggestions unavailable',
      error instanceof Error ? error.message : error,
    );
    return unavailableMealPhotoAnalysis(error);
  }
}

export async function submitCommunityFood(input: {
  proposedName: string;
  brand?: string;
  barcode?: string;
  serving: { quantity: number; unit: string };
  nutrition: {
    calories: number;
    proteinG: number | null;
    carbsG: number | null;
    fatG: number | null;
  };
}) {
  const { data, error } = await supabase.functions.invoke('meals-api', {
    body: { action: 'submit-food', input },
  });
  if (error) throw error;
  return data?.data ?? data;
}

export function localFoodResults(query: string): FoodSearchResult[] {
  const terms = query.split(/\s+/).filter(Boolean);
  return getAllLibraryMeals()
    .filter(
      (meal) =>
        !terms.length ||
        terms.every((term) =>
          `${meal.name} ${meal.ingredients.join(' ')} ${meal.tags.join(' ')}`
            .toLowerCase()
            .includes(term),
        ),
    )
    .map((meal) => ({
      id: meal.id,
      name: meal.name,
      brand: meal.source.provider === 'Open Food Facts' ? 'Open Food Facts' : undefined,
      source: sourceFor(meal.source.provider),
      providerId: meal.source.sourceId,
      imageUri: meal.imageUrl,
      confidence: 1,
      nutrition: {
        calories: meal.calories,
        proteinG: meal.proteinG,
        carbsG: meal.carbsG,
        fatG: meal.fatG,
      },
      servings: [
        {
          id: `${meal.id}_serving`,
          quantity: 1,
          unit: 'serving',
          label: '1 serving',
          providerId: meal.source.sourceId,
          nutrition: {
            calories: meal.calories,
            proteinG: meal.proteinG,
            carbsG: meal.carbsG,
            fatG: meal.fatG,
          },
        },
      ],
    }));
}

function mergeResults(primary: FoodSearchResult[], secondary: FoodSearchResult[]) {
  const results = new Map<string, FoodSearchResult>();
  [...primary, ...secondary].forEach((item) => {
    const key = `${item.providerId ?? item.id}:${item.name.toLowerCase()}`;
    if (!results.has(key)) results.set(key, item);
  });
  return [...results.values()];
}
