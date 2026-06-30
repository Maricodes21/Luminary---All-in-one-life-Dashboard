import { palette } from '@luminary/design-system';
import type { ExpenseCategory, WorkoutPlan } from '@/stores/useProductionStore';

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
};

export const mealPresets: MealPreset[] = [
  {
    name: 'Greek yoghurt bowl',
    mealType: 'breakfast',
    calories: 420,
    proteinG: 32,
    carbsG: 52,
    fatG: 9,
    prep: 'High-protein breakfast base.',
    imageUrl: 'https://images.unsplash.com/photo-1511690743698-d9d85f2fbf38?w=400&auto=format&fit=crop',
  },
  {
    name: 'Chicken rice bowl',
    mealType: 'lunch',
    calories: 620,
    proteinG: 44,
    carbsG: 70,
    fatG: 18,
    prep: 'Easy prep bowl for steady days.',
    imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop',
  },
  {
    name: 'Salmon and greens',
    mealType: 'dinner',
    calories: 610,
    proteinG: 42,
    carbsG: 34,
    fatG: 32,
    prep: 'Omega-rich dinner with simple sides.',
    imageUrl: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400&auto=format&fit=crop',
  },
  {
    name: 'Smoothie and oats',
    mealType: 'snack',
    calories: 330,
    proteinG: 24,
    carbsG: 44,
    fatG: 8,
    prep: 'Fast add when the day is light.',
    imageUrl: 'https://images.unsplash.com/photo-1505252585461-04db1eb84625?w=400&auto=format&fit=crop',
  },
];

export type ExercisePreset = {
  name: string;
  detail: string;
  imageUrl: string;
};

export const workoutExercises: Record<WorkoutPlan['category'], ExercisePreset[]> = {
  calisthenics: [
    {
      name: 'Push-ups',
      detail: '3 sets x 10-12',
      imageUrl: 'https://images.unsplash.com/photo-1598971639058-fab3c3109a00?w=400&auto=format&fit=crop',
    },
    {
      name: 'Split squats',
      detail: '3 sets x 8 each side',
      imageUrl: 'https://images.unsplash.com/photo-1434682881908-b43d0467b798?w=400&auto=format&fit=crop',
    },
    {
      name: 'Hollow hold',
      detail: '4 rounds x 30 sec',
      imageUrl: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400&auto=format&fit=crop',
    },
  ],
  cardio: [
    {
      name: 'Easy run',
      detail: '30 min zone 2',
      imageUrl: 'https://images.unsplash.com/photo-1502904550040-7534597429ae?w=400&auto=format&fit=crop',
    },
    {
      name: 'Intervals',
      detail: '8 x 45 sec hard',
      imageUrl: 'https://images.unsplash.com/photo-1486218119243-13883505764c?w=400&auto=format&fit=crop',
    },
    {
      name: 'Recovery walk',
      detail: '25 min relaxed',
      imageUrl: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=400&auto=format&fit=crop',
    },
  ],
  cycling: [
    {
      name: 'Endurance ride',
      detail: '45 min steady',
      imageUrl: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=400&auto=format&fit=crop',
    },
    {
      name: 'Hill repeats',
      detail: '6 climbs / easy roll down',
      imageUrl: 'https://images.unsplash.com/photo-1506316940527-4d1c138978a0?w=400&auto=format&fit=crop',
    },
    {
      name: 'Easy spin',
      detail: '25 min low pressure',
      imageUrl: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=400&auto=format&fit=crop',
    },
  ],
  gym: [
    {
      name: 'Dumbbell row',
      detail: '3 sets x 8-10',
      imageUrl: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=400&auto=format&fit=crop',
    },
    {
      name: 'Goblet squat',
      detail: '4 sets x 8',
      imageUrl: 'https://images.unsplash.com/photo-1534367610401-9f5ed68180aa?w=400&auto=format&fit=crop',
    },
    {
      name: 'Overhead press',
      detail: '3 sets x 8',
      imageUrl: 'https://images.unsplash.com/photo-1532029837206-abbe2b7620e3?w=400&auto=format&fit=crop',
    },
  ],
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
