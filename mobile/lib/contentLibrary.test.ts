import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildBudgetPlan,
  getFoodSourceSummary,
  getMealSuggestions,
  getSubstitutionsForMeal,
  getWorkoutAlternatives,
  searchContentLibrary,
} from './contentLibrary';
import { getDailyFocusNote } from './dailyFocus';
import { getHabitIconName } from './habitIcons';
import { buildMealPlanDay, buildMealPlanWeek, buildWorkoutDays, coerceMealPlanSlot } from './planning';
import { workoutVisualOrder } from './exerciseVisualManifest';
import { buildWorkoutPlan, getWorkoutCatalogSize, getWorkoutVisualIds } from './workoutPlanning';

test('meal search returns local and provider-backed options with attribution', () => {
  const results = searchContentLibrary('chicken');

  assert.ok(results.meals.length >= 2);
  assert.ok(results.meals.every((meal) => meal.source.provider.length > 0));
  assert.ok(results.meals.some((meal) => meal.source.provider === 'Curated'));
});

test('meal suggestions adapt to user goal and expose substitutions', () => {
  const suggestions = getMealSuggestions('gain', 'dinner');
  const substitutions = getSubstitutionsForMeal(suggestions[0].id);

  assert.ok(suggestions.length > 0);
  assert.equal(suggestions[0].mealType, 'dinner');
  assert.ok(suggestions.some((meal) => meal.goalFit.includes('gain')));
  assert.ok(substitutions.length > 0);
});

test('workout alternatives stay within equipment and level constraints', () => {
  const alternatives = getWorkoutAlternatives({
    category: 'gym',
    level: 'beginner',
    equipment: ['dumbbells'],
  });

  assert.ok(alternatives.length > 0);
  assert.ok(alternatives.every((exercise) => exercise.level !== 'advanced'));
  assert.ok(alternatives.every((exercise) => exercise.equipment.some((item) => item === 'dumbbells' || item === 'bodyweight')));
});

test('budget plan calculates monthly envelope and remaining spend', () => {
  const plan = buildBudgetPlan({
    monthlyIncome: 30000,
    budgets: [
      { category: 'Needs', limit: 12000 },
      { category: 'Wants', limit: 4500 },
      { category: 'Savings', limit: 6000 },
      { category: 'Emergencies', limit: 1500 },
    ],
    spentByCategory: { Needs: 9000, Wants: 2000, Savings: 2500, Emergencies: 0 },
  });

  assert.equal(plan.totalBudget, 24000);
  assert.equal(plan.monthlySurplus, 6000);
  assert.equal(plan.categories.Wants.remaining, 2500);
  assert.equal(plan.categories.Needs.percentUsed, 75);
});

test('food source summary prefers free data sources and notes live lookup policy', () => {
  const summary = getFoodSourceSummary();

  assert.ok(summary.primarySources.some((source) => source.provider === 'USDA FoodData Central'));
  assert.ok(summary.primarySources.some((source) => source.provider === 'Open Food Facts'));
  assert.equal(summary.lookupPolicy, 'cache-first');
});

test('exercise library exposes image metadata for future generated illustrations', () => {
  const alternatives = getWorkoutAlternatives({
    category: 'calisthenics',
    level: 'beginner',
    equipment: ['bodyweight'],
  });

  assert.ok(alternatives.length > 0);
  assert.ok(alternatives.every((exercise) => exercise.imageUrl.startsWith('https://')));
  assert.ok(alternatives.every((exercise) => exercise.imageMeta?.source === 'sourced_photo'));
  assert.ok(alternatives.every((exercise) => exercise.imageMeta?.alt.length > 0));
});

test('daily focus notes rotate deterministically by date and context', () => {
  const context = {
    displayName: 'Mari',
    toneProfile: 'gentle' as const,
    completedHabits: 1,
    totalHabits: 3,
    proteinRemaining: 42,
    ritualDone: false,
  };

  const monday = getDailyFocusNote('2026-07-06', context);
  const mondayAgain = getDailyFocusNote('2026-07-06', context);
  const tuesday = getDailyFocusNote('2026-07-07', context);

  assert.equal(monday, mondayAgain);
  assert.notEqual(monday, tuesday);
  assert.ok(monday.length > 20);
});

test('habit icons reflect common habit meaning instead of a generic check', () => {
  assert.equal(getHabitIconName('Water before bed'), 'water');
  assert.equal(getHabitIconName('Read ten pages'), 'book');
  assert.equal(getHabitIconName('Log one expense'), 'money');
  assert.equal(getHabitIconName('Reset the room'), 'home');
  assert.equal(getHabitIconName('Ten-minute walk'), 'health');
});

test('meal plan days include prep instructions per meal', () => {
  const day = buildMealPlanDay('maintain', 2);
  const slots = [day.breakfast, day.lunch, day.dinner, ...day.snacks];

  assert.ok(slots.length >= 4);
  assert.ok(slots.every((slot) => Array.isArray(slot.prepSteps)));
  assert.ok(slots.every((slot) => (slot.prepSteps?.length ?? 0) >= 2));
});

test('weekly meal plans are varied enough for a full planner', () => {
  const week = buildMealPlanWeek('maintain', '2026-07-06');
  const dinners = week.map((day) => day.dinner.name);

  assert.equal(week.length, 7);
  assert.ok(new Set(dinners).size >= 6);
  assert.ok(week.every((day) => [day.breakfast, day.lunch, day.dinner, ...day.snacks].length >= 4));
});

test('meal plan slots expose recipe guide fields', () => {
  const week = buildMealPlanWeek('gain', '2026-07-06');
  const slots = week.flatMap((day) => [day.breakfast, day.lunch, day.dinner, ...day.snacks]);

  assert.ok(slots.every((slot) => slot.recipeId));
  assert.ok(slots.every((slot) => slot.imageUrl?.startsWith('https://')));
  assert.ok(slots.every((slot) => (slot.ingredients?.length ?? 0) >= 3));
  assert.ok(slots.every((slot) => (slot.prepSteps?.length ?? 0) >= 3));
  assert.ok(slots.every((slot) => typeof slot.carbsG === 'number'));
  assert.ok(slots.every((slot) => typeof slot.fatG === 'number'));
  assert.ok(slots.every((slot) => typeof slot.prepTimeMinutes === 'number'));
});

test('legacy meal plan slots are upgraded before rendering prep guides', () => {
  const slot = coerceMealPlanSlot(
    {
      name: 'Legacy salmon dinner',
      calories: 580,
      proteinG: 42,
      note: 'Old persisted plan item',
      substitutions: 'swap something' as unknown as string[],
    },
    'Dinner',
  );

  assert.equal(slot.name, 'Legacy salmon dinner');
  assert.equal(slot.calories, 580);
  assert.ok(slot.imageUrl.startsWith('https://'));
  assert.ok(slot.ingredients.length >= 3);
  assert.ok(slot.prepSteps.length >= 3);
  assert.equal(typeof slot.carbsG, 'number');
  assert.equal(typeof slot.fatG, 'number');
  assert.equal(slot.substitutions, undefined);
});

test('workout generation varies sessions by category and volume', () => {
  const beginner = buildWorkoutDays('gym', 'beginner', '2026-07-06');
  const steady = buildWorkoutDays('gym', 'steady', '2026-07-06');
  const advanced = buildWorkoutDays('gym', 'advanced', '2026-07-06');
  const cycling = buildWorkoutDays('cycling', 'advanced', '2026-07-06');

  assert.equal(beginner.length, 3);
  assert.equal(steady.length, 4);
  assert.equal(advanced.length, 5);
  assert.equal(new Set(advanced).size, advanced.length);
  assert.equal(new Set(cycling).size, cycling.length);
  assert.notDeepEqual(advanced, cycling);
});

test('workout plans generate distinct exercises for each day focus', () => {
  const sessions = buildWorkoutPlan({ category: 'gym', level: 'steady', durationMinutes: 40, seed: '2026-07-06' });
  const names = sessions.flatMap((session) => session.exercises.map((exercise) => exercise.name));
  const hingeDay = sessions.find((session) => session.title === 'Hinge + core');
  const pushDay = sessions.find((session) => session.title === 'Push strength');

  assert.equal(sessions.length, 4);
  assert.ok(sessions.every((session) => session.exercises.length === 5));
  assert.equal(new Set(names).size, names.length);
  assert.ok(hingeDay?.exercises.some((exercise) => /deadlift|hinge|thrust|core|bug|press/i.test(exercise.name)));
  assert.ok(pushDay?.exercises.some((exercise) => /press/i.test(exercise.name)));
  assert.ok(sessions.every((session) => session.progression.length > 30));
});

test('workout plans respect level, duration, and home progressions', () => {
  const beginner = buildWorkoutPlan({ category: 'calisthenics', level: 'beginner', durationMinutes: 25, seed: '2026-07-06' });
  const advanced = buildWorkoutPlan({ category: 'calisthenics', level: 'advanced', durationMinutes: 55, seed: '2026-07-06' });
  const beginnerNames = beginner.flatMap((session) => session.exercises.map((exercise) => exercise.name));
  const advancedNames = advanced.flatMap((session) => session.exercises.map((exercise) => exercise.name));

  assert.equal(beginner.length, 3);
  assert.ok(beginner.every((session) => session.durationMinutes === 25 && session.exercises.length === 4));
  assert.ok(beginnerNames.includes('Wall push-up') || beginnerNames.includes('Incline push-up'));
  assert.ok(!beginnerNames.includes('Pike push-up'));
  assert.equal(advanced.length, 5);
  assert.ok(advanced.every((session) => session.durationMinutes === 55 && session.exercises.length === 6));
  assert.ok(advancedNames.includes('Pike push-up'));
});

test('workout generation is stable per week but rotates with a new seed', () => {
  const first = buildWorkoutPlan({ category: 'gym', level: 'advanced', durationMinutes: 40, seed: '2026-07-06' });
  const repeated = buildWorkoutPlan({ category: 'gym', level: 'advanced', durationMinutes: 40, seed: '2026-07-06' });
  const nextWeek = buildWorkoutPlan({ category: 'gym', level: 'advanced', durationMinutes: 40, seed: '2026-07-13' });

  assert.deepEqual(first, repeated);
  assert.notDeepEqual(first, nextWeek);
});

test('workout catalog supports week-wide variety and complete local visual mapping', () => {
  const sessions = buildWorkoutPlan({ category: 'cycling', level: 'advanced', durationMinutes: 55, seed: '2026-07-20' });
  const scheduled = sessions.flatMap((session) => session.exercises);
  const scheduledIds = new Set(scheduled.map((exercise) => exercise.id));

  assert.ok(getWorkoutCatalogSize() >= 140);
  assert.deepEqual(getWorkoutVisualIds(), [...workoutVisualOrder]);
  assert.equal(scheduledIds.size, scheduled.length);
  assert.ok(scheduled.every((exercise) => exercise.visualId === exercise.id));
  assert.ok(scheduled.every((exercise) => exercise.alternatives.length > 0));
  assert.ok(scheduled.every((exercise) => exercise.alternatives.every((alternative) =>
    !scheduledIds.has(alternative.id)
    && alternative.visualId === alternative.id
    && alternative.cue.length > 20,
  )));
});
