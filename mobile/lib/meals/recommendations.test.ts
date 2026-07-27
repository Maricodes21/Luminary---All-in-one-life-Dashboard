import assert from 'node:assert/strict';
import test from 'node:test';

import type { CatalogRecipe } from './catalog';
import { recipeCatalog } from './catalog';
import { buildCatalogPlan, isRecipeAllowed, recommendForNow } from './recommendations';
import type { DailyNutritionTarget, MealLogRecord, MealPlanHistoryEntry, NutritionProfile } from './types';

const profile: NutritionProfile = {
  dateOfBirth: '1994-05-20', biologicalSex: 'female', activityLevel: 'moderate', goal: 'maintain',
  heightCm: 168, weightKg: 66, updatedAt: '2026-07-13T08:00:00.000Z',
  dietaryPreferences: [], foodAllergies: [], dislikedIngredients: [], maxPrepMinutes: 45,
};
const target: DailyNutritionTarget = { localDate: '2026-07-13', calories: 2100, proteinG: 120, carbsG: 245, fatG: 65, calculatedAt: '2026-07-13T00:00:00.000Z' };

function recipeWith(ingredientName: string): CatalogRecipe {
  const recipe = recipeCatalog[0];
  return {
    ...recipe,
    ingredients: [{ ...recipe.ingredients[0], name: ingredientName }],
  };
}

function loggedCatalogMeal(recipe: CatalogRecipe): MealLogRecord {
  return {
    id: 'meal_logged_catalog_recipe',
    name: recipe.name,
    localDate: target.localDate,
    consumedAt: '2026-07-13T07:30:00+02:00',
    timezone: 'Africa/Johannesburg',
    mealType: recipe.mealType,
    servingQuantity: 1,
    servingUnit: 'serving',
    nutrition: recipe.nutrition,
    source: 'curated',
    providerId: recipe.providerId,
  };
}

test('recommendation respects the current meal window and remaining calories', () => {
  const result = recommendForNow({ recipes: recipeCatalog, profile, target, meals: [], now: new Date('2026-07-13T12:30:00+02:00') });
  assert.equal(result.primary?.mealType, 'lunch');
  assert.ok((result.primary?.nutrition.calories ?? Infinity) <= target.calories);
  assert.ok(result.candidates.every((recipe) => recipe.nutrition.calories <= target.calories));
});

test('overnight recommendation is snack-only and never exceeds remaining calories', () => {
  const result = recommendForNow({ recipes: recipeCatalog, profile, target: { ...target, calories: 300 }, meals: [], now: new Date('2026-07-13T23:30:00+02:00') });
  assert.equal(result.primary?.mealType, 'snack');
  assert.ok((result.primary?.nutrition.calories ?? Infinity) <= 300);
});

test('weekly catalog plan stays within daily targets and uses valid recipe IDs', () => {
  const plan = buildCatalogPlan({ recipes: recipeCatalog, profile, target, weekOf: '2026-07-13', options: { days: 7, mealTypes: ['breakfast', 'lunch', 'dinner'], includeSnack: true } });
  assert.equal(new Set(plan.entries.map((entry) => entry.localDate)).size, 7);
  for (const date of new Set(plan.entries.map((entry) => entry.localDate))) {
    const calories = plan.entries.filter((entry) => entry.localDate === date).reduce((sum, entry) => sum + (entry.nutrition?.calories ?? 0), 0);
    assert.ok(calories <= target.calories, `${date} exceeds target with ${calories}`);
  }
  assert.ok(plan.entries.every((entry) => recipeCatalog.some((recipe) => recipe.id === entry.recipeId)));
});

test('weekly plans prioritize the chosen cooking method without repeating meals', () => {
  const plan = buildCatalogPlan({
    recipes: recipeCatalog,
    profile,
    target,
    weekOf: '2026-07-27',
    options: {
      days: 7,
      mealTypes: ['breakfast', 'lunch', 'dinner'],
      includeSnack: true,
      preparationMethods: ['air-fryer'],
    },
  });
  const selectedRecipes = plan.entries.map((entry) => recipeCatalog.find((recipe) => recipe.id === entry.recipeId)).filter(Boolean);

  assert.match(plan.title, /Air fryer/i);
  assert.ok(selectedRecipes.filter((recipe) => recipe?.preparationMethods.includes('air-fryer')).length >= 4);
  for (const mealType of ['breakfast', 'lunch', 'dinner', 'snack'] as const) {
    const ids = plan.entries.filter((entry) => entry.mealType === mealType).map((entry) => entry.recipeId);
    assert.equal(new Set(ids).size, ids.length, `${mealType} repeats inside one week`);
  }
});

test('preferred cooking methods are spread across the week instead of front-loaded', () => {
  const plan = buildCatalogPlan({ recipes: recipeCatalog, profile, target, weekOf: '2026-08-03', options: { days: 7, mealTypes: ['breakfast', 'lunch', 'dinner'], includeSnack: true, preparationMethods: ['air-fryer'], preparationBalance: 'spread' } });
  const methodCounts = [...new Set(plan.entries.map((entry) => entry.localDate))].map((date) => plan.entries
    .filter((entry) => entry.localDate === date)
    .filter((entry) => recipeCatalog.find((recipe) => recipe.id === entry.recipeId)?.preparationMethods.includes('air-fryer')).length);
  assert.ok(methodCounts.every((count) => count >= 1 && count <= 2), methodCounts.join(','));
});

test('four consecutive weeks remember recent meals and keep rotating the catalog', () => {
  const history: MealPlanHistoryEntry[] = [];
  const idsByType = new Map<string, Set<string>>();
  for (const weekOf of ['2026-08-03', '2026-08-10', '2026-08-17', '2026-08-24']) {
    const plan = buildCatalogPlan({ recipes: recipeCatalog, profile, target, weekOf, options: { days: 7, mealTypes: ['breakfast', 'lunch', 'dinner'], includeSnack: true, preparationMethods: ['air-fryer', 'one-pan'], preparationBalance: 'spread' }, history });
    for (const entry of plan.entries) {
      const values = idsByType.get(entry.mealType) ?? new Set<string>();
      if (entry.recipeId) values.add(entry.recipeId);
      idsByType.set(entry.mealType, values);
      if (entry.recipeId) history.push({ recipeId: entry.recipeId, mealType: entry.mealType, plannedFor: entry.localDate, generatedAt: plan.createdAt });
    }
  }
  for (const mealType of ['breakfast', 'lunch', 'dinner', 'snack'] as const) {
    const eligible = recipeCatalog.filter((recipe) => recipe.mealType === mealType && isRecipeAllowed(recipe, profile)).length;
    assert.ok((idsByType.get(mealType)?.size ?? 0) >= Math.min(16, Math.ceil(eligible * 0.8)), `${mealType} did not rotate enough`);
  }
});

test('slow-cooker recipes use hands-on prep time against the user limit', () => {
  const slowCookerRecipe = recipeCatalog.find((recipe) => recipe.preparationMethods.includes('slow-cooker'));
  assert.ok(slowCookerRecipe);
  assert.ok((slowCookerRecipe.prepMinutes + slowCookerRecipe.cookMinutes) > (profile.maxPrepMinutes ?? 0));
  assert.equal(isRecipeAllowed(slowCookerRecipe, profile), true);
});

test('allergy and diet constraints remove invalid recipes before ranking', () => {
  const veganNutFree = { ...profile, dietaryPreferences: ['vegan'], foodAllergies: ['peanut', 'almond', 'walnut', 'cashew', 'pistachio'] };
  const plan = buildCatalogPlan({ recipes: recipeCatalog, profile: veganNutFree, target, weekOf: '2026-07-13', options: { days: 3, mealTypes: ['breakfast', 'lunch', 'dinner'], includeSnack: false } });
  for (const entry of plan.entries) {
    const recipe = recipeCatalog.find((item) => item.id === entry.recipeId);
    assert.ok(recipe?.dietaryTags.includes('vegan'));
    assert.ok(recipe?.ingredients.every((ingredient) => !veganNutFree.foodAllergies.some((allergen) => ingredient.name.toLowerCase().includes(allergen))));
  }
});

test('fish allergy blocks named fish and fish sauce', () => {
  const fishProfile = { ...profile, foodAllergies: ['fish'] };
  assert.equal(isRecipeAllowed(recipeWith('salmon fillet'), fishProfile), false);
  assert.equal(isRecipeAllowed(recipeWith('fish sauce'), fishProfile), false);
  assert.equal(isRecipeAllowed(recipeWith('starfruit'), fishProfile), true);
});

test('canonical allergy families block their named ingredient aliases', () => {
  const cases = [
    { family: 'fish', ingredient: 'salmon fillet' },
    { family: 'shellfish', ingredient: 'grilled shrimp' },
    { family: 'peanut', ingredient: 'groundnuts' },
    { family: 'tree nuts', ingredient: 'walnut pieces' },
    { family: 'dairy', ingredient: 'whole milk' },
    { family: 'egg', ingredient: 'egg whites' },
    { family: 'soy', ingredient: 'firm tofu' },
    { family: 'wheat/gluten', ingredient: 'pearl barley' },
    { family: 'sesame', ingredient: 'tahini' },
  ];

  for (const { family, ingredient } of cases) {
    const allergyProfile = { ...profile, foodAllergies: [family] };
    assert.equal(isRecipeAllowed(recipeWith(ingredient), allergyProfile), false, `${family} should block ${ingredient}`);
  }
});

test('dairy allergy allows deterministic plant milk butter and cream compounds', () => {
  const dairyProfile = { ...profile, foodAllergies: ['dairy'] };
  const safeCompounds = [
    'coconut milk',
    'almond milk',
    'oat milk',
    'peanut butter',
    'almond butter',
    'cocoa butter',
    'cashew cream',
    'coconut cream',
  ];

  for (const ingredient of safeCompounds) {
    assert.equal(isRecipeAllowed(recipeWith(ingredient), dairyProfile), true, `${ingredient} should not count as dairy`);
  }
});

test('dairy allergy still blocks genuine dairy ingredients', () => {
  const dairyProfile = { ...profile, foodAllergies: ['dairy'] };
  for (const ingredient of ['whole milk', 'salted butter', 'cheddar cheese', 'Greek yogurt']) {
    assert.equal(isRecipeAllowed(recipeWith(ingredient), dairyProfile), false, `${ingredient} should count as dairy`);
  }
});

test('custom dislikes use exact phrase tokens without canonical family expansion', () => {
  const cases = [
    { dislike: 'milk', blocked: 'whole milk', allowed: 'cheddar cheese' },
    { dislike: 'almond', blocked: 'almond flour', allowed: 'walnut pieces' },
    { dislike: 'fish', blocked: 'fish sauce', allowed: 'salmon fillet' },
  ];

  for (const { dislike, blocked, allowed } of cases) {
    const dislikeProfile = { ...profile, dislikedIngredients: [dislike] };
    assert.equal(isRecipeAllowed(recipeWith(blocked), dislikeProfile), false, `${dislike} should block ${blocked}`);
    assert.equal(isRecipeAllowed(recipeWith(allowed), dislikeProfile), true, `${dislike} should not widen to ${allowed}`);
  }
});

test('logged canonical recipe identities are excluded', () => {
  const loggedRecipe = recipeCatalog[0];
  const now = new Date('2026-07-13T08:00:00+02:00');
  const result = recommendForNow({
    recipes: [loggedRecipe],
    profile,
    target,
    meals: [loggedCatalogMeal(loggedRecipe)],
    now,
    recentRecipeIds: [],
  });
  assert.ok(result.candidates.every((recipe) => recipe.id !== loggedRecipe.id));
});

test('logged canonical snack identities are excluded from snack recommendations', () => {
  const dinnerRecipe = recipeCatalog.find((recipe) => recipe.mealType === 'dinner');
  const loggedSnack = recipeCatalog.find((recipe) => recipe.mealType === 'snack');
  assert.ok(dinnerRecipe);
  assert.ok(loggedSnack);

  const result = recommendForNow({
    recipes: [dinnerRecipe, loggedSnack],
    profile: { ...profile, maxPrepMinutes: 120 },
    target: { ...target, calories: 3000 },
    meals: [loggedCatalogMeal(loggedSnack)],
    now: new Date('2026-07-13T18:00:00+02:00'),
    recentRecipeIds: [],
  });

  assert.equal(result.primary?.id, dinnerRecipe.id);
  assert.equal(result.snack, null);
});
