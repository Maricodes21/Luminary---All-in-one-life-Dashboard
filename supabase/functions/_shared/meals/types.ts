export const MEALS_ACTIONS = [
  'search-foods',
  'lookup-barcode',
  'submit-food',
  'analyze-meal-photo',
  'daily-suggestions',
  'generate-meal-plan',
  'substitute-meal',
  'generate-recipe-image',
] as const;

export type MealsAction = (typeof MEALS_ACTIONS)[number];

export type MealAIJobType =
  | 'query_interpretation'
  | 'suggestion_ranking'
  | 'meal_vision'
  | 'plan_generation'
  | 'recipe_generation'
  | 'recipe_image';

export type FoodProviderId = 'open_food_facts' | 'usda' | 'commercial';

export interface FoodServing {
  label?: string;
  quantity?: number;
  unit?: string;
  calories?: number;
  proteinG?: number;
  carbsG?: number;
  fatG?: number;
}

export interface FoodSearchResult {
  provider: FoodProviderId | string;
  providerId: string;
  name: string;
  brand?: string;
  barcode?: string;
  imageUrl?: string;
  sourceUrl?: string;
  serving: FoodServing;
}

export interface FoodSearchQuery {
  query: string;
  locale?: string;
  limit?: number;
}

export interface FoodSearchProvider {
  readonly id: FoodProviderId | string;
  readonly enabled: boolean;
  search(input: FoodSearchQuery): Promise<FoodSearchResult[]>;
  lookupBarcode(barcode: string, locale?: string): Promise<FoodSearchResult[]>;
}

export interface QueryInterpretation {
  normalizedTerms: string[];
  providerIds: string[];
}

export interface MealAIProvider {
  readonly available: boolean;
  readonly paid: boolean;
  readonly model: string;
  interpretQuery(
    input: { query: string; locale?: string },
    allowedProviderIds: ReadonlySet<string>,
  ): Promise<QueryInterpretation>;
  run(action: MealsAction, input: Record<string, unknown>): Promise<unknown>;
}

export interface AuthenticatedUser {
  id: string;
  accessToken?: string;
}

export interface TelemetryEvent {
  userId: string;
  jobType: MealAIJobType;
  provider: string;
  model: string;
  status: 'running' | 'succeeded' | 'failed' | 'blocked_budget' | 'blocked_quota';
  estimatedCostUsd?: number;
  errorCode?: string;
  usage?: Record<string, unknown>;
}

export interface TelemetryHook {
  emit(event: TelemetryEvent): Promise<void>;
}

export interface FoodSubmissionStore {
  submit(user: AuthenticatedUser, input: Record<string, unknown>): Promise<Record<string, unknown>>;
}

export const AI_JOB_BY_ACTION: Partial<Record<MealsAction, MealAIJobType>> = {
  'analyze-meal-photo': 'meal_vision',
  'daily-suggestions': 'suggestion_ranking',
  'generate-meal-plan': 'plan_generation',
  'substitute-meal': 'recipe_generation',
  'generate-recipe-image': 'recipe_image',
};

export function isMealsAction(value: unknown): value is MealsAction {
  return typeof value === 'string' && (MEALS_ACTIONS as readonly string[]).includes(value);
}
