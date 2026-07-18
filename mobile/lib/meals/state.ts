import { calculateNutritionTargets } from '../nutrition';
import type {
  DailyNutritionTarget,
  MealLogRecord,
  MealMutation,
  MealPlan,
  MealsUserData,
  NutritionProfile,
  SuggestionFeedbackAction,
} from './types';

export function createEmptyMealsUser(): MealsUserData {
  return {
    profile: null,
    measurements: [],
    targets: {},
    meals: [],
    plans: [],
    syncQueue: [],
    undo: null,
  };
}

export function updateNutritionProfile(
  current: MealsUserData,
  profile: NutritionProfile,
  localDate: string,
  at = new Date(),
): MealsUserData {
  const timestamp = at.toISOString();
  const profileRecord = { ...profile, updatedAt: profile.updatedAt || timestamp };
  const previousMeasurement = current.measurements.at(-1);
  const measurementChanged =
    !previousMeasurement ||
    previousMeasurement.weightKg !== profile.weightKg ||
    previousMeasurement.heightCm !== profile.heightCm;
  const measurement = measurementChanged
      ? {
        id: makeUuid(),
        measuredAt: timestamp,
        weightKg: profile.weightKg,
        heightCm: profile.heightCm,
      }
    : null;
  const calculated = calculateNutritionTargets({
    weightKg: profile.weightKg,
    heightCm: profile.heightCm,
    age: ageOnDate(profile.dateOfBirth, at),
    sex: profile.biologicalSex,
    activityLevel: profile.activityLevel,
    goal: profile.goal,
  });
  const target: DailyNutritionTarget = {
    localDate,
    calories: calculated.calories,
    proteinG: calculated.proteinG,
    carbsG: calculated.carbsG,
    fatG: calculated.fatG,
    calculatedAt: timestamp,
  };

  return {
    ...current,
    profile: profileRecord,
    measurements: measurement ? [...current.measurements, measurement] : current.measurements,
    targets: { ...current.targets, [localDate]: target },
    syncQueue: [
      ...current.syncQueue,
      mutation('profile', 'update', profileRecord, at),
      ...(measurement ? [mutation('measurement', 'create', measurement, at)] : []),
      mutation('target', current.targets[localDate] ? 'update' : 'create', target, at),
    ],
  };
}

export function ensureDailyTarget(current: MealsUserData, localDate: string, at = new Date()): MealsUserData {
  if (current.targets[localDate] || !current.profile) return current;
  return updateNutritionProfile(current, current.profile, localDate, at);
}

export function addMealToUser(current: MealsUserData, meal: MealLogRecord, at = new Date()): MealsUserData {
  return {
    ...current,
    meals: [meal, ...current.meals.filter((item) => item.id !== meal.id)],
    undo: null,
    syncQueue: [...current.syncQueue, mutation('meal', 'create', meal, at)],
  };
}

export function updateMealForUser(
  current: MealsUserData,
  mealId: string,
  updates: Partial<Omit<MealLogRecord, 'id'>>,
  at = new Date(),
): MealsUserData {
  const existing = current.meals.find((meal) => meal.id === mealId);
  if (!existing) return current;
  const meal = { ...existing, ...updates, nutrition: updates.nutrition ?? existing.nutrition };
  return {
    ...current,
    meals: current.meals.map((item) => (item.id === mealId ? meal : item)),
    undo: null,
    syncQueue: [...current.syncQueue, mutation('meal', 'update', meal, at)],
  };
}

export function deleteMealFromUser(current: MealsUserData, mealId: string, at = new Date()): MealsUserData {
  const record = current.meals.find((meal) => meal.id === mealId);
  if (!record) return current;
  return {
    ...current,
    meals: current.meals.filter((meal) => meal.id !== mealId),
    undo: { kind: 'meal', record, createdAt: at.toISOString() },
    syncQueue: [...current.syncQueue, mutation('meal', 'delete', { id: mealId }, at)],
  };
}

export function undoLastMealDeletion(current: MealsUserData, at = new Date()): MealsUserData {
  if (!current.undo || current.undo.kind !== 'meal') return current;
  const restored = current.undo.record;
  return {
    ...current,
    meals: [restored, ...current.meals.filter((meal) => meal.id !== restored.id)],
    undo: null,
    syncQueue: [...current.syncQueue, mutation('meal', 'create', restored, at)],
  };
}

export function dismissMealDeletion(current: MealsUserData): MealsUserData {
  if (!current.undo || current.undo.kind !== 'meal') return current;
  return { ...current, undo: null };
}

export function mergeHydratedMeals(
  remoteMeals: MealLogRecord[],
  localMeals: MealLogRecord[],
  syncQueue: MealMutation[],
): MealLogRecord[] {
  const pendingActions = new Map<string, MealMutation['action']>();
  syncQueue.forEach((mutation) => {
    if (mutation.entity !== 'meal') return;
    const mealId = (mutation.payload as { id?: string } | null)?.id;
    if (mealId) pendingActions.set(mealId, mutation.action);
  });

  const merged = new Map(
    remoteMeals
      .filter((meal) => pendingActions.get(meal.id) !== 'delete')
      .map((meal) => [meal.id, meal]),
  );
  localMeals.forEach((meal) => {
    const action = pendingActions.get(meal.id);
    if (action === 'create' || action === 'update') merged.set(meal.id, meal);
  });

  return [...merged.values()].sort((left, right) => right.consumedAt.localeCompare(left.consumedAt));
}

export function mergeHydratedPlans(
  remotePlans: MealPlan[],
  localPlans: MealPlan[],
  syncQueue: MealMutation[],
): MealPlan[] {
  const hasPendingPlanChange = syncQueue.some(
    (item) => item.entity === 'plan' || item.entity === 'plan_entry',
  );
  return hasPendingPlanChange ? localPlans : remotePlans;
}

export function replacePlansForUser(
  current: MealsUserData,
  plans: MealPlan[],
  at = new Date(),
): MealsUserData {
  const replacementIds = new Set(plans.map((plan) => plan.id));
  const supersededIds = current.plans
    .map((plan) => plan.id)
    .filter((planId) => !replacementIds.has(planId));

  return {
    ...current,
    plans,
    syncQueue: [
      ...current.syncQueue,
      ...(supersededIds.length > 0
        ? [mutation('plan', 'delete', { planIds: supersededIds }, at)]
        : []),
      mutation('plan', 'update', plans, at),
    ],
  };
}

export function importLegacyMealsForUser(
  current: MealsUserData,
  imported: Pick<MealsUserData, 'meals' | 'plans'>,
  at = new Date(),
): MealsUserData {
  if (current.meals.length > 0 || current.plans.length > 0) return current;
  if (!imported.meals.length && !imported.plans.length) return current;
  return {
    ...current,
    meals: imported.meals,
    plans: imported.plans,
    syncQueue: [
      ...current.syncQueue,
      ...imported.meals.map((meal) => mutation('meal', 'create', meal, at)),
      ...(imported.plans.length ? [mutation('plan', 'update', imported.plans, at)] : []),
    ],
  };
}

export function addPlanEntryToUser(
  current: MealsUserData,
  planId: string,
  entry: MealPlan['entries'][number],
  at = new Date(),
): MealsUserData {
  if (!current.plans.some((plan) => plan.id === planId)) return current;
  return {
    ...current,
    plans: current.plans.map((plan) => plan.id === planId
      ? { ...plan, entries: [...plan.entries.filter((item) => item.id !== entry.id), entry] }
      : plan),
    syncQueue: [...current.syncQueue, mutation('plan_entry', 'update', { planId, entry }, at)],
  };
}

export function deletePlanEntryFromUser(
  current: MealsUserData,
  planId: string,
  entryId: string,
  at = new Date(),
): MealsUserData {
  const exists = current.plans.some((plan) => plan.id === planId && plan.entries.some((entry) => entry.id === entryId));
  if (!exists) return current;
  return {
    ...current,
    plans: current.plans.map((plan) => plan.id === planId
      ? { ...plan, entries: plan.entries.filter((entry) => entry.id !== entryId) }
      : plan),
    syncQueue: [...current.syncQueue, mutation('plan_entry', 'delete', { planId, entryId }, at)],
  };
}

export function addSuggestionFeedbackToUser(
  current: MealsUserData,
  candidateId: string,
  action: SuggestionFeedbackAction,
  context: Record<string, unknown> = {},
  at = new Date(),
): MealsUserData {
  const payload = {
    id: makeUuid(),
    localDate: localDateFromDate(at),
    candidateId,
    action,
    context,
    createdAt: at.toISOString(),
  };
  return {
    ...current,
    syncQueue: [...(Array.isArray(current.syncQueue) ? current.syncQueue : []), mutation('feedback', 'create', payload, at)],
  };
}

export function ageOnDate(dateOfBirth: string, date: Date): number {
  const [year, month, day] = dateOfBirth.split('-').map(Number);
  if (!year || !month || !day) return 30;
  let age = date.getFullYear() - year;
  const birthdayPassed = date.getMonth() + 1 > month || (date.getMonth() + 1 === month && date.getDate() >= day);
  if (!birthdayPassed) age -= 1;
  return Math.max(13, Math.min(120, age));
}

function mutation(
  entity: 'meal' | 'profile' | 'measurement' | 'target' | 'plan' | 'plan_entry' | 'feedback',
  action: 'create' | 'update' | 'delete',
  payload: unknown,
  at: Date,
) {
  return {
    id: makeId('mutation', at),
    entity,
    action,
    payload,
    createdAt: at.toISOString(),
  } as const;
}

function localDateFromDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function makeId(prefix: string, at = new Date()): string {
  return `${prefix}_${at.getTime()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function makeUuid(): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') return globalThis.crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (character) => {
    const random = Math.floor(Math.random() * 16);
    const value = character === 'x' ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}
