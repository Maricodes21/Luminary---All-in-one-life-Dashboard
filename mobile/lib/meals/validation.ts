import { z } from 'zod';

import type { Recipe } from './types';

const localDatePattern = /^\d{4}-\d{2}-\d{2}$/;

export const mealTypeSchema = z.enum(['breakfast', 'lunch', 'dinner', 'snack']);
export const mealSourceSchema = z.enum(['manual', 'curated', 'usda', 'open_food_facts', 'community', 'commercial', 'ai_vision']);

export const nutritionValuesSchema = z.object({
  calories: z.number().finite().nonnegative(),
  proteinG: z.number().finite().nonnegative().nullable(),
  carbsG: z.number().finite().nonnegative().nullable(),
  fatG: z.number().finite().nonnegative().nullable(),
});

export const mealLogRecordSchema = z.object({
  id: z.string(),
  name: z.string(),
  localDate: z.string().regex(localDatePattern),
  consumedAt: z.string(),
  timezone: z.string(),
  mealType: mealTypeSchema,
  servingQuantity: z.number(),
  servingUnit: z.string(),
  nutrition: nutritionValuesSchema,
  source: mealSourceSchema,
  providerId: z.string().optional(),
  notes: z.string().optional(),
  imageUri: z.string().optional(),
  confidence: z.number().min(0).max(1).nullable().optional(),
});

export const dailyNutritionTargetSchema = z.object({
  localDate: z.string().regex(localDatePattern),
  calories: z.number(),
  proteinG: z.number(),
  carbsG: z.number(),
  fatG: z.number(),
  calculatedAt: z.string(),
});

export const foodServingSchema = z.object({
  id: z.string(),
  quantity: z.number(),
  unit: z.string(),
  label: z.string().optional(),
  grams: z.number().nullable().optional(),
  nutrition: nutritionValuesSchema.nullable().optional(),
  providerId: z.string().optional(),
});

export const foodSearchResultSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    source: mealSourceSchema,
    servings: z.array(foodServingSchema).default([]),
    brand: z.string().optional(),
    providerId: z.string().optional(),
    imageUri: z.string().optional(),
    confidence: z.number().min(0).max(1).nullable().optional(),
    nutrition: nutritionValuesSchema.nullable().optional(),
  })
  .superRefine(requireProviderIdForAiNutrition);

export const recipeIngredientSchema = z.object({
  id: z.string(),
  name: z.string(),
  quantity: z.number().nullable().optional(),
  unit: z.string().nullable().optional(),
  note: z.string().optional(),
  imageUri: z.string().optional(),
});

export const recipeStepSchema = z.object({
  id: z.string(),
  text: z.string(),
  durationMinutes: z.number().nullable().optional(),
  cue: z.string().optional(),
});

export const recipeSchema = z.object({
  id: z.string(),
  name: z.string(),
  source: mealSourceSchema,
  servings: z.number(),
  description: z.string().optional(),
  imageUri: z.string().optional(),
  providerId: z.string().optional(),
  nutrition: nutritionValuesSchema.nullable().optional(),
  ingredients: z.array(recipeIngredientSchema).default([]),
  steps: z.array(recipeStepSchema).default([]),
  substitutions: z.array(z.string()).default([]),
  dietaryTags: z.array(z.string()).default([]),
  prepMinutes: z.number().nonnegative().optional(),
  cookMinutes: z.number().nonnegative().optional(),
});

export const mealPlanEntrySchema = z.object({
  id: z.string(),
  localDate: z.string().regex(localDatePattern),
  mealType: mealTypeSchema,
  name: z.string(),
  source: mealSourceSchema,
  servingQuantity: z.number(),
  servingUnit: z.string(),
  recipeId: z.string().optional(),
  providerId: z.string().optional(),
  nutrition: nutritionValuesSchema.nullable().optional(),
  note: z.string().optional(),
  imageUri: z.string().optional(),
  recipeSnapshot: recipeSchema.optional(),
});

export const dailySuggestionSchema = z.object({
  localDate: z.string().regex(localDatePattern),
  entries: z.array(mealPlanEntrySchema),
  rationale: z.string().optional(),
  totals: nutritionValuesSchema.nullable().optional(),
});

export const interpretedFoodQuerySchema = z
  .object({
    rawQuery: z.string(),
    normalizedQuery: z.string(),
    source: mealSourceSchema,
    providerId: z.string().optional(),
    mealType: mealTypeSchema.optional(),
    nutrition: nutritionValuesSchema.nullable().optional(),
    serving: foodServingSchema.nullable().optional(),
    confidence: z.number().min(0).max(1).nullable().optional(),
  })
  .superRefine(requireProviderIdForAiNutrition);

export function parseRecipe(value: unknown): { success: true; data: Recipe } | { success: false; error: z.ZodError } {
  const parsed = recipeSchema.safeParse(value);
  if (parsed.success) {
    return { success: true, data: parsed.data };
  }

  return { success: false, error: parsed.error };
}

function requireProviderIdForAiNutrition(
  value: { source: z.infer<typeof mealSourceSchema>; providerId?: string; nutrition?: z.infer<typeof nutritionValuesSchema> | null },
  ctx: z.RefinementCtx,
) {
  if (value.source === 'ai_vision' && value.nutrition && !value.providerId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['providerId'],
      message: 'AI-supplied nutrition requires a provider record id.',
    });
  }
}
