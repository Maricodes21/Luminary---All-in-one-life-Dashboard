import type { MealAIJobType } from './types.ts';

export const DEFAULT_PILOT_QUOTAS: Readonly<Record<MealAIJobType, number>> = {
  query_interpretation: 30,
  suggestion_ranking: 12,
  meal_vision: 3,
  plan_generation: 2,
  recipe_generation: 5,
  recipe_image: 5,
};

const WEEKLY_FEATURES = new Set<MealAIJobType>(['plan_generation', 'recipe_generation', 'recipe_image']);

export interface PilotQuotaStore {
  getDailyUsage(userId: string, feature: MealAIJobType): Promise<number>;
  getWeeklyUsage?(userId: string, feature: MealAIJobType): Promise<number>;
}

export interface PilotQuotaDecision {
  allowed: boolean;
  limit: number;
  remaining: number;
}

export class PilotQuotaGuard {
  private readonly limits: Readonly<Partial<Record<MealAIJobType, number>>>;
  private readonly store: PilotQuotaStore;

  constructor(options: {
    limits?: Readonly<Partial<Record<MealAIJobType, number>>>;
    store: PilotQuotaStore;
  }) {
    this.limits = options.limits ?? DEFAULT_PILOT_QUOTAS;
    this.store = options.store;
  }

  async check(userId: string, feature: MealAIJobType): Promise<PilotQuotaDecision> {
    const limit = Math.max(0, Math.floor(this.limits[feature] ?? 0));
    const weekly = WEEKLY_FEATURES.has(feature) && this.store.getWeeklyUsage;
    const used = Math.max(0, Math.floor(weekly ? await this.store.getWeeklyUsage!(userId, feature) : await this.store.getDailyUsage(userId, feature)));
    return {
      allowed: used < limit,
      limit,
      remaining: Math.max(0, limit - used),
    };
  }
}
