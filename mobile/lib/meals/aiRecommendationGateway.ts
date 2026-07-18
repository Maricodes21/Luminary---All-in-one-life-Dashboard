import { supabase } from '../supabase';
import { resolveRankedRecipeIds } from './aiRecommendations';
import type { CatalogRecipe } from './catalog';

export async function rankDailySuggestionCandidates(
  candidates: readonly CatalogRecipe[],
  context: Record<string, unknown>,
): Promise<CatalogRecipe[]> {
  if (candidates.length < 2) return [...candidates];
  try {
    const { data, error } = await supabase.functions.invoke('meals-api', {
      body: {
        action: 'daily-suggestions',
        input: {
          candidates: candidates.map((recipe) => ({
            id: recipe.id,
            name: recipe.name,
            mealType: recipe.mealType,
            calories: recipe.nutrition.calories,
            proteinG: recipe.nutrition.proteinG,
            prepMinutes: recipe.prepMinutes + recipe.cookMinutes,
            dietaryTags: recipe.dietaryTags,
          })),
          context,
        },
      },
    });
    if (error) throw error;
    return resolveRankedRecipeIds(candidates, data?.data?.result ?? data?.data?.suggestions ?? data);
  } catch (error) {
    console.warn('[meals] AI suggestion ranking unavailable; keeping the safe local order', error instanceof Error ? error.message : error);
    return [...candidates];
  }
}
