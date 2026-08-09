import type { MealPhotoAnalysis, MealPhotoAnalysisStatus } from './types';

const MAX_VISIBLE_INGREDIENTS = 12;
const MAX_INGREDIENT_LENGTH = 80;

export function normalizeVisibleIngredients(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const ingredients: string[] = [];

  for (const item of value) {
    if (typeof item !== 'string') continue;
    const ingredient = item.trim().replace(/\s+/g, ' ');
    const key = ingredient.toLocaleLowerCase('en');
    if (ingredient.length < 2 || ingredient.length > MAX_INGREDIENT_LENGTH || seen.has(key))
      continue;
    seen.add(key);
    ingredients.push(ingredient);
    if (ingredients.length === MAX_VISIBLE_INGREDIENTS) break;
  }

  return ingredients;
}

export function parseMealPhotoAnalysis(value: unknown): MealPhotoAnalysis {
  const payload = asRecord(value);
  const ingredients = normalizeVisibleIngredients(payload.ingredients);
  if (payload.mode === 'ai' && ingredients.length) return { status: 'ready', ingredients };

  const reason = typeof payload.reason === 'string' ? payload.reason : 'no_visible_ingredients';
  return { status: statusForReason(reason), ingredients: [], reason };
}

export function unavailableMealPhotoAnalysis(error: unknown): MealPhotoAnalysis {
  const message = error instanceof Error ? error.message.toLocaleLowerCase('en') : '';
  const timedOut = message.includes('timeout') || message.includes('abort');
  return {
    status: timedOut ? 'timeout' : 'unavailable',
    ingredients: [],
    reason: timedOut ? 'ai_timeout' : 'network_unavailable',
  };
}

function statusForReason(reason: string): MealPhotoAnalysisStatus {
  if (reason === 'ai_timeout') return 'timeout';
  if (reason === 'pilot_quota_exhausted') return 'quota';
  if (reason === 'paid_budget_blocked') return 'budget';
  return 'unavailable';
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}
