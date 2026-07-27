import { palette } from '@luminary/design-system';
import type { ExpenseCategory, WorkoutPlan } from '@/stores/useProductionStore';
import { getAllLibraryExercises, getAllLibraryMeals } from '@/lib/contentLibrary';

export type HabitSuggestion = {
  category: string;
  name: string;
  detail: string;
  icon: 'sparkles' | 'health' | 'journal' | 'money' | 'home' | 'clock';
};

export const habitSuggestions: HabitSuggestion[] = [
  { category: 'Morning', name: 'Open the curtains', detail: '2 min / daily', icon: 'sparkles' },
  { category: 'Morning', name: 'Plan one priority', detail: '3 min / weekdays', icon: 'journal' },
  { category: 'Body', name: 'Ten-minute walk', detail: '10 min / daily', icon: 'health' },
  { category: 'Body', name: 'Stretch hips and neck', detail: '6 min / daily', icon: 'health' },
  { category: 'Mind', name: 'One conscious breath', detail: '1 min / anytime', icon: 'sparkles' },
  { category: 'Mind', name: 'Write one honest line', detail: '2 min / evening', icon: 'journal' },
  { category: 'Home', name: 'Reset the room', detail: '5 min / evening', icon: 'home' },
  { category: 'Home', name: 'Dishes before bed', detail: '7 min / evening', icon: 'home' },
  { category: 'Money', name: 'Log one expense', detail: '1 min / daily', icon: 'money' },
  { category: 'Money', name: 'Check tomorrow spend', detail: '2 min / evening', icon: 'money' },
  { category: 'Sleep', name: 'Screen-off wind down', detail: '20 min / nightly', icon: 'clock' },
  { category: 'Sleep', name: 'Water before bed', detail: '1 min / nightly', icon: 'clock' },
  { category: 'Social', name: 'Send one kind message', detail: '3 min / daily', icon: 'sparkles' },
];

export const habitCategories = ['Morning', 'Body', 'Mind', 'Home', 'Money', 'Sleep', 'Social'];

export type MealPreset = {
  name: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  prep: string;
  imageUrl: string;
  source?: 'manual' | 'curated' | 'usda' | 'open_food_facts' | 'themealdb';
  providerId?: string;
  ingredients?: string[];
  allergens?: string[];
};

export const mealPresets: MealPreset[] = getAllLibraryMeals().map((meal) => ({
  name: meal.name,
  mealType: meal.mealType,
  calories: meal.calories,
  proteinG: meal.proteinG,
  carbsG: meal.carbsG,
  fatG: meal.fatG,
  prep: meal.prep,
  imageUrl: meal.imageUrl,
  source: providerToMealSource(meal.source.provider),
  providerId: meal.source.sourceId,
  ingredients: meal.ingredients,
  allergens: meal.allergens,
}));

export type ExercisePreset = {
  name: string;
  detail: string;
  imageUrl: string;
  imageMeta?: ReturnType<typeof getAllLibraryExercises>[number]['imageMeta'];
  equipment?: string[];
  level?: string;
  coachingCue?: string;
};

export const workoutExercises: Record<WorkoutPlan['category'], ExercisePreset[]> = {
  calisthenics: exercisesFor('calisthenics'),
  cardio: exercisesFor('cardio'),
  cycling: exercisesFor('cycling'),
  gym: exercisesFor('gym'),
  yoga: exercisesFor('yoga'),
};

export const exerciseAlternates = ['Step-ups', 'Band row', 'Dead bug', 'Incline press', 'Bike intervals'];

export const journalPrompts = [
  'What did your body keep trying to tell you today?',
  'Name one thing that felt lighter than expected.',
  'What are you carrying into tomorrow?',
  'Where did you feel most like yourself?',
];

export const moodTags = ['calm', 'heavy', 'clear', 'restless', 'proud', 'tired'];

export const categoryMeta: Record<ExpenseCategory, { icon: string; color: string; prompt: string }> = {
  Needs: { icon: 'N', color: palette.tertiary, prompt: 'Rent, groceries, transport' },
  Wants: { icon: 'W', color: palette.secondary, prompt: 'Coffee, takeout, fun' },
  Savings: { icon: 'S', color: palette.primary, prompt: 'Goals and buffers' },
  Emergencies: { icon: 'E', color: palette.error, prompt: 'Unexpected spend' },
};

function exercisesFor(category: WorkoutPlan['category']): ExercisePreset[] {
  return getAllLibraryExercises()
    .filter((exercise) => exercise.category === category)
    .map((exercise) => ({
      name: exercise.name,
      detail: exercise.detail,
      imageUrl: exercise.imageUrl,
      imageMeta: exercise.imageMeta,
      equipment: exercise.equipment,
      level: exercise.level,
      coachingCue: exercise.coachingCue,
    }));
}

function providerToMealSource(provider: ReturnType<typeof getAllLibraryMeals>[number]['source']['provider']): MealPreset['source'] {
  if (provider === 'USDA FoodData Central') return 'usda';
  if (provider === 'Open Food Facts') return 'open_food_facts';
  if (provider === 'TheMealDB') return 'themealdb';
  return 'curated';
}
