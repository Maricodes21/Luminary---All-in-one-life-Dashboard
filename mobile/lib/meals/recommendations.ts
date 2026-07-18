import { ingredientMatchesAvoidance, ingredientMatchesCustomAvoidance } from './allergens';
import type { CatalogRecipe } from './catalog';
import { localDateKey, mealWindowFor } from './dates';
import { calculateMealTotals } from './totals';
import { makeUuid } from './state';
import { recipeImageUri } from './recipeImages';
import type { DailyNutritionTarget, MealLogRecord, MealPlan, MealPlanEntry, MealType, NutritionProfile } from './types';

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

type PlanOptions = {
  days: number;
  mealTypes: MealType[];
  includeSnack: boolean;
  highProtein?: boolean;
};

export function buildCatalogPlan({ recipes, profile, target, weekOf, options }: {
  recipes: readonly CatalogRecipe[];
  profile: NutritionProfile;
  target: DailyNutritionTarget;
  weekOf: string;
  options: PlanOptions;
}): MealPlan {
  const entries: MealPlanEntry[] = [];
  const used = new Map<string, number>();
  const mealTypes = [...options.mealTypes, ...(options.includeSnack ? ['snack' as const] : [])];

  for (let dayIndex = 0; dayIndex < Math.max(1, Math.min(7, options.days)); dayIndex += 1) {
    const localDate = addDays(weekOf, dayIndex);
    let caloriesUsed = 0;
    for (const mealType of mealTypes) {
      const candidates = recipes
        .filter((recipe) => recipe.mealType === mealType && isRecipeAllowed(recipe, profile))
        .filter((recipe) => caloriesUsed + recipe.nutrition.calories <= target.calories)
        .sort((left, right) => {
          const repeatDifference = (used.get(left.id) ?? 0) - (used.get(right.id) ?? 0);
          if (repeatDifference) return repeatDifference;
          if (options.highProtein) return right.nutrition.proteinG - left.nutrition.proteinG;
          return Math.abs(target.calories / mealTypes.length - left.nutrition.calories) - Math.abs(target.calories / mealTypes.length - right.nutrition.calories);
        });
      const recipe = candidates[(dayIndex + entries.length) % Math.max(1, Math.min(3, candidates.length))] ?? candidates[0];
      if (!recipe) continue;
      entries.push(recipeToPlanEntry(recipe, localDate));
      caloriesUsed += recipe.nutrition.calories;
      used.set(recipe.id, (used.get(recipe.id) ?? 0) + 1);
    }
  }

  return {
    id: makeUuid(),
    weekOf,
    title: options.highProtein ? 'High-protein week' : 'Personalized week',
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
  return recipe.prepMinutes + recipe.cookMinutes <= (profile.maxPrepMinutes ?? 60);
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
