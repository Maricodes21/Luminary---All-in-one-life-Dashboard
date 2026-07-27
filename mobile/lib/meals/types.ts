export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export type NutritionProfile = {
  dateOfBirth: string;
  biologicalSex: 'female' | 'male';
  activityLevel: 'low' | 'moderate' | 'high';
  goal: 'lose' | 'maintain' | 'gain';
  heightCm: number;
  weightKg: number;
  updatedAt: string;
  dietaryPreferences?: string[];
  foodAllergies?: string[];
  dislikedIngredients?: string[];
  maxPrepMinutes?: number;
};

export type BodyMeasurement = {
  id: string;
  measuredAt: string;
  weightKg: number;
  heightCm?: number | null;
};

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

export type MealMutation = {
  id: string;
  action: 'create' | 'update' | 'delete';
  entity: 'meal' | 'profile' | 'measurement' | 'target' | 'plan' | 'plan_entry' | 'feedback';
  payload: unknown;
  createdAt: string;
};

export type SuggestionFeedbackAction = 'accepted' | 'dismissed' | 'saved' | 'substituted';

export type MealUndo = {
  kind: 'meal';
  record: MealLogRecord;
  createdAt: string;
};

export type MealsUserData = {
  profile: NutritionProfile | null;
  measurements: BodyMeasurement[];
  targets: Record<string, DailyNutritionTarget>;
  meals: MealLogRecord[];
  plans: MealPlan[];
  planHistory?: MealPlanHistoryEntry[];
  syncQueue: MealMutation[];
  undo: MealUndo | null;
};

export type MealPlanHistoryEntry = {
  recipeId: string;
  mealType: MealType;
  plannedFor: string;
  generatedAt: string;
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
  cue?: string;
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
  prepMinutes?: number;
  cookMinutes?: number;
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
  imageUri?: string;
  recipeSnapshot?: Recipe;
};

export type MealPlan = {
  id: string;
  weekOf: string;
  title: string;
  entries: MealPlanEntry[];
  createdAt: string;
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
