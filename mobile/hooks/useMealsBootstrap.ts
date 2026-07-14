import { useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { supabase } from '@/lib/supabase';
import { migrateLegacyMealsState } from '@/lib/meals/legacyMigration';
import { parseRecipe } from '@/lib/meals/validation';
import type {
  BodyMeasurement,
  DailyNutritionTarget,
  MealLogRecord,
  MealMutation,
  MealPlan,
  MealPlanEntry,
  MealsUserData,
  NutritionProfile,
} from '@/lib/meals/types';
import { useAuthStore } from '@/stores/useAuthStore';
import { activeMealsUser, useMealsStore } from '@/stores/useMealsStore';

export function useMealsBootstrap() {
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const activeUserId = useMealsStore((state) => state.activeUserId);
  const user = useMealsStore(activeMealsUser);
  const hydrateUser = useMealsStore((state) => state.hydrateUser);
  const importLegacyData = useMealsStore((state) => state.importLegacyData);
  const clearSyncedMutation = useMealsStore((state) => state.clearSyncedMutation);
  const syncing = useRef(false);

  useEffect(() => {
    if (!userId || activeUserId !== userId) return;
    let cancelled = false;

    void (async () => {
      await importLegacyMealsOnce(userId, importLegacyData);
      const data = await loadMealsUser(userId);
      if (!cancelled && data) hydrateUser(userId, data);
    })();

    return () => {
      cancelled = true;
    };
  }, [activeUserId, hydrateUser, importLegacyData, userId]);

  useEffect(() => {
    if (!userId || activeUserId !== userId || !user?.syncQueue.length || syncing.current) return;
    let cancelled = false;
    syncing.current = true;

    void (async () => {
      for (const mutation of user.syncQueue) {
        if (cancelled) break;
        try {
          await syncMutation(userId, mutation);
          if (!cancelled) clearSyncedMutation(mutation.id);
        } catch (error) {
          console.warn('[meals] Offline change is waiting to sync', error instanceof Error ? error.message : error);
          break;
        }
      }
    })().finally(() => {
      syncing.current = false;
    });

    return () => {
      cancelled = true;
    };
  }, [activeUserId, clearSyncedMutation, user?.syncQueue, userId]);
}

async function importLegacyMealsOnce(
  userId: string,
  importData: (userId: string, data: Pick<MealsUserData, 'meals' | 'plans'>) => void,
) {
  const ownerKey = 'luminary.meals.legacy-owner.v1';
  const markerKey = `luminary.meals.legacy-migrated.v1.${userId}`;
  if (await AsyncStorage.getItem(markerKey)) return;
  const existingOwner = await AsyncStorage.getItem(ownerKey);
  if (existingOwner && existingOwner !== userId) {
    await AsyncStorage.setItem(markerKey, 'skipped');
    return;
  }
  const serialized = await AsyncStorage.getItem('luminary.production.store');
  if (!serialized) {
    await AsyncStorage.setItem(markerKey, 'empty');
    return;
  }
  try {
    const migrated = migrateLegacyMealsState(JSON.parse(serialized), currentTimezone());
    if (migrated.meals.length || migrated.plans.length) {
      await AsyncStorage.setItem(ownerKey, userId);
      importData(userId, migrated);
    }
    await AsyncStorage.setItem(markerKey, 'complete');
  } catch (error) {
    console.warn('[meals] Legacy meal data could not be imported', error instanceof Error ? error.message : error);
  }
}

function currentTimezone() {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'; } catch { return 'UTC'; }
}

async function loadMealsUser(userId: string): Promise<Partial<MealsUserData> | null> {
  const [profileResult, measurementsResult, targetsResult, mealsResult, plansResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('date_of_birth, biological_sex, activity_level, nutrition_goal, height_cm, weight_kg, nutrition_updated_at, dietary_preferences, food_allergies, disliked_ingredients, max_prep_minutes')
      .eq('user_id', userId)
      .maybeSingle(),
    supabase.from('body_measurements').select('*').eq('user_id', userId).order('measured_at', { ascending: true }),
    supabase.from('daily_nutrition_targets').select('*').eq('user_id', userId),
    supabase.from('meals').select('*').eq('user_id', userId).order('consumed_at', { ascending: false }),
    supabase
      .from('meal_plans')
      .select('*, meal_plan_entries(*)')
      .eq('user_id', userId)
      .order('week_of', { ascending: false }),
  ]);

  const errors = [profileResult.error, measurementsResult.error, targetsResult.error, mealsResult.error, plansResult.error].filter(Boolean);
  if (errors.length) {
    console.warn('[meals] Remote hydration is unavailable; continuing from private local data', errors[0]?.message);
  }

  const profile = mapProfile(profileResult.data);
  const targets = Object.fromEntries(
    (targetsResult.data ?? []).map((row) => [row.local_date, mapTarget(row)]),
  );

  return {
    ...(profile ? { profile } : {}),
    ...(measurementsResult.data ? { measurements: measurementsResult.data.map(mapMeasurement) } : {}),
    ...(targetsResult.data ? { targets } : {}),
    ...(mealsResult.data ? { meals: mealsResult.data.map(mapMeal) } : {}),
    ...(plansResult.data ? { plans: plansResult.data.map(mapPlan) } : {}),
  };
}

async function syncMutation(userId: string, mutation: MealMutation): Promise<void> {
  if (mutation.entity === 'meal') {
    const payload = mutation.payload as MealLogRecord | { id: string };
    if (mutation.action === 'delete') {
      const result = await supabase.from('meals').delete().eq('id', payload.id).eq('user_id', userId);
      if (result.error) throw result.error;
      return;
    }
    const meal = payload as MealLogRecord;
    const result = await supabase.from('meals').upsert({
      id: meal.id,
      user_id: userId,
      meal_date: meal.localDate,
      consumed_at: meal.consumedAt,
      timezone: meal.timezone,
      meal_type: meal.mealType,
      serving_quantity: meal.servingQuantity,
      serving_unit: meal.servingUnit,
      name: meal.name,
      calories: meal.nutrition.calories,
      protein_g: meal.nutrition.proteinG,
      carbs_g: meal.nutrition.carbsG,
      fat_g: meal.nutrition.fatG,
      source: meal.source,
      provider_id: meal.providerId ?? null,
      confidence: meal.confidence ?? null,
      notes: meal.notes ?? null,
      image_path: meal.imageUri ?? null,
    });
    if (result.error) throw result.error;
    return;
  }

  if (mutation.entity === 'profile') {
    const profile = mutation.payload as NutritionProfile;
    const result = await supabase.from('profiles').update({
      date_of_birth: profile.dateOfBirth,
      biological_sex: profile.biologicalSex,
      activity_level: profile.activityLevel,
      nutrition_goal: profile.goal,
      height_cm: profile.heightCm,
      weight_kg: profile.weightKg,
      nutrition_updated_at: profile.updatedAt,
      dietary_preferences: profile.dietaryPreferences ?? [],
      food_allergies: profile.foodAllergies ?? [],
      disliked_ingredients: profile.dislikedIngredients ?? [],
      max_prep_minutes: profile.maxPrepMinutes ?? 60,
    }).eq('user_id', userId);
    if (result.error) throw result.error;
    return;
  }

  if (mutation.entity === 'measurement') {
    const measurement = mutation.payload as BodyMeasurement;
    const result = await supabase.from('body_measurements').upsert({
      id: measurement.id,
      user_id: userId,
      weight_kg: measurement.weightKg,
      height_cm: measurement.heightCm ?? null,
      measured_at: measurement.measuredAt,
      source: 'manual',
    });
    if (result.error) throw result.error;
    return;
  }

  if (mutation.entity === 'target') {
    const target = mutation.payload as DailyNutritionTarget;
    const result = await supabase.from('daily_nutrition_targets').upsert({
      user_id: userId,
      local_date: target.localDate,
      calories: target.calories,
      protein_g: target.proteinG,
      carbs_g: target.carbsG,
      fat_g: target.fatG,
      calculated_at: target.calculatedAt,
    }, { onConflict: 'user_id,local_date' });
    if (result.error) throw result.error;
    return;
  }

  if (mutation.entity === 'feedback') {
    const feedback = mutation.payload as {
      id: string;
      localDate: string;
      candidateId: string;
      action: string;
      context: Record<string, unknown>;
      createdAt: string;
    };
    const result = await supabase.from('suggestion_feedback').insert({
      id: feedback.id,
      user_id: userId,
      local_date: feedback.localDate,
      candidate_id: feedback.candidateId,
      action: feedback.action,
      context: feedback.context,
      created_at: feedback.createdAt,
    });
    if (result.error) throw result.error;
    return;
  }

  if (mutation.entity === 'plan') {
    await syncPlanMutation(userId, mutation);
    return;
  }

  if (mutation.entity === 'plan_entry') {
    const payload = mutation.payload as { planId: string; localDate?: string; entryId?: string; entry?: MealPlanEntry };
    if (mutation.action === 'delete' && payload.entryId) {
      const result = await supabase.from('meal_plan_entries').delete().eq('id', payload.entryId).eq('user_id', userId);
      if (result.error) throw result.error;
      return;
    }
    if (mutation.action === 'delete' && payload.localDate) {
      const result = await supabase.from('meal_plan_entries').delete().eq('plan_id', payload.planId).eq('user_id', userId).eq('local_date', payload.localDate);
      if (result.error) throw result.error;
      return;
    }
    if (payload.entry) {
      const entry = payload.entry;
      const result = await supabase.from('meal_plan_entries').upsert({
        id: entry.id, plan_id: payload.planId, user_id: userId, local_date: entry.localDate, meal_type: entry.mealType,
        position: 0, recipe_id: entry.recipeId ?? null, servings: entry.servingQuantity, recipe_snapshot: entry,
      });
      if (result.error) throw result.error;
    }
  }
}

async function syncPlanMutation(userId: string, mutation: MealMutation) {
  const payload = mutation.payload as MealPlan[] | { planId?: string; planIds?: string[] };
  if (mutation.action === 'delete') {
    const ids = Array.isArray((payload as { planIds?: string[] }).planIds)
      ? (payload as { planIds: string[] }).planIds
      : (payload as { planId?: string }).planId
        ? [(payload as { planId: string }).planId]
        : [];
    if (ids.length) {
      const result = await supabase.from('meal_plans').delete().in('id', ids).eq('user_id', userId);
      if (result.error) throw result.error;
    }
    return;
  }
  if (!Array.isArray(payload)) return;
  for (const plan of payload) {
    const target = Object.values(useMealsStore.getState().users[userId]?.targets ?? {}).at(-1);
    if (!target) throw new Error('A nutrition target is required before syncing a plan.');
    const planResult = await supabase.from('meal_plans').upsert({
      id: plan.id,
      user_id: userId,
      week_of: plan.weekOf,
      calorie_target: target.calories,
      protein_target_g: target.proteinG,
      carbs_target_g: target.carbsG,
      fat_target_g: target.fatG,
      days: [],
      created_at: plan.createdAt,
    });
    if (planResult.error) throw planResult.error;
    const entryResult = await supabase.from('meal_plan_entries').upsert(plan.entries.map((entry, position) => ({
      id: entry.id,
      plan_id: plan.id,
      user_id: userId,
      local_date: entry.localDate,
      meal_type: entry.mealType,
      position,
      recipe_id: entry.recipeId ?? null,
      servings: entry.servingQuantity,
      recipe_snapshot: entry,
    })));
    if (entryResult.error) throw entryResult.error;
  }
}

function mapProfile(row: Record<string, unknown> | null): NutritionProfile | null {
  if (!row?.date_of_birth || !row.biological_sex || !row.activity_level || !row.nutrition_goal || !row.height_cm || !row.weight_kg) return null;
  return {
    dateOfBirth: String(row.date_of_birth),
    biologicalSex: row.biological_sex as NutritionProfile['biologicalSex'],
    activityLevel: row.activity_level as NutritionProfile['activityLevel'],
    goal: row.nutrition_goal as NutritionProfile['goal'],
    heightCm: Number(row.height_cm),
    weightKg: Number(row.weight_kg),
    updatedAt: String(row.nutrition_updated_at ?? new Date().toISOString()),
    dietaryPreferences: stringArray(row.dietary_preferences),
    foodAllergies: stringArray(row.food_allergies),
    dislikedIngredients: stringArray(row.disliked_ingredients),
    maxPrepMinutes: Number(row.max_prep_minutes ?? 60),
  };
}

function mapMeasurement(row: Record<string, unknown>): BodyMeasurement {
  return { id: String(row.id), measuredAt: String(row.measured_at), weightKg: Number(row.weight_kg), heightCm: row.height_cm == null ? null : Number(row.height_cm) };
}

function mapTarget(row: Record<string, unknown>): DailyNutritionTarget {
  return { localDate: String(row.local_date), calories: Number(row.calories), proteinG: Number(row.protein_g), carbsG: Number(row.carbs_g), fatG: Number(row.fat_g), calculatedAt: String(row.calculated_at) };
}

function mapMeal(row: Record<string, unknown>): MealLogRecord {
  return {
    id: String(row.id), name: String(row.name), localDate: String(row.meal_date), consumedAt: String(row.consumed_at ?? row.created_at),
    timezone: String(row.timezone ?? 'UTC'), mealType: (row.meal_type ?? 'snack') as MealLogRecord['mealType'],
    servingQuantity: Number(row.serving_quantity ?? 1), servingUnit: String(row.serving_unit ?? 'serving'),
    nutrition: { calories: Number(row.calories ?? 0), proteinG: nullableNumber(row.protein_g), carbsG: nullableNumber(row.carbs_g), fatG: nullableNumber(row.fat_g) },
    source: (row.source ?? 'manual') as MealLogRecord['source'], providerId: row.provider_id ? String(row.provider_id) : undefined,
    confidence: nullableNumber(row.confidence), notes: row.notes ? String(row.notes) : undefined, imageUri: row.image_path ? String(row.image_path) : undefined,
  };
}

function mapPlan(row: Record<string, unknown>): MealPlan {
  const entries = Array.isArray(row.meal_plan_entries) ? row.meal_plan_entries.map(mapPlanEntry) : [];
  return { id: String(row.id), weekOf: String(row.week_of), title: 'Weekly plan', entries, createdAt: String(row.created_at) };
}

function mapPlanEntry(row: Record<string, unknown>): MealPlanEntry {
  const snapshot = row.recipe_snapshot && typeof row.recipe_snapshot === 'object' ? row.recipe_snapshot as Record<string, unknown> : {};
  const nutrition = snapshot.nutrition && typeof snapshot.nutrition === 'object' ? snapshot.nutrition as MealPlanEntry['nutrition'] : null;
  const parsedRecipe = parseRecipe(snapshot.recipeSnapshot);
  return {
    id: String(row.id), localDate: String(row.local_date), mealType: row.meal_type as MealPlanEntry['mealType'],
    name: String(snapshot.name ?? 'Planned meal'), source: (snapshot.source ?? 'curated') as MealPlanEntry['source'],
    servingQuantity: Number(row.servings ?? snapshot.servingQuantity ?? 1), servingUnit: String(snapshot.servingUnit ?? 'serving'),
    recipeId: row.recipe_id ? String(row.recipe_id) : undefined, providerId: snapshot.providerId ? String(snapshot.providerId) : undefined,
    nutrition, note: snapshot.note ? String(snapshot.note) : undefined, imageUri: snapshot.imageUri ? String(snapshot.imageUri) : undefined,
    recipeSnapshot: parsedRecipe.success ? parsedRecipe.data : undefined,
  };
}

function nullableNumber(value: unknown): number | null {
  return value == null ? null : Number(value);
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String) : [];
}
