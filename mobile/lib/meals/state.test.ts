import assert from 'node:assert/strict';
import test from 'node:test';

import {
  addMealToUser,
  createEmptyMealsUser,
  deleteMealFromUser,
  addSuggestionFeedbackToUser,
  addPlanEntryToUser,
  deletePlanEntryFromUser,
  mergeHydratedMeals,
  mergeHydratedPlans,
  importLegacyMealsForUser,
  replacePlansForUser,
  updateMealForUser,
  updateNutritionProfile,
} from './state';
import type { MealLogRecord, NutritionProfile } from './types';

const profile: NutritionProfile = {
  dateOfBirth: '1994-05-20',
  biologicalSex: 'female',
  activityLevel: 'moderate',
  goal: 'maintain',
  heightCm: 168,
  weightKg: 66,
  updatedAt: '2026-07-13T08:00:00.000Z',
};

const meal: MealLogRecord = {
  id: 'meal_1',
  name: 'Oats and berries',
  localDate: '2026-07-13',
  consumedAt: '2026-07-13T06:30:00.000Z',
  timezone: 'Africa/Johannesburg',
  mealType: 'breakfast',
  servingQuantity: 1,
  servingUnit: 'bowl',
  nutrition: { calories: 420, proteinG: 18, carbsG: 61, fatG: 11 },
  source: 'manual',
};

test('profile updates snapshot targets by local date and retain weight history', () => {
  const initial = updateNutritionProfile(
    createEmptyMealsUser(),
    profile,
    '2026-07-13',
    new Date('2026-07-13T08:00:00.000Z'),
  );
  const changed = updateNutritionProfile(
    initial,
    { ...profile, weightKg: 64, updatedAt: '2026-08-20T08:00:00.000Z' },
    '2026-08-20',
    new Date('2026-08-20T08:00:00.000Z'),
  );

  assert.equal(changed.measurements.length, 2);
  assert.equal(changed.measurements[0]?.weightKg, 66);
  assert.equal(changed.measurements[1]?.weightKg, 64);
  assert.ok(changed.targets['2026-07-13']);
  assert.ok(changed.targets['2026-08-20']);
  assert.notEqual(changed.targets['2026-07-13']?.calories, undefined);
});

test('meal add, edit, delete, and undo data stay in one user bucket', () => {
  const initial = createEmptyMealsUser();
  const added = addMealToUser(initial, meal);
  const edited = updateMealForUser(added, meal.id, {
    name: 'Overnight oats and berries',
    nutrition: { ...meal.nutrition, calories: 450 },
  });
  const deleted = deleteMealFromUser(edited, meal.id);

  assert.equal(added.meals.length, 1);
  assert.equal(edited.meals[0]?.name, 'Overnight oats and berries');
  assert.equal(edited.meals[0]?.nutrition.calories, 450);
  assert.equal(deleted.meals.length, 0);
  assert.equal(deleted.undo?.kind, 'meal');
  assert.equal(deleted.undo?.record.id, meal.id);
  assert.equal(initial.meals.length, 0);
});

test('remote hydration cannot restore a meal with a pending local deletion', () => {
  const localUpdate = { ...meal, name: 'Updated oats' };
  const result = mergeHydratedMeals(
    [meal, { ...meal, id: 'meal_remote', name: 'Remote lunch' }],
    [localUpdate],
    [
      { id: 'update_1', entity: 'meal', action: 'update', payload: localUpdate, createdAt: '2026-07-13T09:00:00.000Z' },
      { id: 'delete_1', entity: 'meal', action: 'delete', payload: { id: meal.id }, createdAt: '2026-07-13T09:01:00.000Z' },
    ],
  );

  assert.deepEqual(result.map((item) => item.id), ['meal_remote']);
});

test('suggestion feedback is queued with user context for later sync', () => {
  const updated = addSuggestionFeedbackToUser(
    createEmptyMealsUser(),
    'recipe_oats',
    'dismissed',
    { mealType: 'breakfast' },
    new Date('2026-07-14T06:00:00.000Z'),
  );

  const mutation = updated.syncQueue[0];
  assert.equal(mutation?.entity, 'feedback');
  assert.equal((mutation?.payload as { candidateId: string }).candidateId, 'recipe_oats');
  assert.deepEqual((mutation?.payload as { context: unknown }).context, { mealType: 'breakfast' });
});

test('remote hydration cannot roll back pending local plan changes', () => {
  const localPlan = { id: 'plan_local', weekOf: '2026-07-14', title: 'Local week', entries: [], createdAt: '2026-07-14T06:00:00.000Z' };
  const remotePlan = { ...localPlan, id: 'plan_remote', title: 'Stale remote week' };
  const pending = [{ id: 'mutation_plan', entity: 'plan_entry' as const, action: 'delete' as const, payload: { planId: localPlan.id }, createdAt: '2026-07-14T06:01:00.000Z' }];

  assert.deepEqual(mergeHydratedPlans([remotePlan], [localPlan], pending), [localPlan]);
  assert.deepEqual(mergeHydratedPlans([remotePlan], [localPlan], []), [remotePlan]);
});

test('replacing a plan queues deletion of superseded remote plan IDs', () => {
  const oldPlan = { id: 'plan_old', weekOf: '2026-07-14', title: 'Old', entries: [], createdAt: '2026-07-14T06:00:00.000Z' };
  const newPlan = { ...oldPlan, id: 'plan_new', title: 'New' };
  const updated = replacePlansForUser({ ...createEmptyMealsUser(), plans: [oldPlan] }, [newPlan]);

  assert.deepEqual(updated.plans, [newPlan]);
  assert.equal(updated.syncQueue[0]?.action, 'delete');
  assert.deepEqual(updated.syncQueue[0]?.payload, { planIds: ['plan_old'] });
  assert.equal(updated.syncQueue[1]?.action, 'update');
});

test('legacy import is one-way and queues records for the authenticated account', () => {
  const plan = { id: 'legacy_plan', weekOf: '2026-07-14', title: 'Imported', entries: [], createdAt: '2026-07-14T06:00:00.000Z' };
  const imported = importLegacyMealsForUser(createEmptyMealsUser(), { meals: [meal], plans: [plan] });
  const ignored = importLegacyMealsForUser(imported, { meals: [{ ...meal, id: 'duplicate' }], plans: [] });

  assert.equal(imported.meals[0]?.id, meal.id);
  assert.deepEqual(imported.syncQueue.map((item) => item.entity), ['meal', 'plan']);
  assert.equal(ignored, imported);
});

test('day editing adds and deletes addressable plan entries without replacing the week', () => {
  const plan = { id: 'plan_week', weekOf: '2026-07-14', title: 'Week', entries: [], createdAt: '2026-07-14T06:00:00.000Z' };
  const entry = { id: 'entry_lunch', localDate: '2026-07-15', mealType: 'lunch' as const, name: 'Bean bowl', source: 'curated' as const, servingQuantity: 1, servingUnit: 'serving' };
  const added = addPlanEntryToUser({ ...createEmptyMealsUser(), plans: [plan] }, plan.id, entry);
  const deleted = deletePlanEntryFromUser(added, plan.id, entry.id);

  assert.equal(added.plans[0]?.entries[0]?.id, entry.id);
  assert.equal(added.syncQueue[0]?.entity, 'plan_entry');
  assert.equal(deleted.plans[0]?.entries.length, 0);
  assert.deepEqual(deleted.syncQueue.at(-1)?.payload, { planId: plan.id, entryId: entry.id });
});
