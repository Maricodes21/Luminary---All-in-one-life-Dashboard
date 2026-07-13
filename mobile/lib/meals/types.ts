export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export type MealSource = 'manual' | 'curated' | 'usda' | 'open_food_facts' | 'community' | 'commercial' | 'ai_vision';

export type NutritionValues = {
  calories: number;
  proteinG: number | null;
  carbsG: number | null;
  fatG: number | null;
};

export type MealLogRecord = {
  id: string;
  name: string;
  localDate: string;
  consumedAt: string;
  timezone: string;
  mealType: MealType;
  servingQuantity: number;
  servingUnit: string;
  nutrition: NutritionValues;
  source: MealSource;
  providerId?: string;
  notes?: string;
  imageUri?: string;
  confidence?: number | null;
};

export type DailyNutritionTarget = {
  localDate: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  calculatedAt: string;
};

export type FoodServing = {
  id: string;
  quantity: number;
  unit: string;
  label?: string;
  grams?: number | null;
  nutrition?: NutritionValues | null;
  providerId?: string;
};

export type FoodSearchResult = {
  id: string;
  name: string;
  source: MealSource;
  servings: FoodServing[];
  brand?: string;
  providerId?: string;
  imageUri?: string;
  confidence?: number | null;
  nutrition?: NutritionValues | null;
};

export type RecipeIngredient = {
  id: string;
  name: string;
  quantity?: number | null;
  unit?: string | null;
  note?: string;
};

export type RecipeStep = {
  id: string;
  text: string;
  durationMinutes?: number | null;
};

export type Recipe = {
  id: string;
  name: string;
  source: MealSource;
  servings: number;
  description?: string;
  imageUri?: string;
  providerId?: string;
  nutrition?: NutritionValues | null;
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
  substitutions: string[];
  dietaryTags: string[];
};

export type MealPlanEntry = {
  id: string;
  localDate: string;
  mealType: MealType;
  name: string;
  source: MealSource;
  servingQuantity: number;
  servingUnit: string;
  recipeId?: string;
  providerId?: string;
  nutrition?: NutritionValues | null;
  note?: string;
};

export type DailySuggestion = {
  localDate: string;
  entries: MealPlanEntry[];
  rationale?: string;
  totals?: NutritionValues | null;
};

export type InterpretedFoodQuery = {
  rawQuery: string;
  normalizedQuery: string;
  source: MealSource;
  providerId?: string;
  mealType?: MealType;
  nutrition?: NutritionValues | null;
  serving?: FoodServing | null;
  confidence?: number | null;
};

export type MealTotals = {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  macrosComplete: boolean;
};

export type RemainingNutrition = {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
};
