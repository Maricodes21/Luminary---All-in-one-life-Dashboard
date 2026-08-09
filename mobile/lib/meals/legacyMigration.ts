import { localDateKey } from './dates';
import type { MealLogRecord, MealPlan, MealPlanEntry, MealSource, MealType, Recipe } from './types';

type MigratedMeals = Pick<{ meals: MealLogRecord[]; plans: MealPlan[] }, 'meals' | 'plans'>;

export function migrateLegacyMealsState(value: unknown, timezone: string, now = new Date()): MigratedMeals {
  const root = record(value);
  const state = record(root?.state);
  if (!state) return { meals: [], plans: [] };

  const meals = array(state.meals).map((item) => mapLegacyMeal(item, timezone)).filter(isPresent);
  const planDays = array(state.mealPlan);
  if (!planDays.length) return { meals, plans: [] };

  const weekOf = legacyWeekOf(state.syncQueue) ?? localDateKey(now);
  const entries = planDays.flatMap((day, dayIndex) => mapLegacyPlanDay(day, addDays(weekOf, dayIndex)));
  const plans: MealPlan[] = entries.length
    ? [{ id: `legacy_plan_${weekOf}`, weekOf, title: 'Imported weekly plan', entries, createdAt: now.toISOString() }]
    : [];
  return { meals, plans };
}

function mapLegacyMeal(value: unknown, timezone: string): MealLogRecord | null {
  const item = record(value);
  if (!item || !text(item.id) || !text(item.name) || !isLocalDate(item.mealDate)) return null;
  const mealType = asMealType(item.mealType);
  const calories = nonnegative(item.calories);
  if (!mealType || calories == null) return null;
  return {
    id: text(item.id)!, name: text(item.name)!, localDate: text(item.mealDate)!,
    consumedAt: `${text(item.mealDate)}T12:00:00`, timezone, mealType,
    servingQuantity: 1, servingUnit: 'serving',
    nutrition: {
      calories,
      proteinG: nonnegative(item.proteinG),
      carbsG: nonnegative(item.carbsG),
      fatG: nonnegative(item.fatG),
    },
    source: legacySource(item.source), providerId: text(item.providerId) ?? undefined, notes: text(item.prep) ?? undefined,
  };
}

function mapLegacyPlanDay(value: unknown, localDate: string): MealPlanEntry[] {
  const day = record(value);
  if (!day) return [];
  const rows: Array<[MealType, unknown]> = [
    ['breakfast', day.breakfast], ['lunch', day.lunch], ['dinner', day.dinner],
    ...array(day.snacks).map((snack): [MealType, unknown] => ['snack', snack]),
  ];
  return rows.map(([mealType, slot], index) => mapLegacySlot(slot, localDate, mealType, `${text(day.id) ?? localDate}_${mealType}_${index}`)).filter(isPresent);
}

function mapLegacySlot(value: unknown, localDate: string, mealType: MealType, id: string): MealPlanEntry | null {
  const slot = record(value);
  if (!slot || !text(slot.name)) return null;
  const calories = nonnegative(slot.calories);
  if (calories == null) return null;
  const nutrition = {
    calories,
    proteinG: nonnegative(slot.proteinG),
    carbsG: nonnegative(slot.carbsG),
    fatG: nonnegative(slot.fatG),
  };
  const recipeId = text(slot.recipeId) ?? `${id}_recipe`;
  const ingredients = array(slot.ingredients).map(text).filter(isPresent);
  const prepSteps = array(slot.prepSteps).map(text).filter(isPresent);
  const recipeSnapshot: Recipe = {
    id: recipeId,
    name: text(slot.name)!,
    source: 'curated',
    servings: positive(slot.servings) ?? 1,
    description: text(slot.note) ?? undefined,
    nutrition,
    ingredients: ingredients.map((name, index) => ({ id: `${id}_ingredient_${index}`, name })),
    steps: prepSteps.map((step, index) => ({ id: `${id}_step_${index}`, text: step })),
    substitutions: array(slot.substitutions).map(text).filter(isPresent),
    dietaryTags: [],
    prepMinutes: nonnegative(slot.prepTimeMinutes) ?? undefined,
  };
  return {
    id, localDate, mealType, name: text(slot.name)!, source: 'curated',
    servingQuantity: positive(slot.servings) ?? 1, servingUnit: 'serving',
    recipeId, nutrition, note: text(slot.note) ?? undefined, recipeSnapshot,
  };
}

function legacyWeekOf(value: unknown): string | null {
  const mutation = array(value).find((item) => {
    const row = record(item);
    return row?.entity === 'meal_plan' && isLocalDate(record(row.payload)?.weekOf);
  });
  const weekOf = record(record(mutation)?.payload)?.weekOf;
  return isLocalDate(weekOf) ? weekOf : null;
}

function addDays(localDate: string, days: number): string {
  const date = new Date(`${localDate}T12:00:00`);
  date.setDate(date.getDate() + days);
  return localDateKey(date);
}

function legacySource(value: unknown): MealSource {
  return value === 'manual' || value === 'usda' || value === 'open_food_facts' ? value : 'curated';
}
function asMealType(value: unknown): MealType | null { return value === 'breakfast' || value === 'lunch' || value === 'dinner' || value === 'snack' ? value : null; }
function record(value: unknown): Record<string, unknown> | null { return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null; }
function array(value: unknown): unknown[] { return Array.isArray(value) ? value : []; }
function text(value: unknown): string | null { return typeof value === 'string' && value.trim() ? value.trim() : null; }
function nonnegative(value: unknown): number | null { const number = Number(value); return Number.isFinite(number) && number >= 0 ? number : null; }
function positive(value: unknown): number | null { const number = Number(value); return Number.isFinite(number) && number > 0 ? number : null; }
function isLocalDate(value: unknown): value is string { return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value); }
function isPresent<T>(value: T | null): value is T { return value !== null; }
