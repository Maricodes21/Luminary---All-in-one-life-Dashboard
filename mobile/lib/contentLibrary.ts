export type FoodProvider =
  | 'Curated'
  | 'USDA FoodData Central'
  | 'Open Food Facts'
  | 'TheMealDB'
  | 'wger'
  | 'Spotify'
  | 'Last.fm';

export type SourceAttribution = {
  provider: FoodProvider;
  sourceId: string;
  license: string;
  url?: string;
  lookupMode: 'bundled' | 'cache-first' | 'live';
};

export type LibraryMeal = {
  id: string;
  name: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  prep: string;
  imageUrl: string;
  ingredients: string[];
  allergens: string[];
  tags: string[];
  goalFit: Array<'lose' | 'maintain' | 'gain'>;
  source: SourceAttribution;
};

export type MealSubstitution = {
  mealId: string;
  replace: string;
  with: string;
  reason: string;
};

export type ExerciseLibraryItem = {
  id: string;
  name: string;
  category: 'calisthenics' | 'cardio' | 'cycling' | 'gym' | 'yoga';
  level: 'beginner' | 'steady' | 'advanced';
  equipment: Array<'bodyweight' | 'dumbbells' | 'bike' | 'bands' | 'machine' | 'barbell'>;
  detail: string;
  coachingCue: string;
  imageUrl: string;
  imageMeta: ExerciseImageMeta;
  source: SourceAttribution;
};

export type ExerciseImageMeta = {
  source: 'sourced_photo' | 'generated_illustration';
  alt: string;
  style: 'photo' | 'illustration';
};

export type WorkoutAlternativeQuery = {
  category: ExerciseLibraryItem['category'];
  level: ExerciseLibraryItem['level'];
  equipment?: ExerciseLibraryItem['equipment'];
};

export type BudgetCategory = 'Needs' | 'Wants' | 'Savings' | 'Emergencies';

export type BudgetPlanInput = {
  monthlyIncome: number;
  budgets: Array<{ category: BudgetCategory; limit: number }>;
  spentByCategory: Partial<Record<BudgetCategory, number>>;
};

export type BudgetPlan = {
  totalBudget: number;
  totalSpent: number;
  monthlySurplus: number;
  categories: Record<BudgetCategory, { limit: number; spent: number; remaining: number; percentUsed: number }>;
};

const meals: LibraryMeal[] = [
  {
    id: 'curated_greek_yoghurt_bowl',
    name: 'Greek yoghurt bowl',
    mealType: 'breakfast',
    calories: 420,
    proteinG: 32,
    carbsG: 52,
    fatG: 9,
    prep: 'Layer yoghurt, berries, oats, and chia. Keep the crunch separate until serving.',
    imageUrl: 'https://images.unsplash.com/photo-1511690743698-d9d85f2fbf38?w=400&auto=format&fit=crop',
    ingredients: ['Greek yoghurt', 'berries', 'rolled oats', 'chia'],
    allergens: ['dairy'],
    tags: ['high protein', 'quick', 'breakfast'],
    goalFit: ['lose', 'maintain'],
    source: curatedSource('meal_greek_yoghurt_bowl'),
  },
  {
    id: 'curated_chicken_rice_bowl',
    name: 'Chicken rice bowl',
    mealType: 'lunch',
    calories: 620,
    proteinG: 44,
    carbsG: 70,
    fatG: 18,
    prep: 'Batch chicken and rice, then rotate greens and sauce so it does not feel repeated.',
    imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop',
    ingredients: ['chicken breast', 'rice', 'greens', 'avocado'],
    allergens: [],
    tags: ['meal prep', 'chicken', 'balanced'],
    goalFit: ['maintain', 'gain'],
    source: curatedSource('meal_chicken_rice_bowl'),
  },
  {
    id: 'usda_chicken_breast_plate',
    name: 'Chicken breast, potatoes, greens',
    mealType: 'dinner',
    calories: 560,
    proteinG: 48,
    carbsG: 52,
    fatG: 14,
    prep: 'Roast potatoes while chicken cooks. Add lemon and herbs at the end.',
    imageUrl: 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=400&auto=format&fit=crop',
    ingredients: ['chicken breast', 'potatoes', 'green beans'],
    allergens: [],
    tags: ['USDA', 'lean protein', 'dinner', 'chicken'],
    goalFit: ['lose', 'maintain'],
    source: {
      provider: 'USDA FoodData Central',
      sourceId: 'fdc_seed_chicken_breast',
      license: 'Public domain data, normalized by Luminary',
      url: 'https://fdc.nal.usda.gov/',
      lookupMode: 'cache-first',
    },
  },
  {
    id: 'off_oats_milk_snack',
    name: 'Oats and protein milk',
    mealType: 'snack',
    calories: 360,
    proteinG: 30,
    carbsG: 42,
    fatG: 8,
    prep: 'Use barcode lookup for packaged protein milk, then save the serving as a recent.',
    imageUrl: 'https://images.unsplash.com/photo-1517673132405-a56a62b18caf?w=400&auto=format&fit=crop',
    ingredients: ['oats', 'protein milk', 'banana'],
    allergens: ['dairy'],
    tags: ['Open Food Facts', 'barcode', 'snack', 'gain'],
    goalFit: ['gain', 'maintain'],
    source: {
      provider: 'Open Food Facts',
      sourceId: 'off_seed_oats_protein_milk',
      license: 'Open Database License, cached with attribution',
      url: 'https://world.openfoodfacts.org/',
      lookupMode: 'cache-first',
    },
  },
  {
    id: 'themealdb_salmon_greens',
    name: 'Salmon and greens',
    mealType: 'dinner',
    calories: 610,
    proteinG: 42,
    carbsG: 34,
    fatG: 32,
    prep: 'Pan-sear salmon, steam greens, and finish with couscous or potatoes depending on target.',
    imageUrl: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400&auto=format&fit=crop',
    ingredients: ['salmon', 'greens', 'couscous'],
    allergens: ['fish'],
    tags: ['recipe', 'omega fats', 'dinner'],
    goalFit: ['maintain', 'gain'],
    source: {
      provider: 'TheMealDB',
      sourceId: 'themealdb_seed_salmon',
      license: 'Recipe inspiration cached only when terms permit production use',
      url: 'https://www.themealdb.com/api.php',
      lookupMode: 'cache-first',
    },
  },
  {
    id: 'curated_peanut_butter_smoothie',
    name: 'Peanut butter smoothie',
    mealType: 'snack',
    calories: 520,
    proteinG: 32,
    carbsG: 54,
    fatG: 20,
    prep: 'Blend milk, banana, peanut butter, oats, and protein powder. Split into two if appetite is low.',
    imageUrl: 'https://images.unsplash.com/photo-1505252585461-04db1eb84625?w=400&auto=format&fit=crop',
    ingredients: ['milk', 'banana', 'peanut butter', 'oats', 'protein powder'],
    allergens: ['dairy', 'peanuts'],
    tags: ['gain', 'smoothie', 'quick'],
    goalFit: ['gain'],
    source: curatedSource('meal_peanut_butter_smoothie'),
  },
];

const substitutions: MealSubstitution[] = [
  { mealId: 'curated_chicken_rice_bowl', replace: 'chicken breast', with: 'tofu or tuna', reason: 'Keeps protein high with different prep effort.' },
  { mealId: 'curated_chicken_rice_bowl', replace: 'rice', with: 'potatoes or couscous', reason: 'Same carb role, different texture.' },
  { mealId: 'usda_chicken_breast_plate', replace: 'potatoes', with: 'rice or butternut', reason: 'Adjusts volume without changing the protein anchor.' },
  { mealId: 'themealdb_salmon_greens', replace: 'salmon', with: 'hake or chicken thighs', reason: 'Lower cost option while keeping dinner substantial.' },
  { mealId: 'curated_peanut_butter_smoothie', replace: 'peanut butter', with: 'tahini or extra oats', reason: 'Useful for peanut allergies or lighter fat targets.' },
];

const exercises: ExerciseLibraryItem[] = [
  exercise('wger_push_up', 'Push-ups', 'calisthenics', 'beginner', ['bodyweight'], '3 sets x 8-12', 'Hands under shoulders, ribs tucked.', 'https://images.unsplash.com/photo-1598971639058-fab3c3109a00?w=400&auto=format&fit=crop'),
  exercise('wger_split_squat', 'Split squats', 'calisthenics', 'beginner', ['bodyweight', 'dumbbells'], '3 sets x 8 each side', 'Tall torso, controlled knee travel.', 'https://images.unsplash.com/photo-1434682881908-b43d0467b798?w=400&auto=format&fit=crop'),
  exercise('wger_band_row', 'Band row', 'calisthenics', 'beginner', ['bands'], '3 sets x 12', 'Pull elbows toward back pockets.', 'https://images.unsplash.com/photo-1517963879433-6ad2b056d712?w=400&auto=format&fit=crop'),
  exercise('wger_easy_run', 'Easy run', 'cardio', 'beginner', ['bodyweight'], '25-35 min zone 2', 'You should be able to speak in short sentences.', 'https://images.unsplash.com/photo-1502904550040-7534597429ae?w=400&auto=format&fit=crop'),
  exercise('wger_intervals', 'Run intervals', 'cardio', 'steady', ['bodyweight'], '8 x 45 sec hard', 'Walk until breathing settles between efforts.', 'https://images.unsplash.com/photo-1486218119243-13883505764c?w=400&auto=format&fit=crop'),
  exercise('wger_endurance_ride', 'Endurance ride', 'cycling', 'beginner', ['bike'], '45 min steady', 'Keep cadence smooth before adding intensity.', 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=400&auto=format&fit=crop'),
  exercise('wger_hill_repeats', 'Hill repeats', 'cycling', 'steady', ['bike'], '6 climbs / easy roll down', 'Stay seated for the first half of each climb.', 'https://images.unsplash.com/photo-1506316940527-4d1c138978a0?w=400&auto=format&fit=crop'),
  exercise('wger_dumbbell_row', 'Dumbbell row', 'gym', 'beginner', ['dumbbells'], '3 sets x 8-10', 'Pause at the ribs; do not twist open.', 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=400&auto=format&fit=crop'),
  exercise('wger_goblet_squat', 'Goblet squat', 'gym', 'beginner', ['dumbbells'], '4 sets x 8', 'Elbows inside knees, full foot pressure.', 'https://images.unsplash.com/photo-1534367610401-9f5ed68180aa?w=400&auto=format&fit=crop'),
  exercise('wger_incline_press', 'Incline dumbbell press', 'gym', 'steady', ['dumbbells'], '3 sets x 10', 'Lower slowly; press without shrugging.', 'https://images.unsplash.com/photo-1532029837206-abbe2b7620e3?w=400&auto=format&fit=crop'),
  exercise('wger_barbell_deadlift', 'Barbell deadlift', 'gym', 'advanced', ['barbell'], '5 sets x 3', 'Brace first, then push the floor away.', 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400&auto=format&fit=crop'),
  exercise('curated_cat_cow', 'Cat-cow', 'yoga', 'beginner', ['bodyweight'], '45 sec, easy pace', 'Move one vertebra at a time and follow your breath.', 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&auto=format&fit=crop'),
  exercise('curated_downward_dog', 'Downward dog', 'yoga', 'beginner', ['bodyweight'], '40 sec', 'Bend your knees enough to lengthen your spine.', 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&auto=format&fit=crop'),
  exercise('curated_low_lunge', 'Low lunge', 'yoga', 'beginner', ['bodyweight'], '35 sec each side', 'Keep the front foot planted and let the hips soften.', 'https://images.unsplash.com/photo-1599447421416-3414500d18a5?w=400&auto=format&fit=crop'),
  exercise('curated_warrior_two', 'Warrior II', 'yoga', 'steady', ['bodyweight'], '35 sec each side', 'Reach through both hands and track the front knee over the toes.', 'https://images.unsplash.com/photo-1575052814086-f385e2e2ad1b?w=400&auto=format&fit=crop'),
  exercise('curated_tree_pose', 'Tree pose', 'yoga', 'steady', ['bodyweight'], '30 sec each side', 'Fix your eyes on one point and keep the standing knee soft.', 'https://images.unsplash.com/photo-1593811167562-9cef47bfc4d7?w=400&auto=format&fit=crop'),
  exercise('curated_half_moon', 'Half moon', 'yoga', 'advanced', ['bodyweight'], '25 sec each side', 'Stack the hips gradually and use a wall when balance feels uncertain.', 'https://images.unsplash.com/photo-1588286840104-8957b019727f?w=400&auto=format&fit=crop'),
];

export function searchContentLibrary(term: string) {
  const query = term.trim().toLowerCase();
  const matchingMeals = query
    ? meals.filter((meal) => searchableMealText(meal).includes(query))
    : meals;
  const matchingExercises = query
    ? exercises.filter((item) => searchableExerciseText(item).includes(query))
    : exercises;

  return {
    meals: matchingMeals,
    exercises: matchingExercises,
  };
}

export function getAllLibraryMeals() {
  return meals;
}

export function getAllLibraryExercises() {
  return exercises;
}

export function getMealSuggestions(goal: LibraryMeal['goalFit'][number], mealType?: LibraryMeal['mealType']) {
  return meals.filter((meal) => meal.goalFit.includes(goal) && (!mealType || meal.mealType === mealType));
}

export function getSubstitutionsForMeal(mealId: string) {
  return substitutions.filter((item) => item.mealId === mealId);
}

export function getWorkoutAlternatives(query: WorkoutAlternativeQuery) {
  const allowedLevel = levelRank(query.level);
  return exercises.filter((exerciseItem) => {
    if (exerciseItem.category !== query.category) return false;
    if (levelRank(exerciseItem.level) > allowedLevel) return false;
    if (!query.equipment?.length) return true;
    return exerciseItem.equipment.some((item) => query.equipment?.includes(item));
  });
}

export function getFoodSourceSummary() {
  return {
    lookupPolicy: 'cache-first' as const,
    primarySources: [
      {
        provider: 'USDA FoodData Central' as const,
        useFor: 'Generic foods and nutrition targets',
        cost: 'Free API key',
      },
      {
        provider: 'Open Food Facts' as const,
        useFor: 'Packaged and barcode foods',
        cost: 'Free/open with attribution and rate-limit care',
      },
      {
        provider: 'Curated' as const,
        useFor: 'Meal prep instructions, substitutions, and quality control',
        cost: 'Bundled with the app',
      },
    ],
  };
}

export function getExerciseSourceSummary() {
  return {
    lookupPolicy: 'seed-and-cache' as const,
    primarySources: [
      {
        provider: 'wger' as const,
        useFor: 'Exercise library and movement taxonomy',
        cost: 'Free/open data, normalized into Luminary',
      },
      {
        provider: 'Curated' as const,
        useFor: 'Coaching cues, substitutions, and app-safe programs',
        cost: 'Bundled with the app',
      },
    ],
  };
}

export function getMusicSourceSummary() {
  return {
    recommendation: 'spotify-direct' as const,
    primarySources: [
      {
        provider: 'Spotify' as const,
        useFor: 'Direct recently-played and top-artist recaps',
        cost: 'Free API with OAuth and app-level rate limits',
      },
      {
        provider: 'Last.fm' as const,
        useFor: 'Optional alternate history for users who already scrobble',
        cost: 'Free-ish but not a default production proxy',
      },
    ],
  };
}

export function buildBudgetPlan(input: BudgetPlanInput): BudgetPlan {
  const categories: BudgetCategory[] = ['Needs', 'Wants', 'Savings', 'Emergencies'];
  const totalBudget = input.budgets.reduce((sum, budget) => sum + budget.limit, 0);
  const totalSpent = categories.reduce((sum, category) => sum + (input.spentByCategory[category] ?? 0), 0);
  const categoryPlans = categories.reduce<BudgetPlan['categories']>((acc, category) => {
    const limit = input.budgets.find((budget) => budget.category === category)?.limit ?? 0;
    const spent = input.spentByCategory[category] ?? 0;
    acc[category] = {
      limit,
      spent,
      remaining: Math.max(0, limit - spent),
      percentUsed: limit > 0 ? Math.round((spent / limit) * 100) : 0,
    };
    return acc;
  }, {} as BudgetPlan['categories']);

  return {
    totalBudget,
    totalSpent,
    monthlySurplus: input.monthlyIncome - totalBudget,
    categories: categoryPlans,
  };
}

function curatedSource(sourceId: string): SourceAttribution {
  return {
    provider: 'Curated',
    sourceId,
    license: 'Luminary curated starter catalog',
    lookupMode: 'bundled',
  };
}

function exercise(
  id: string,
  name: string,
  category: ExerciseLibraryItem['category'],
  level: ExerciseLibraryItem['level'],
  equipment: ExerciseLibraryItem['equipment'],
  detail: string,
  coachingCue: string,
  imageUrl: string,
): ExerciseLibraryItem {
  return {
    id,
    name,
    category,
    level,
    equipment,
    detail,
    coachingCue,
    imageUrl,
    imageMeta: {
      source: 'sourced_photo',
      alt: `${name} exercise reference photo`,
      style: 'photo',
    },
    source: {
      provider: 'wger',
      sourceId: id,
      license: 'wger exercise catalog, normalized with Luminary cues',
      url: 'https://wger.de/',
      lookupMode: 'cache-first',
    },
  };
}

function searchableMealText(meal: LibraryMeal) {
  return [meal.name, meal.mealType, ...meal.tags, ...meal.ingredients, meal.source.provider].join(' ').toLowerCase();
}

function searchableExerciseText(item: ExerciseLibraryItem) {
  return [item.name, item.category, item.level, ...item.equipment, item.source.provider].join(' ').toLowerCase();
}

function levelRank(level: ExerciseLibraryItem['level']) {
  if (level === 'beginner') return 1;
  if (level === 'steady') return 2;
  return 3;
}
