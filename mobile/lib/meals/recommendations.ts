import { ingredientMatchesAvoidance, ingredientMatchesCustomAvoidance } from './allergens';
import type { CatalogRecipe, PreparationMethod } from './catalog';
import { localDateKey, mealWindowFor } from './dates';
import { calculateMealTotals } from './totals';
import { makeUuid } from './state';
import { recipeImageUri } from './recipeImages';
import type { DailyNutritionTarget, MealLogRecord, MealPlan, MealPlanEntry, MealPlanHistoryEntry, MealType, NutritionProfile } from './types';

type RecommendationInput = {
  recipes: readonly CatalogRecipe[];
  profile: NutritionProfile;
  target: DailyNutritionTarget;
  meals: MealLogRecord[];
  now: Date;
  recentRecipeIds?: string[];
};

export type MealRecommendation = {
  primary: CatalogRecipe | null;
  snack: CatalogRecipe | null;
  candidates: CatalogRecipe[];
  rationale: string;
};

export function recommendForNow({ recipes, profile, target, meals, now, recentRecipeIds = [] }: RecommendationInput): MealRecommendation {
  const totals = calculateMealTotals(meals);
  const remainingCalories = target.calories - totals.calories;
  const mealType = mealWindowFor(now);
  const loggedRecipeIdentities = new Set(meals.map(recipeIdentityForMeal).filter((identity): identity is string => identity !== null));
  const valid = recipes
    .filter((recipe) => recipe.mealType === mealType)
    .filter((recipe) => isRecommendationCandidate(recipe, profile, loggedRecipeIdentities))
    .filter((recipe) => recipe.nutrition.calories <= remainingCalories)
    .sort((left, right) => scoreRecipe(right, target, totals.proteinG, remainingCalories, recentRecipeIds) - scoreRecipe(left, target, totals.proteinG, remainingCalories, recentRecipeIds));
  const primary = valid[0] ?? null;
  const afterPrimary = remainingCalories - (primary?.nutrition.calories ?? 0);
  const snack = mealType === 'snack' || afterPrimary < 120
    ? null
    : recipes
        .filter((recipe) => recipe.mealType === 'snack' && recipe.nutrition.calories <= afterPrimary)
        .filter((recipe) => isRecommendationCandidate(recipe, profile, loggedRecipeIdentities))
        .sort((left, right) => right.nutrition.proteinG - left.nutrition.proteinG)[0] ?? null;
  const currentLogged = meals.some((meal) => meal.mealType === mealType);
  const rationale = !primary
    ? remainingCalories <= 0
      ? 'Your calorie target is already covered for today.'
      : `Nothing verified fits the remaining ${Math.max(0, Math.round(remainingCalories))} calories and your preferences.`
    : currentLogged
      ? `${primary.name} adds ${primary.nutrition.proteinG}g protein and stays inside the ${Math.round(remainingCalories)} calories remaining.`
      : `No ${mealType} is logged yet. ${primary.name} fits the time, preferences, and calories remaining.`;

  return { primary, snack, candidates: valid.slice(0, 8), rationale };
}

export type PreparationBalance = 'spread' | 'mostly';

type PlanOptions = {
  days: number;
  mealTypes: MealType[];
  includeSnack: boolean;
  highProtein?: boolean;
  preparationMethods?: PreparationMethod[];
  preparationBalance?: PreparationBalance;
};

export function buildCatalogPlan({ recipes, profile, target, weekOf, options, history = [] }: {
  recipes: readonly CatalogRecipe[];
  profile: NutritionProfile;
  target: DailyNutritionTarget;
  weekOf: string;
  options: PlanOptions;
  history?: readonly MealPlanHistoryEntry[];
}): MealPlan {
  const entries: MealPlanEntry[] = [];
  const used = new Map<string, number>();
  const methodUse = new Map<PreparationMethod, number>();
  const familyUse = new Map<string, number>();
  const familyLastDay = new Map<string, number>();
  const mealTypes = [...options.mealTypes, ...(options.includeSnack ? ['snack' as const] : [])];
  const preferredMethods = options.preparationMethods ?? [];
  const balance = options.preparationBalance ?? 'spread';
  const historyByRecipe = summarizeHistory(history, weekOf);
  const featuredOffset = stablePlanIndex(`${weekOf}:featured`) % Math.max(1, mealTypes.length);
  const methodOffset = stablePlanIndex(`${weekOf}:method`) % Math.max(1, preferredMethods.length);

  for (let dayIndex = 0; dayIndex < Math.max(1, Math.min(7, options.days)); dayIndex += 1) {
    const localDate = addDays(weekOf, dayIndex);
    let caloriesUsed = 0;
    for (const [mealIndex, mealType] of mealTypes.entries()) {
      const desiredMethod = preferredMethods.length
        ? preferredMethods[(dayIndex + methodOffset) % preferredMethods.length]
        : null;
      const shouldFeatureMethod = !!desiredMethod && (balance === 'mostly' || mealIndex === (dayIndex + featuredOffset) % mealTypes.length);
      const allowed = recipes
        .filter((recipe) => recipe.mealType === mealType && isRecipeAllowed(recipe, profile))
        .filter((recipe) => caloriesUsed + recipe.nutrition.calories <= target.calories);
      const desiredMatches = shouldFeatureMethod
        ? allowed.filter((recipe) => recipe.preparationMethods.includes(desiredMethod))
        : [];
      const selectedPool = desiredMatches.length
        ? desiredMatches
        : shouldFeatureMethod
          ? allowed.filter((recipe) => recipe.preparationMethods.some((method) => preferredMethods.includes(method)))
          : allowed;
      const candidates = selectedPool
        .sort((left, right) => {
          return planCandidateScore(left, {
            used, methodUse, familyUse, familyLastDay, historyByRecipe, dayIndex, mealCount: mealTypes.length,
            calorieTarget: target.calories, highProtein: !!options.highProtein, preferredMethods,
            avoidPreferredMethod: balance === 'spread' && !shouldFeatureMethod,
            seed: `${weekOf}:${localDate}:${mealType}`,
          }) - planCandidateScore(right, {
            used, methodUse, familyUse, familyLastDay, historyByRecipe, dayIndex, mealCount: mealTypes.length,
            calorieTarget: target.calories, highProtein: !!options.highProtein, preferredMethods,
            avoidPreferredMethod: balance === 'spread' && !shouldFeatureMethod,
            seed: `${weekOf}:${localDate}:${mealType}`,
          });
        });
      const recipe = candidates[0];
      if (!recipe) continue;
      entries.push(recipeToPlanEntry(recipe, localDate));
      caloriesUsed += recipe.nutrition.calories;
      used.set(recipe.id, (used.get(recipe.id) ?? 0) + 1);
      for (const method of recipe.preparationMethods) methodUse.set(method, (methodUse.get(method) ?? 0) + 1);
      const family = recipeFamily(recipe);
      familyUse.set(family, (familyUse.get(family) ?? 0) + 1);
      familyLastDay.set(family, dayIndex);
    }
  }

  return {
    id: makeUuid(),
    weekOf,
    title: planTitle(options.highProtein, preferredMethods),
    entries,
    createdAt: new Date().toISOString(),
  };
}

export function catalogSubstitutions(recipes: readonly CatalogRecipe[], entry: MealPlanEntry, profile: NutritionProfile): CatalogRecipe[] {
  return recipes
    .filter((recipe) => recipe.id !== entry.recipeId && recipe.mealType === entry.mealType && isRecipeAllowed(recipe, profile))
    .sort((left, right) => {
      const originalCalories = entry.nutrition?.calories ?? 0;
      return Math.abs(left.nutrition.calories - originalCalories) - Math.abs(right.nutrition.calories - originalCalories);
    });
}

export function isRecipeAllowed(recipe: CatalogRecipe, profile: NutritionProfile): boolean {
  const preferences = profile.dietaryPreferences ?? [];
  if (preferences.length && !preferences.every((preference) => recipe.dietaryTags.includes(preference))) return false;
  const allergies = profile.foodAllergies ?? [];
  const dislikes = profile.dislikedIngredients ?? [];
  if (recipe.ingredients.some((ingredient) => ingredientMatchesAvoidance(ingredient.name, allergies))) return false;
  if (recipe.ingredients.some((ingredient) => ingredientMatchesCustomAvoidance(ingredient.name, dislikes))) return false;
  const timeAgainstLimit = recipe.preparationMethods.includes('slow-cooker') ? recipe.prepMinutes : recipe.prepMinutes + recipe.cookMinutes;
  return timeAgainstLimit <= (profile.maxPrepMinutes ?? 60);
}

type CandidateScoreContext = {
  used: ReadonlyMap<string, number>;
  methodUse: ReadonlyMap<PreparationMethod, number>;
  familyUse: ReadonlyMap<string, number>;
  familyLastDay: ReadonlyMap<string, number>;
  historyByRecipe: ReadonlyMap<string, { count: number; daysAgo: number }>;
  dayIndex: number;
  mealCount: number;
  calorieTarget: number;
  highProtein: boolean;
  preferredMethods: PreparationMethod[];
  avoidPreferredMethod: boolean;
  seed: string;
};

function planCandidateScore(recipe: CatalogRecipe, context: CandidateScoreContext) {
  const history = context.historyByRecipe.get(recipe.id);
  const family = recipeFamily(recipe);
  const lastFamilyDay = context.familyLastDay.get(family);
  const currentWeekPenalty = (context.used.get(recipe.id) ?? 0) * 20_000;
  const historyPenalty = history ? history.count * 700 + Math.max(0, 15 - history.daysAgo) * 450 : 0;
  const familyPenalty = (context.familyUse.get(family) ?? 0) * 65 + (lastFamilyDay != null && context.dayIndex - lastFamilyDay <= 1 ? 500 : 0);
  const methodVarietyPenalty = Math.min(...recipe.preparationMethods.map((method) => context.methodUse.get(method) ?? 0)) * 18;
  const unwantedMethodPenalty = context.avoidPreferredMethod && recipe.preparationMethods.some((method) => context.preferredMethods.includes(method)) ? 650 : 0;
  const caloriePenalty = Math.abs(context.calorieTarget / context.mealCount - recipe.nutrition.calories) / 5;
  const proteinBoost = context.highProtein ? recipe.nutrition.proteinG * -18 : 0;
  return currentWeekPenalty + historyPenalty + familyPenalty + methodVarietyPenalty + unwantedMethodPenalty + caloriePenalty + proteinBoost + stablePlanIndex(`${context.seed}:${recipe.id}`) / 100_000;
}

function summarizeHistory(history: readonly MealPlanHistoryEntry[], weekOf: string) {
  const result = new Map<string, { count: number; daysAgo: number }>();
  for (const item of history) {
    const daysAgo = Math.max(0, daysBetween(item.plannedFor, weekOf));
    if (daysAgo > 42) continue;
    const current = result.get(item.recipeId);
    result.set(item.recipeId, {
      count: (current?.count ?? 0) + 1,
      daysAgo: Math.min(current?.daysAgo ?? Number.POSITIVE_INFINITY, daysAgo),
    });
  }
  return result;
}

function recipeFamily(recipe: CatalogRecipe) {
  const text = `${recipe.name} ${recipe.ingredients.map((ingredient) => ingredient.name).join(' ')}`.toLowerCase();
  const families = ['chicken', 'turkey', 'beef', 'pork', 'salmon', 'tuna', 'cod', 'prawn', 'tofu', 'egg', 'lentil', 'chickpea', 'bean', 'yogurt', 'cottage cheese'];
  return families.find((family) => text.includes(family)) ?? recipe.dietaryTags[0] ?? 'mixed';
}

function daysBetween(from: string, to: string) {
  const fromDate = new Date(`${from}T12:00:00Z`);
  const toDate = new Date(`${to}T12:00:00Z`);
  return Math.round((toDate.getTime() - fromDate.getTime()) / 86_400_000);
}

function planTitle(highProtein: boolean | undefined, preferred: PreparationMethod[]) {
  const methodLabel = preferred.length ? preferred.map((method) => method.replace(/-/g, ' ')).join(' + ') : null;
  if (highProtein && methodLabel) return `High-protein ${methodLabel} week`;
  if (highProtein) return 'High-protein week';
  if (methodLabel) return `${methodLabel.charAt(0).toUpperCase()}${methodLabel.slice(1)} week`;
  return 'Your meal week';
}

function stablePlanIndex(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) hash = (hash * 33 + value.charCodeAt(index)) >>> 0;
  return hash;
}

export function recipeIdentityForMeal(meal: Pick<MealLogRecord, 'providerId'>): string | null {
  const providerId = meal.providerId?.trim();
  return providerId || null;
}

function isLoggedRecipe(recipe: CatalogRecipe, loggedRecipeIdentities: ReadonlySet<string>): boolean {
  const providerId = recipe.providerId?.trim();
  return providerId ? loggedRecipeIdentities.has(providerId) : false;
}

function isRecommendationCandidate(recipe: CatalogRecipe, profile: NutritionProfile, loggedRecipeIdentities: ReadonlySet<string>): boolean {
  return !isLoggedRecipe(recipe, loggedRecipeIdentities) && isRecipeAllowed(recipe, profile);
}

function recipeToPlanEntry(recipe: CatalogRecipe, localDate: string): MealPlanEntry {
  return {
    id: makeUuid(), localDate, mealType: recipe.mealType, name: recipe.name, source: 'curated', servingQuantity: 1,
    servingUnit: 'serving', recipeId: recipe.id, providerId: recipe.providerId, nutrition: recipe.nutrition,
    imageUri: recipeImageUri(recipe),
    recipeSnapshot: recipe,
  };
}

function scoreRecipe(recipe: CatalogRecipe, target: DailyNutritionTarget, proteinLogged: number, remainingCalories: number, recentRecipeIds: string[]) {
  const proteinNeed = Math.max(0, target.proteinG - proteinLogged);
  const proteinScore = Math.min(recipe.nutrition.proteinG, proteinNeed) * 3;
  const calorieFit = 40 * (1 - recipe.nutrition.calories / Math.max(1, remainingCalories));
  const repetitionPenalty = recentRecipeIds.includes(recipe.id) ? 120 : 0;
  return proteinScore + calorieFit - repetitionPenalty;
}

function addDays(localDate: string, days: number) {
  const date = new Date(`${localDate}T12:00:00`);
  date.setDate(date.getDate() + days);
  return localDateKey(date);
}
